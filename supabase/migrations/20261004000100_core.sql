-- Too Easy Ops: core schema
-- Business timezone is Australia/Perth (UTC+08:00, no DST).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'supervisor', 'worker', 'client');
create type public.app_locale as enum ('en', 'es');
create type public.booking_status as enum ('requested', 'awaiting_payment', 'scheduled', 'completed', 'declined', 'cancelled');
create type public.payment_status as enum ('unpaid', 'pending', 'paid');
create type public.shift_status as enum ('open', 'full', 'done', 'cancelled');
create type public.enquiry_status as enum ('new', 'contacted', 'converted', 'archived');
create type public.project_status as enum ('planning', 'active', 'on_hold', 'completed');
create type public.stage_status as enum ('todo', 'doing', 'done');
create type public.member_role as enum ('supervisor', 'worker');
create type public.expense_category as enum ('materials', 'labour', 'equipment', 'other');
create type public.material_status as enum ('needed', 'bought', 'used');
create type public.addon_kind as enum ('hours', 'fixed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.random_token(bytes int default 24)
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(bytes), 'base64'), '+/=', '-_');
$$;

create or replace function public.random_ref()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 6 chars from an unambiguous alphabet (no 0/O/1/I)
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 6);
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role public.app_role not null default 'client',
  skills text[] not null default '{}',
  locale public.app_locale not null default 'en',
  avatar_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_skills_check check (skills <@ array['cleaning', 'carpentry']::text[])
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Every new auth user gets a client profile. Roles are only ever raised by
-- server code using the service role, never from user-supplied metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() = 'admin', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() in ('admin', 'supervisor', 'worker'), false);
$$;

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default public.random_token(18),
  role public.app_role not null default 'worker',
  skills text[] not null default '{}',
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  max_uses int not null default 1,
  uses int not null default 0,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint invites_role_check check (role in ('admin', 'supervisor', 'worker'))
);

-- ---------------------------------------------------------------------------
-- Pricing
-- ---------------------------------------------------------------------------
create table public.settings (
  id int primary key default 1,
  client_hourly_rate numeric(10, 2) not null default 55,
  worker_hourly_rate numeric(10, 2) not null default 32,
  base_hours numeric(5, 2) not null default 1.5,
  hours_per_bedroom numeric(5, 2) not null default 1,
  hours_per_bathroom numeric(5, 2) not null default 0.75,
  hours_per_50sqm numeric(5, 2) not null default 0.5,
  hours_per_extra_level numeric(5, 2) not null default 0.5,
  pet_hours numeric(5, 2) not null default 0.5,
  max_shift_hours numeric(5, 2) not null default 5,
  min_price numeric(10, 2) not null default 140,
  price_rounding numeric(10, 2) not null default 5,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

create table public.clean_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  multiplier numeric(5, 2) not null default 1,
  sort int not null default 0,
  active boolean not null default true
);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.addon_kind not null default 'hours',
  value numeric(10, 2) not null,
  sort int not null default 0,
  active boolean not null default true
);

create table public.price_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  clean_type_id uuid references public.clean_types (id) on delete cascade,
  bedrooms int not null,
  bathrooms int not null,
  max_sqm int,
  fixed_price numeric(10, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cleaning bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default public.random_token(),
  ref text not null unique default public.random_ref(),
  status public.booking_status not null default 'requested',
  client_name text not null,
  client_email text not null,
  client_phone text,
  client_user_id uuid references public.profiles (id) on delete set null,
  address text not null,
  suburb text not null,
  service_date date not null,
  start_time time not null,
  flexible boolean not null default false,
  clean_type_id uuid not null references public.clean_types (id),
  addon_ids uuid[] not null default '{}',
  bedrooms int not null default 0,
  bathrooms int not null default 1,
  sqm int,
  levels int not null default 1,
  pets boolean not null default false,
  parking text,
  access_notes text,
  notes text,
  estimate jsonb not null,
  suggestion jsonb,
  final_price numeric(10, 2),
  final_crew int,
  final_hours numeric(5, 2),
  admin_note text,
  worker_brief text,
  payment_status public.payment_status not null default 'unpaid',
  payment_url text,
  payment_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_status_date_idx on public.bookings (status, service_date);
create index bookings_email_idx on public.bookings (lower(client_email));
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind text not null,
  message text,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index booking_events_booking_idx on public.booking_events (booking_id, created_at);

-- ---------------------------------------------------------------------------
-- Shifts
-- ---------------------------------------------------------------------------
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade,
  title text not null,
  suburb text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  spots int not null default 1 check (spots between 1 and 20),
  pay_rate numeric(10, 2) not null,
  brief text,
  skill text not null default 'cleaning',
  status public.shift_status not null default 'open',
  created_at timestamptz not null default now()
);
create index shifts_starts_idx on public.shifts (starts_at);

-- Private details are visible only to admins and crew who claimed the shift.
create table public.shift_details (
  shift_id uuid primary key references public.shifts (id) on delete cascade,
  address text not null,
  access_notes text
);

create table public.shift_signups (
  shift_id uuid not null references public.shifts (id) on delete cascade,
  worker_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shift_id, worker_id)
);

create or replace function public.is_on_shift(p_shift uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shift_signups where shift_id = p_shift and worker_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Carpentry
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.random_ref(),
  name text not null,
  email text not null,
  phone text,
  suburb text,
  category text not null,
  description text not null,
  timeframe text,
  budget_range text,
  photo_paths text[] not null default '{}',
  status public.enquiry_status not null default 'new',
  project_id uuid,
  created_at timestamptz not null default now()
);

create table public.stage_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stages text[] not null,
  sort int not null default 0
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default public.random_token(),
  title text not null,
  category text,
  description text,
  address text,
  client_name text,
  client_email text,
  client_phone text,
  status public.project_status not null default 'planning',
  start_date date,
  due_date date,
  cover_path text,
  enquiry_id uuid references public.enquiries (id) on delete set null,
  share_budget boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

alter table public.enquiries
  add constraint enquiries_project_fk foreign key (project_id) references public.projects (id) on delete set null;

create table public.project_financials (
  project_id uuid primary key references public.projects (id) on delete cascade,
  budget numeric(12, 2) not null default 0
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'worker',
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create or replace function public.is_project_member(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project and profile_id = auth.uid()
  );
$$;

create or replace function public.is_project_supervisor(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project and profile_id = auth.uid() and role = 'supervisor'
  );
$$;

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  position int not null default 0,
  status public.stage_status not null default 'todo',
  updated_at timestamptz not null default now()
);
create index project_stages_project_idx on public.project_stages (project_id, position);
create trigger project_stages_touch before update on public.project_stages
  for each row execute function public.touch_updated_at();

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage_id uuid references public.project_stages (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null default '',
  photo_paths text[] not null default '{}',
  client_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index project_updates_project_idx on public.project_updates (project_id, created_at desc);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  category public.expense_category not null default 'materials',
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null default '',
  receipt_path text,
  spent_on date not null default (now() at time zone 'Australia/Perth')::date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index expenses_project_idx on public.expenses (project_id);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  qty numeric(10, 2) not null default 1,
  unit text not null default 'pcs',
  est_cost numeric(12, 2),
  status public.material_status not null default 'needed',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index materials_project_idx on public.materials (project_id);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null default (now() at time zone 'Australia/Perth')::date,
  hours numeric(5, 2) not null check (hours > 0 and hours <= 24),
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index time_entries_project_idx on public.time_entries (project_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications (profile_id, created_at desc);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
