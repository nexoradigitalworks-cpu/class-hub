-- Idempotent, non-destructive migration for Push Preferences, Interrogations Archive & Volunteer Management
-- Preserves all existing data, classes, profiles and relations.

-- 1. Push Preferences column in push_subscriptions
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'push_subscriptions' 
      and column_name = 'preferences'
  ) then
    alter table public.push_subscriptions 
      add column preferences jsonb default '{"verifiche":true,"interrogazioni":true,"eventi":true,"avvisi":true,"promemoria":true,"materiali":true,"sondaggi":true}'::jsonb;
  end if;
end $$;

-- 2. Status & Notes columns in interrogation_volunteers
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'interrogation_volunteers' 
      and column_name = 'status'
  ) then
    alter table public.interrogation_volunteers 
      add column status text default 'VOLUNTEER';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'interrogation_volunteers' 
      and column_name = 'notes'
  ) then
    alter table public.interrogation_volunteers 
      add column notes text;
  end if;
end $$;

-- 3. Scheduled Reminders Log table to prevent duplicate push notifications
create table if not exists public.scheduled_reminders_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  reference_id uuid not null,
  reminder_type text not null, -- 'DAY_BEFORE' | 'MORNING_OF'
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_ref_reminder unique(user_id, reference_id, reminder_type)
);

create index if not exists idx_reminders_log_user_ref 
  on public.scheduled_reminders_log(user_id, reference_id, reminder_type);

-- 4. RLS for scheduled_reminders_log
alter table public.scheduled_reminders_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'scheduled_reminders_log' and policyname = 'Users can view own reminder logs'
  ) then
    create policy "Users can view own reminder logs" on public.scheduled_reminders_log
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'scheduled_reminders_log' and policyname = 'Authenticated users can insert own reminder logs'
  ) then
    create policy "Authenticated users can insert own reminder logs" on public.scheduled_reminders_log
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 5. RLS for Admin and Controller manual volunteer management
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'interrogation_volunteers' and policyname = 'Admins and controllers can manage all class volunteers'
  ) then
    create policy "Admins and controllers can manage all class volunteers" on public.interrogation_volunteers
      for all
      using (
        exists (
          select 1 from public.interrogations i
          join public.class_members cm on cm.class_id = i.class_id
          where i.id = interrogation_volunteers.interrogation_id
            and cm.user_id = auth.uid()
            and cm.role in ('ADMIN', 'CONTROLLER')
        )
      )
      with check (
        exists (
          select 1 from public.interrogations i
          join public.class_members cm on cm.class_id = i.class_id
          where i.id = interrogation_volunteers.interrogation_id
            and cm.user_id = auth.uid()
            and cm.role in ('ADMIN', 'CONTROLLER')
        )
      );
  end if;
end $$;
