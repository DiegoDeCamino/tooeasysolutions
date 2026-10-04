-- Too Easy Ops: row level security
-- Public (anon) flows never touch tables directly: they run in server code
-- with the service role. These policies govern signed-in staff and clients.

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.settings enable row level security;
alter table public.clean_types enable row level security;
alter table public.addons enable row level security;
alter table public.price_presets enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_details enable row level security;
alter table public.shift_signups enable row level security;
alter table public.enquiries enable row level security;
alter table public.stage_templates enable row level security;
alter table public.projects enable row level security;
alter table public.project_financials enable row level security;
alter table public.project_members enable row level security;
alter table public.project_stages enable row level security;
alter table public.project_updates enable row level security;
alter table public.expenses enable row level security;
alter table public.materials enable row level security;
alter table public.time_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

-- Nothing is readable anonymously.
revoke all on all tables in schema public from anon;

-- profiles -------------------------------------------------------------------
create policy "profiles: read self, staff read crew, admin read all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin() or (public.is_staff() and role <> 'client'));
create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Users may only change harmless columns; role/skills/active go through admin server code.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, locale, avatar_path) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;

-- admin-only tables ------------------------------------------------------------
create policy "invites: admin" on public.invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "bookings: admin" on public.bookings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "bookings: client reads own" on public.bookings for select to authenticated
  using (client_user_id = (select auth.uid()));
create policy "booking_events: admin" on public.booking_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "enquiries: admin" on public.enquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "project_financials: admin" on public.project_financials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- pricing: staff read, admin write ----------------------------------------------
create policy "settings: staff read" on public.settings for select to authenticated using (public.is_staff());
create policy "settings: admin write" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "clean_types: staff read" on public.clean_types for select to authenticated using (public.is_staff());
create policy "clean_types: admin write" on public.clean_types for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "addons: staff read" on public.addons for select to authenticated using (public.is_staff());
create policy "addons: admin write" on public.addons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "price_presets: staff read" on public.price_presets for select to authenticated using (public.is_staff());
create policy "price_presets: admin write" on public.price_presets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "stage_templates: staff read" on public.stage_templates for select to authenticated using (public.is_staff());
create policy "stage_templates: admin write" on public.stage_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- shifts -------------------------------------------------------------------------
create policy "shifts: staff read" on public.shifts for select to authenticated using (public.is_staff());
create policy "shifts: admin write" on public.shifts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "shift_details: admin or claimed crew" on public.shift_details for select to authenticated
  using (public.is_admin() or public.is_on_shift(shift_id));
create policy "shift_details: admin write" on public.shift_details for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "shift_signups: staff read" on public.shift_signups for select to authenticated using (public.is_staff());
create policy "shift_signups: admin write" on public.shift_signups for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Crew join/leave through claim_shift()/leave_shift() which enforce capacity.

-- projects -----------------------------------------------------------------------
create policy "projects: admin or member read" on public.projects for select to authenticated
  using (public.is_admin() or public.is_project_member(id));
create policy "projects: admin write" on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "project_members: admin or member read" on public.project_members for select to authenticated
  using (public.is_admin() or public.is_project_member(project_id));
create policy "project_members: admin write" on public.project_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "project_stages: admin or member read" on public.project_stages for select to authenticated
  using (public.is_admin() or public.is_project_member(project_id));
create policy "project_stages: admin or supervisor update" on public.project_stages for update to authenticated
  using (public.is_admin() or public.is_project_supervisor(project_id))
  with check (public.is_admin() or public.is_project_supervisor(project_id));
create policy "project_stages: admin insert" on public.project_stages for insert to authenticated
  with check (public.is_admin());
create policy "project_stages: admin delete" on public.project_stages for delete to authenticated
  using (public.is_admin());

create policy "project_updates: admin or member read" on public.project_updates for select to authenticated
  using (public.is_admin() or public.is_project_member(project_id));
create policy "project_updates: admin or member post" on public.project_updates for insert to authenticated
  with check ((public.is_admin() or public.is_project_member(project_id)) and author_id = (select auth.uid()));
create policy "project_updates: admin or author edit" on public.project_updates for update to authenticated
  using (public.is_admin() or author_id = (select auth.uid()))
  with check (public.is_admin() or author_id = (select auth.uid()));
create policy "project_updates: admin or author delete" on public.project_updates for delete to authenticated
  using (public.is_admin() or author_id = (select auth.uid()));

-- Money: supervisors can log expenses and only ever see the ones they logged.
create policy "expenses: admin or own read" on public.expenses for select to authenticated
  using (public.is_admin() or created_by = (select auth.uid()));
create policy "expenses: admin or supervisor insert" on public.expenses for insert to authenticated
  with check (public.is_admin() or (public.is_project_supervisor(project_id) and created_by = (select auth.uid())));
create policy "expenses: admin update" on public.expenses for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "expenses: admin delete" on public.expenses for delete to authenticated
  using (public.is_admin());

create policy "materials: admin or member read" on public.materials for select to authenticated
  using (public.is_admin() or public.is_project_member(project_id));
create policy "materials: admin or member insert" on public.materials for insert to authenticated
  with check ((public.is_admin() or public.is_project_member(project_id)) and created_by = (select auth.uid()));
create policy "materials: admin or member update" on public.materials for update to authenticated
  using (public.is_admin() or public.is_project_member(project_id))
  with check (public.is_admin() or public.is_project_member(project_id));
create policy "materials: admin or creator delete" on public.materials for delete to authenticated
  using (public.is_admin() or created_by = (select auth.uid()));
-- Estimated cost is money: hidden from session clients, admins read it server-side.
revoke select, insert, update on public.materials from authenticated;
grant select (id, project_id, name, qty, unit, status, created_by, created_at) on public.materials to authenticated;
grant insert (project_id, name, qty, unit, status, created_by) on public.materials to authenticated;
grant update (name, qty, unit, status) on public.materials to authenticated;

create policy "time_entries: read own, supervisor or admin" on public.time_entries for select to authenticated
  using (public.is_admin() or profile_id = (select auth.uid()) or public.is_project_supervisor(project_id));
create policy "time_entries: log own or as supervisor" on public.time_entries for insert to authenticated
  with check (
    created_by = (select auth.uid()) and (
      public.is_admin()
      or (public.is_project_member(project_id) and profile_id = (select auth.uid()))
      or public.is_project_supervisor(project_id)
    )
  );
create policy "time_entries: admin or creator delete" on public.time_entries for delete to authenticated
  using (public.is_admin() or created_by = (select auth.uid()));

-- notifications & push ------------------------------------------------------------
create policy "notifications: own read" on public.notifications for select to authenticated
  using (profile_id = (select auth.uid()));
create policy "notifications: own mark read" on public.notifications for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "push_subscriptions: own" on public.push_subscriptions for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- storage ---------------------------------------------------------------------------
-- One private bucket. All reads/writes go through signed URLs minted server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

-- realtime ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.shifts, public.shift_signups, public.notifications;
