-- Idempotent non-destructive migration for push_subscriptions table
-- Handles existing table, missing endpoint column, data migration from subscription->>'endpoint', constraint updates, and strict RLS policies.

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  class_id uuid not null,
  endpoint text,
  subscription jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- If endpoint column already exists or was just created, ensure data migration and null/duplicate safety
do $$
begin
  -- Add endpoint column if it does not exist
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'push_subscriptions' 
      and column_name = 'endpoint'
  ) then
    alter table public.push_subscriptions add column endpoint text;
  end if;

  -- Backfill endpoint from subscription jsonb if endpoint is null
  update public.push_subscriptions
  set endpoint = subscription->>'endpoint'
  where endpoint is null or endpoint = '';

  -- Fail explicitly if any row has no valid endpoint extracted
  if exists (select 1 from public.push_subscriptions where endpoint is null or endpoint = '') then
    raise exception 'Migration failed: push_subscriptions table contains rows with missing or invalid endpoint that could not be auto-migrated.';
  end if;

  -- Make endpoint NOT NULL after successful backfill
  alter table public.push_subscriptions alter column endpoint set not null;
end $$;

-- Drop old unique constraint whose columns are strictly user_id + class_id (preserving PK and other unicity)
do $$
declare
  r record;
  cols text[];
begin
  for r in
    select c.conname, t.oid as rel_oid, c.conkey
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'push_subscriptions'
      and c.contype = 'u'
  loop
    select array_agg(attname::text order by attnum) into cols
    from pg_attribute
    where attrelid = r.rel_oid
      and attnum = any(r.conkey);

    if cols = array['class_id', 'user_id']::text[] or cols = array['user_id', 'class_id']::text[] then
      execute 'alter table public.push_subscriptions drop constraint ' || quote_ident(r.conname);
    end if;
  end loop;
end $$;

-- Before creating unique constraint on (user_id, endpoint), check for duplicate pairs and raise explicit error if found
do $$
begin
  if exists (
    select user_id, endpoint
    from public.push_subscriptions
    where endpoint is not null
    group by user_id, endpoint
    having count(*) > 1
  ) then
    raise exception 'Migration failed: duplicate (user_id, endpoint) pairs exist in push_subscriptions, preventing creation of unique constraint.';
  end if;
end $$;

-- Ensure unique constraint on exactly (user_id, endpoint) exists for multi-device support
do $$
declare
  r record;
  cols text[];
  exists_correct_constraint boolean := false;
begin
  for r in
    select c.conname, t.oid as rel_oid, c.conkey
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'push_subscriptions'
      and c.contype = 'u'
  loop
    select array_agg(attname::text order by attnum) into cols
    from pg_attribute
    where attrelid = r.rel_oid
      and attnum = any(r.conkey);

    if cols = array['endpoint', 'user_id']::text[] or cols = array['user_id', 'endpoint']::text[] then
      exists_correct_constraint := true;
    end if;
  end loop;

  if not exists_correct_constraint then
    alter table public.push_subscriptions add constraint user_endpoint_unique unique (user_id, endpoint);
  end if;
end $$;

-- Ensure RLS is active on the table
alter table public.push_subscriptions enable row level security;

-- Revoke permissions from public/anon, grant only to authenticated
revoke all on public.push_subscriptions from public, anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Safely drop all existing policies on public.push_subscriptions (including old permissive ones)
drop policy if exists "Users can manage their own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can select their own push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can insert their own push subscriptions for their classes" on public.push_subscriptions;
drop policy if exists "Users can update their own push subscriptions for current classes" on public.push_subscriptions;
drop policy if exists "Users can delete their own push subscriptions" on public.push_subscriptions;

-- Create separate valid SQL policies for SELECT, INSERT, UPDATE, DELETE
create policy "Users can select their own push subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push subscriptions for their classes"
  on public.push_subscriptions
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.class_members
      where class_members.user_id = auth.uid()
        and class_members.class_id = push_subscriptions.class_id
    )
  );

create policy "Users can update their own push subscriptions for current classes"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.class_members
      where class_members.user_id = auth.uid()
        and class_members.class_id = push_subscriptions.class_id
    )
  );

create policy "Users can delete their own push subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

-- Indexes for fast dispatch
create index if not exists idx_push_subscriptions_class_id on public.push_subscriptions(class_id);
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

-- Ensure schema permissions and function permissions for RLS policies
grant usage on schema public to authenticated, anon, service_role;
grant execute on all functions in schema public to authenticated, anon, service_role;
alter default privileges in schema public grant execute on functions to authenticated, anon, service_role;

-- Grant permissions and set SECURITY DEFINER dynamically on key helper functions (is_class_member, get_class_role, toggle_volunteer_reservation)
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as func_signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' 
      and p.proname in ('is_class_member', 'get_class_role', 'toggle_volunteer_reservation')
  loop
    execute format('grant execute on function %s to authenticated, anon, service_role', r.func_signature);
    execute format('alter function %s security definer', r.func_signature);
  end loop;
exception when others then
  null;
end $$;
