-- ============================================================================
-- CLASSHUB PRODUCTION RECOVERY MIGRATION (Idempotent & Production-Hardened)
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Grant usage on schema public (needed for standard postgrest queries)
grant usage on schema public to authenticated, anon;

-- 2. PROFILES TABLE & AUTH TRIGGER
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default 'Studente',
  last_name text not null default 'ClassHub',
  email text not null default '',
  avatar_id text not null default 'avatar-blue',
  active_class_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_first_name text;
  v_last_name text;
  v_avatar_id text;
begin
  v_first_name := coalesce(nullif(trim(new.raw_user_meta_data->>'first_name'), ''), 'Studente');
  v_last_name := coalesce(nullif(trim(new.raw_user_meta_data->>'last_name'), ''), 'ClassHub');
  v_avatar_id := coalesce(nullif(trim(new.raw_user_meta_data->>'avatar_id'), ''), 'avatar-blue');

  insert into public.profiles (id, first_name, last_name, email, avatar_id, created_at, updated_at)
  values (new.id, v_first_name, v_last_name, coalesce(new.email, ''), v_avatar_id, now(), now())
  on conflict (id) do update
  set
    first_name = case when public.profiles.first_name = 'Studente' and excluded.first_name <> 'Studente' then excluded.first_name else public.profiles.first_name end,
    last_name = case when public.profiles.last_name = 'ClassHub' and excluded.last_name <> 'ClassHub' then excluded.last_name else public.profiles.last_name end,
    email = excluded.email,
    updated_at = now();

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth.users missing in public.profiles
insert into public.profiles (id, first_name, last_name, email, avatar_id, created_at, updated_at)
select 
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'first_name'), ''), 'Studente'),
  coalesce(nullif(trim(u.raw_user_meta_data->>'last_name'), ''), 'ClassHub'),
  coalesce(u.email, ''),
  coalesce(nullif(trim(u.raw_user_meta_data->>'avatar_id'), ''), 'avatar-blue'),
  now(),
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 3. CLASSES TABLE
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique not null,
  school_name text not null default 'Scuola Superiore',
  academic_year text not null default '2026/2027',
  created_by uuid references auth.users(id) on delete set null,
  allow_self_join boolean not null default true,
  lock_volunteers_on_deadline boolean not null default false,
  controller_can_create_notices boolean not null default true,
  admin_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Foreign key for profiles.active_class_id
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_active_class_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_active_class_id_fkey
      foreign key (active_class_id) references public.classes(id) on delete set null;
  end if;
exception when others then null;
end $$;

-- 3b. CLASS ROLE ENUM (Idempotent creation for clean deployments)
do $$
begin
  if not exists (
    select 1 from pg_type t 
    join pg_namespace n on n.oid = t.typnamespace 
    where n.nspname = 'public' and t.typname = 'class_role'
  ) then
    create type public.class_role as enum ('STUDENT', 'CONTROLLER', 'ADMIN');
  end if;
end $$;

-- 4. CLASS MEMBERS TABLE
create table if not exists public.class_members (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.class_role not null default 'STUDENT'::public.class_role,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, user_id)
);

create index if not exists idx_class_members_user on public.class_members(user_id);
create index if not exists idx_class_members_class on public.class_members(class_id);

-- 5. SUBJECTS TABLE
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  category text not null default 'ALTRO',
  color text not null default '#6366f1',
  default_teacher text,
  default_room text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_subjects_class on public.subjects(class_id);

-- 6. TIMETABLE SLOTS TABLE
create table if not exists public.timetable_slots (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 6),
  hour int not null check (hour between 1 and 10),
  time_range text not null,
  subject_name text not null,
  teacher text,
  room text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, day_of_week, hour)
);

create index if not exists idx_timetable_slots_class on public.timetable_slots(class_id);

-- 7. EVENTS TABLE
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text,
  type text not null default 'EVENTO',
  event_date text not null,
  start_time text not null,
  end_time text,
  description text,
  teacher text,
  is_personal boolean not null default false,
  interrogation_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_events_class on public.events(class_id);
create index if not exists idx_events_author on public.events(author_id);
create index if not exists idx_events_date on public.events(event_date);

-- 8. INTERROGATIONS TABLE
create table if not exists public.interrogations (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text not null,
  interrogation_date text not null,
  start_time text not null,
  end_time text,
  max_volunteers int not null default 3 check (max_volunteers > 0),
  deadline text,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  teacher text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_interrogations_class on public.interrogations(class_id);
create index if not exists idx_interrogations_date on public.interrogations(interrogation_date);

-- 9. INTERROGATION VOLUNTEERS TABLE
create table if not exists public.interrogation_volunteers (
  id uuid default gen_random_uuid() primary key,
  interrogation_id uuid not null references public.interrogations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(interrogation_id, user_id)
);

create index if not exists idx_volunteers_interrogation on public.interrogation_volunteers(interrogation_id);
create index if not exists idx_volunteers_user on public.interrogation_volunteers(user_id);

-- 9b. NOTICE PRIORITY ENUM (Verifica e creazione idempotente dei valori attesi)
do $$
declare
  v_type_oid oid;
  v_has_normal boolean;
  v_has_high boolean;
begin
  select t.oid into v_type_oid
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'notice_priority';

  if v_type_oid is null then
    create type public.notice_priority as enum ('NORMAL', 'HIGH');
  else
    select exists (select 1 from pg_enum where enumtypid = v_type_oid and enumlabel = 'NORMAL') into v_has_normal;
    select exists (select 1 from pg_enum where enumtypid = v_type_oid and enumlabel = 'HIGH') into v_has_high;

    if not (v_has_normal and v_has_high) then
      raise exception 'Tipo enum public.notice_priority esistente non contiene i valori attesi (NORMAL, HIGH). Interruzione di sicurezza.';
    end if;
  end if;
end $$;

-- 10. NOTICES TABLE
create table if not exists public.notices (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  notice_date date not null default CURRENT_DATE,
  priority public.notice_priority not null default 'NORMAL'::public.notice_priority,
  linked_event_id uuid references public.events(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Verifica e allineamento rigoroso della colonna notices.priority
do $$
declare
  v_col_type text;
  v_col_udt text;
  v_is_nullable text;
  v_col_default text;
  v_invalid_count int;
  v_sample_invalid text;
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'notices'
  ) then
    select data_type, udt_name, is_nullable, column_default 
    into v_col_type, v_col_udt, v_is_nullable, v_col_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'notices' and column_name = 'priority';

    -- CASO 1: La tabella notices esiste ma la colonna priority è assente
    if v_col_type is null then
      alter table public.notices 
        add column priority public.notice_priority not null default 'NORMAL'::public.notice_priority;

    -- CASO 2: La colonna priority esiste ed è già del tipo enum corretto (public.notice_priority)
    elsif v_col_udt = 'notice_priority' then
      -- Nessuna alterazione al tipo della colonna.
      -- Preserva le proprietà esistenti; allinea default o not-null solo se documentatamente mancanti.
      if v_col_default is null then
        alter table public.notices 
          alter column priority set default 'NORMAL'::public.notice_priority;
      end if;
      if v_is_nullable = 'YES' then
        alter table public.notices 
          alter column priority set not null;
      end if;

    -- CASO 3: La colonna esiste ma è di tipo text o character varying
    elsif v_col_type in ('text', 'character varying') then
      -- Verifica preventiva sui dati: blocca la migrazione se sono presenti valori nulli o non ammessi
      select count(*), max(priority)
      into v_invalid_count, v_sample_invalid
      from public.notices
      where priority is null or priority not in ('NORMAL', 'HIGH');

      if v_invalid_count > 0 then
        raise exception 'Impossibile convertire notices.priority: trovate % righe con valori non validi o nulli (es. "%"). Valori ammessi: NORMAL, HIGH.', v_invalid_count, v_sample_invalid;
      end if;

      -- Conversione sicura preservando i dati originali
      alter table public.notices 
        alter column priority drop default;

      alter table public.notices 
        alter column priority type public.notice_priority 
        using (priority::public.notice_priority);

      alter table public.notices 
        alter column priority set default 'NORMAL'::public.notice_priority;
      alter table public.notices 
        alter column priority set not null;

    -- CASO 4: Tipo imprevisto (es. integer, boolean, jsonb)
    else
      raise exception 'Tipo imprevisto per la colonna public.notices.priority (data_type="%", udt_name="%"). Revisione manuale richiesta.', v_col_type, v_col_udt;
    end if;
  end if;
end $$;

create index if not exists idx_notices_class on public.notices(class_id);
create index if not exists idx_notices_date on public.notices(notice_date);

-- 11. MATERIALS TABLE
create table if not exists public.materials (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text not null,
  title text not null,
  description text,
  url text,
  storage_path text,
  file_name text,
  file_size bigint,
  file_type text not null default 'PDF',
  material_date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_materials_class on public.materials(class_id);

-- 12. SURVEYS & VOTES
create table if not exists public.surveys (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  question text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  deadline text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.survey_options (
  id uuid default gen_random_uuid() primary key,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.survey_votes (
  id uuid default gen_random_uuid() primary key,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  option_id uuid not null references public.survey_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(survey_id, user_id)
);

create index if not exists idx_surveys_class on public.surveys(class_id);
create index if not exists idx_survey_options_survey on public.survey_options(survey_id);
create index if not exists idx_survey_votes_survey on public.survey_votes(survey_id);

-- 13. REPRESENTATION ITEMS TABLE
create table if not exists public.representation_items (
  id uuid default gen_random_uuid() primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'PROPOSTA',
  title text not null,
  description text not null,
  status text not null default 'IN_ATTESA',
  item_date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_representation_class on public.representation_items(class_id);

-- 14. ENSURE POSTGREST FOREIGN KEYS TO PROFILES
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'class_members_user_id_profiles_fkey') then
    alter table public.class_members add constraint class_members_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'events_author_id_profiles_fkey') then
    alter table public.events add constraint events_author_id_profiles_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'interrogations_created_by_profiles_fkey') then
    alter table public.interrogations add constraint interrogations_created_by_profiles_fkey foreign key (created_by) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'interrogation_volunteers_user_id_profiles_fkey') then
    alter table public.interrogation_volunteers add constraint interrogation_volunteers_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notices_author_id_profiles_fkey') then
    alter table public.notices add constraint notices_author_id_profiles_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'materials_uploaded_by_profiles_fkey') then
    alter table public.materials add constraint materials_uploaded_by_profiles_fkey foreign key (uploaded_by) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surveys_author_id_profiles_fkey') then
    alter table public.surveys add constraint surveys_author_id_profiles_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'survey_votes_user_id_profiles_fkey') then
    alter table public.survey_votes add constraint survey_votes_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'representation_items_author_id_profiles_fkey') then
    alter table public.representation_items add constraint representation_items_author_id_profiles_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
  end if;
exception when others then null;
end $$;

-- 15. SECURE RLS HELPER FUNCTIONS (SECURITY DEFINER, explicit search_path)
create or replace function public.is_class_member(p_class_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.class_members
    where class_id = p_class_id and user_id = coalesce(p_user_id, auth.uid())
  );
$$;

revoke all on function public.is_class_member(uuid, uuid) from public, anon;
grant execute on function public.is_class_member(uuid, uuid) to authenticated, service_role;

create or replace function public.get_class_role(
  p_class_id uuid,
  p_user_id uuid default auth.uid()
)
returns public.class_role
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select cm.role
  from public.class_members as cm
  where cm.class_id = p_class_id
    and cm.user_id = coalesce(p_user_id, auth.uid())
  limit 1;
$$;

revoke all on function public.get_class_role(uuid, uuid) from public, anon;
grant execute on function public.get_class_role(uuid, uuid) to authenticated, service_role;

-- 16. SECURE APPLICATION RPCs

-- create_class
create or replace function public.create_class(
  p_name text,
  p_school_name text default 'Scuola Superiore',
  p_academic_year text default '2026/2027',
  p_allow_self_join boolean default true
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_class_id uuid;
  v_code text;
  v_attempt int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non autorizzato: autenticazione richiesta';
  end if;

  if trim(p_name) is null or length(trim(p_name)) < 2 then
    raise exception 'Il nome della classe deve contenere almeno 2 caratteri';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  -- Ensure profile exists
  insert into public.profiles (id, first_name, last_name, email, avatar_id)
  values (v_user_id, 'Studente', 'ClassHub', coalesce(v_user_email, ''), 'avatar-blue')
  on conflict (id) do nothing;

  -- Generate unique class code CLS-XXXXX
  loop
    v_attempt := v_attempt + 1;
    v_code := 'CLS-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 5));
    exit when not exists (select 1 from public.classes where code = v_code) or v_attempt > 30;
  end loop;

  insert into public.classes (
    name,
    code,
    school_name,
    academic_year,
    created_by,
    allow_self_join,
    admin_email
  ) values (
    trim(p_name),
    v_code,
    coalesce(nullif(trim(p_school_name), ''), 'Scuola Superiore'),
    coalesce(nullif(trim(p_academic_year), ''), '2026/2027'),
    v_user_id,
    coalesce(p_allow_self_join, true),
    v_user_email
  )
  returning id into v_class_id;

  -- Insert creator as ADMIN in class_members
  insert into public.class_members (class_id, user_id, role, joined_at)
  values (v_class_id, v_user_id, 'ADMIN'::public.class_role, now())
  on conflict (class_id, user_id) do update set role = 'ADMIN'::public.class_role;

  -- Set active class in profile
  update public.profiles
  set active_class_id = v_class_id, updated_at = now()
  where id = v_user_id;

  return json_build_object(
    'id', v_class_id,
    'code', v_code,
    'name', trim(p_name)
  );
end;
$$;

revoke all on function public.create_class(text, text, text, boolean) from public, anon;
grant execute on function public.create_class(text, text, text, boolean) to authenticated, service_role;

-- join_class_by_code
create or replace function public.join_class_by_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_class record;
  v_existing_role public.class_role;
  v_assigned_role public.class_role := 'STUDENT'::public.class_role;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non autorizzato: autenticazione richiesta';
  end if;

  if p_code is null or trim(p_code) = '' then
    raise exception 'Inserisci un codice classe valido';
  end if;

  select * into v_class
  from public.classes
  where upper(trim(code)) = upper(trim(p_code));

  if not found then
    raise exception 'Codice classe non valido o classe inesistente';
  end if;

  -- Ensure profile exists
  insert into public.profiles (id, first_name, last_name, email, avatar_id)
  select v_user_id, 'Studente', 'ClassHub', coalesce(email, ''), 'avatar-blue'
  from auth.users where id = v_user_id
  on conflict (id) do nothing;

  -- Check existing membership
  select role into v_existing_role
  from public.class_members
  where class_id = v_class.id and user_id = v_user_id;

  if v_existing_role is not null then
    v_assigned_role := v_existing_role;
  else
    if not v_class.allow_self_join then
      raise exception 'Le iscrizioni autonome per questa classe sono disabilitate';
    end if;

    if v_class.created_by = v_user_id then
      v_assigned_role := 'ADMIN'::public.class_role;
    else
      v_assigned_role := 'STUDENT'::public.class_role;
    end if;

    insert into public.class_members (class_id, user_id, role, joined_at)
    values (v_class.id, v_user_id, v_assigned_role, now())
    on conflict (class_id, user_id) do nothing;
  end if;

  -- Set as active class in profiles
  update public.profiles
  set active_class_id = v_class.id, updated_at = now()
  where id = v_user_id;

  return json_build_object(
    'success', true,
    'message', 'Ti sei unito alla classe con successo!',
    'class_id', v_class.id,
    'name', v_class.name,
    'role', v_assigned_role::text
  );
end;
$$;

revoke all on function public.join_class_by_code(text) from public, anon;
grant execute on function public.join_class_by_code(text) to authenticated, service_role;

-- set_active_class
create or replace function public.set_active_class(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non autorizzato: autenticazione richiesta';
  end if;

  if not exists (
    select 1 from public.class_members
    where class_id = p_class_id and user_id = v_user_id
  ) then
    raise exception 'Non appartieni a questa classe';
  end if;

  update public.profiles
  set active_class_id = p_class_id, updated_at = now()
  where id = v_user_id;
end;
$$;

revoke all on function public.set_active_class(uuid) from public, anon;
grant execute on function public.set_active_class(uuid) to authenticated, service_role;

-- toggle_volunteer_reservation
create or replace function public.toggle_volunteer_reservation(p_interrogation_id uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_int record;
  v_current_count int;
  v_is_registered boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non autorizzato: autenticazione richiesta';
  end if;

  select * into v_int
  from public.interrogations
  where id = p_interrogation_id;

  if not found then
    raise exception 'Interrogazione non trovata';
  end if;

  -- Verify class membership
  if not public.is_class_member(v_int.class_id, v_user_id) then
    raise exception 'Non appartieni alla classe di questa interrogazione';
  end if;

  -- Check if already registered
  select exists (
    select 1 from public.interrogation_volunteers
    where interrogation_id = p_interrogation_id and user_id = v_user_id
  ) into v_is_registered;

  if v_is_registered then
    delete from public.interrogation_volunteers
    where interrogation_id = p_interrogation_id and user_id = v_user_id;

    return json_build_object(
      'success', true,
      'message', 'Prenotazione ritirata con successo.'
    );
  else
    if v_int.status = 'CLOSED' then
      return json_build_object(
        'success', false,
        'message', 'Le iscrizioni per questa interrogazione sono chiuse.'
      );
    end if;

    select count(*) into v_current_count
    from public.interrogation_volunteers
    where interrogation_id = p_interrogation_id;

    if v_current_count >= v_int.max_volunteers then
      return json_build_object(
        'success', false,
        'message', 'Tutti i posti disponibili per i volontari sono esauriti.'
      );
    end if;

    insert into public.interrogation_volunteers (interrogation_id, user_id, joined_at)
    values (p_interrogation_id, v_user_id, now());

    return json_build_object(
      'success', true,
      'message', 'Prenotazione registrata! Sei nella lista volontari.'
    );
  end if;
end;
$$;

revoke all on function public.toggle_volunteer_reservation(uuid) from public, anon;
grant execute on function public.toggle_volunteer_reservation(uuid) to authenticated, service_role;

-- 17. STORAGE BUCKET: classhub_materials
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('classhub_materials', 'classhub_materials', false, 52428800, null)
on conflict (id) do update set public = false;

drop policy if exists "Authenticated users can read classhub_materials" on storage.objects;
create policy "Authenticated users can read classhub_materials"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'classhub_materials');

drop policy if exists "Authenticated users can upload classhub_materials" on storage.objects;
create policy "Authenticated users can upload classhub_materials"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'classhub_materials');

drop policy if exists "Authenticated users can delete classhub_materials" on storage.objects;
create policy "Authenticated users can delete classhub_materials"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'classhub_materials');

-- 18. ROW LEVEL SECURITY (RLS) POLICIES ON ALL CORE TABLES
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.subjects enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.events enable row level security;
alter table public.interrogations enable row level security;
alter table public.interrogation_volunteers enable row level security;
alter table public.notices enable row level security;
alter table public.materials enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_options enable row level security;
alter table public.survey_votes enable row level security;
alter table public.representation_items enable row level security;

-- PROFILES
drop policy if exists "Profiles visible to authenticated users" on public.profiles;
create policy "Profiles visible to authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- CLASSES
drop policy if exists "Classes visible to their members or joinable" on public.classes;
create policy "Classes visible to their members or joinable"
  on public.classes for select
  to authenticated
  using (
    public.is_class_member(id, auth.uid()) or
    allow_self_join = true
  );

drop policy if exists "Class Admin can update class settings" on public.classes;
create policy "Class Admin can update class settings"
  on public.classes for update
  to authenticated
  using (public.get_class_role(id, auth.uid()) = 'ADMIN')
  with check (public.get_class_role(id, auth.uid()) = 'ADMIN');

-- CLASS_MEMBERS
drop policy if exists "Class members can view other members in same class" on public.class_members;
create policy "Class members can view other members in same class"
  on public.class_members for select
  to authenticated
  using (
    user_id = auth.uid() or
    public.is_class_member(class_id, auth.uid())
  );

drop policy if exists "Class Admin can update member roles" on public.class_members;
create policy "Class Admin can update member roles"
  on public.class_members for update
  to authenticated
  using (
    public.get_class_role(class_id, auth.uid()) = 'ADMIN' and user_id <> auth.uid()
  )
  with check (
    public.get_class_role(class_id, auth.uid()) = 'ADMIN' and user_id <> auth.uid()
  );

drop policy if exists "Users can leave or Admin can remove members" on public.class_members;
create policy "Users can leave or Admin can remove members"
  on public.class_members for delete
  to authenticated
  using (
    user_id = auth.uid() or
    public.get_class_role(class_id, auth.uid()) = 'ADMIN'
  );

-- SUBJECTS
drop policy if exists "Subjects visible to class members" on public.subjects;
create policy "Subjects visible to class members"
  on public.subjects for select
  to authenticated
  using (public.is_class_member(class_id, auth.uid()));

drop policy if exists "Admin/Controller can manage subjects" on public.subjects;
create policy "Admin/Controller can manage subjects"
  on public.subjects for insert
  to authenticated
  with check (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin/Controller can update subjects" on public.subjects;
create policy "Admin/Controller can update subjects"
  on public.subjects for update
  to authenticated
  using (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin/Controller can delete subjects" on public.subjects;
create policy "Admin/Controller can delete subjects"
  on public.subjects for delete
  to authenticated
  using (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

-- TIMETABLE_SLOTS
drop policy if exists "Timetable slots visible to class members" on public.timetable_slots;
create policy "Timetable slots visible to class members"
  on public.timetable_slots for select
  to authenticated
  using (public.is_class_member(class_id, auth.uid()));

drop policy if exists "Admin/Controller can manage timetable slots" on public.timetable_slots;
create policy "Admin/Controller can manage timetable slots"
  on public.timetable_slots for insert
  to authenticated
  with check (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin/Controller can update timetable slots" on public.timetable_slots;
create policy "Admin/Controller can update timetable slots"
  on public.timetable_slots for update
  to authenticated
  using (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin/Controller can delete timetable slots" on public.timetable_slots;
create policy "Admin/Controller can delete timetable slots"
  on public.timetable_slots for delete
  to authenticated
  using (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

-- EVENTS
drop policy if exists "Events visible to class members or author" on public.events;
create policy "Events visible to class members or author"
  on public.events for select
  to authenticated
  using (
    (class_id is not null and public.is_class_member(class_id, auth.uid())) or
    (is_personal = true and author_id = auth.uid())
  );

drop policy if exists "Users can insert events" on public.events;
create policy "Users can insert events"
  on public.events for insert
  to authenticated
  with check (
    (is_personal = true and author_id = auth.uid()) or
    (is_personal = false and class_id is not null and public.is_class_member(class_id, auth.uid()) and author_id = auth.uid())
  );

drop policy if exists "Author or Admin/Controller can update events" on public.events;
create policy "Author or Admin/Controller can update events"
  on public.events for update
  to authenticated
  using (
    author_id = auth.uid() or
    (class_id is not null and public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER'))
  );

drop policy if exists "Author or Admin/Controller can delete events" on public.events;
create policy "Author or Admin/Controller can delete events"
  on public.events for delete
  to authenticated
  using (
    author_id = auth.uid() or
    (class_id is not null and public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER'))
  );

-- INTERROGATIONS
drop policy if exists "Interrogations visible to class members" on public.interrogations;
create policy "Interrogations visible to class members"
  on public.interrogations for select
  to authenticated
  using (public.is_class_member(class_id, auth.uid()));

drop policy if exists "Admin/Controller can create interrogations" on public.interrogations;
create policy "Admin/Controller can create interrogations"
  on public.interrogations for insert
  to authenticated
  with check (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin/Controller can update interrogations" on public.interrogations;
create policy "Admin/Controller can update interrogations"
  on public.interrogations for update
  to authenticated
  using (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin/Controller can delete interrogations" on public.interrogations;
create policy "Admin/Controller can delete interrogations"
  on public.interrogations for delete
  to authenticated
  using (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

-- INTERROGATION_VOLUNTEERS
drop policy if exists "Volunteers visible to class members" on public.interrogation_volunteers;
create policy "Volunteers visible to class members"
  on public.interrogation_volunteers for select
  to authenticated
  using (
    exists (
      select 1 from public.interrogations i
      where i.id = interrogation_id and public.is_class_member(i.class_id, auth.uid())
    )
  );

drop policy if exists "Class members can volunteer themselves" on public.interrogation_volunteers;
create policy "Class members can volunteer themselves"
  on public.interrogation_volunteers for insert
  to authenticated
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.interrogations i
      where i.id = interrogation_id and public.is_class_member(i.class_id, auth.uid())
    )
  );

drop policy if exists "Users or Admins can remove volunteer" on public.interrogation_volunteers;
create policy "Users or Admins can remove volunteer"
  on public.interrogation_volunteers for delete
  to authenticated
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.interrogations i
      where i.id = interrogation_id and public.get_class_role(i.class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
    )
  );

-- NOTICES
drop policy if exists "Notices visible to class members" on public.notices;
create policy "Notices visible to class members"
  on public.notices for select
  to authenticated
  using (public.is_class_member(class_id, auth.uid()));

drop policy if exists "Admin/Controller can create notices" on public.notices;
create policy "Admin/Controller can create notices"
  on public.notices for insert
  to authenticated
  with check (
    public.is_class_member(class_id, auth.uid()) and
    (
      public.get_class_role(class_id, auth.uid()) = 'ADMIN' or
      (
        public.get_class_role(class_id, auth.uid()) = 'CONTROLLER' and
        exists (select 1 from public.classes c where c.id = class_id and c.controller_can_create_notices = true)
      )
    )
  );

drop policy if exists "Author or Admin can update notices" on public.notices;
create policy "Author or Admin can update notices"
  on public.notices for update
  to authenticated
  using (
    author_id = auth.uid() or
    public.get_class_role(class_id, auth.uid()) = 'ADMIN'
  );

drop policy if exists "Author or Admin can delete notices" on public.notices;
create policy "Author or Admin can delete notices"
  on public.notices for delete
  to authenticated
  using (
    author_id = auth.uid() or
    public.get_class_role(class_id, auth.uid()) = 'ADMIN'
  );

-- MATERIALS
drop policy if exists "Materials visible to class members" on public.materials;
create policy "Materials visible to class members"
  on public.materials for select
  to authenticated
  using (public.is_class_member(class_id, auth.uid()));

drop policy if exists "Class members can upload materials" on public.materials;
create policy "Class members can upload materials"
  on public.materials for insert
  to authenticated
  with check (
    public.is_class_member(class_id, auth.uid()) and
    uploaded_by = auth.uid()
  );

drop policy if exists "Uploader or Admin/Controller can delete materials" on public.materials;
create policy "Uploader or Admin/Controller can delete materials"
  on public.materials for delete
  to authenticated
  using (
    uploaded_by = auth.uid() or
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

-- SURVEYS & VOTES
drop policy if exists "Surveys visible to class members" on public.surveys;
create policy "Surveys visible to class members"
  on public.surveys for select
  to authenticated
  using (public.is_class_member(class_id, auth.uid()));

drop policy if exists "Admin/Controller can create surveys" on public.surveys;
create policy "Admin/Controller can create surveys"
  on public.surveys for insert
  to authenticated
  with check (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin/Controller can update surveys" on public.surveys;
create policy "Admin/Controller can update surveys"
  on public.surveys for update
  to authenticated
  using (
    public.is_class_member(class_id, auth.uid()) and
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Admin can delete surveys" on public.surveys;
create policy "Admin can delete surveys"
  on public.surveys for delete
  to authenticated
  using (
    author_id = auth.uid() or
    public.get_class_role(class_id, auth.uid()) = 'ADMIN'
  );

-- Survey options
drop policy if exists "Survey options visible to class members" on public.survey_options;
create policy "Survey options visible to class members"
  on public.survey_options for select
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and public.is_class_member(s.class_id, auth.uid())
    )
  );

drop policy if exists "Admin/Controller can create survey options" on public.survey_options;
create policy "Admin/Controller can create survey options"
  on public.survey_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and public.get_class_role(s.class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
    )
  );

-- Survey votes
drop policy if exists "Votes visible to class members" on public.survey_votes;
create policy "Votes visible to class members"
  on public.survey_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and public.is_class_member(s.class_id, auth.uid())
    )
  );

drop policy if exists "Users can vote once" on public.survey_votes;
create policy "Users can vote once"
  on public.survey_votes for insert
  to authenticated
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and public.is_class_member(s.class_id, auth.uid()) and s.status = 'OPEN'
    )
  );

drop policy if exists "Users can change their vote" on public.survey_votes;
create policy "Users can change their vote"
  on public.survey_votes for delete
  to authenticated
  using (user_id = auth.uid());

-- REPRESENTATION_ITEMS
drop policy if exists "Representation items visible to class members" on public.representation_items;
create policy "Representation items visible to class members"
  on public.representation_items for select
  to authenticated
  using (public.is_class_member(class_id, auth.uid()));

drop policy if exists "Class members can create representation items" on public.representation_items;
create policy "Class members can create representation items"
  on public.representation_items for insert
  to authenticated
  with check (
    public.is_class_member(class_id, auth.uid()) and
    author_id = auth.uid()
  );

drop policy if exists "Author or Admin/Controller can update representation items" on public.representation_items;
create policy "Author or Admin/Controller can update representation items"
  on public.representation_items for update
  to authenticated
  using (
    author_id = auth.uid() or
    public.get_class_role(class_id, auth.uid()) in ('ADMIN', 'CONTROLLER')
  );

drop policy if exists "Author or Admin can delete representation items" on public.representation_items;
create policy "Author or Admin can delete representation items"
  on public.representation_items for delete
  to authenticated
  using (
    author_id = auth.uid() or
    public.get_class_role(class_id, auth.uid()) = 'ADMIN'
  );
