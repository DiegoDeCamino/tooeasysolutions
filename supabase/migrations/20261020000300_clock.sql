-- Clock in / clock out on carpentry projects.
-- A clocked entry has started_at; while ended_at is null the person is on site. Hours are
-- derived from the two instants. Manual "log hours" entries keep started_at null.

alter table public.time_entries
  add column started_at timestamptz,
  add column ended_at timestamptz,
  add column auto_closed boolean not null default false,
  add column reminded_at timestamptz,
  alter column hours drop not null;

alter table public.time_entries
  add constraint time_entries_clock_check check (
    (started_at is null and ended_at is null and hours is not null)
    or (started_at is not null and (ended_at is null or ended_at > started_at))
  );

-- One open entry per person across every project: nobody is on two sites at once.
create unique index time_entries_one_open on public.time_entries (profile_id)
  where started_at is not null and ended_at is null;
create index time_entries_open_idx on public.time_entries (started_at)
  where started_at is not null and ended_at is null;

create or replace function public.time_entry_hours()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.started_at is not null then
    new.work_date := (new.started_at at time zone 'Australia/Perth')::date;
    new.hours := case
      when new.ended_at is null then null
      else greatest(0.01, round((extract(epoch from new.ended_at - new.started_at) / 3600)::numeric, 2))
    end;
  end if;
  return new;
end;
$$;
create trigger time_entries_hours before insert or update on public.time_entries
  for each row execute function public.time_entry_hours();

-- Clock in/out go through these so the instant is always the server's "now".
create or replace function public.clock_in(p_project uuid, p_profile uuid default null)
returns public.time_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  who uuid := coalesce(p_profile, auth.uid());
  entry public.time_entries;
begin
  if not (
    public.is_admin()
    or public.is_project_supervisor(p_project)
    or (who = auth.uid() and public.is_project_member(p_project))
  ) then
    raise exception 'Only the team on this project can clock in' using errcode = '42501';
  end if;
  if not (
    exists (select 1 from public.project_members where project_id = p_project and profile_id = who)
    or (who = auth.uid() and public.is_admin())
  ) then
    raise exception 'That person is not on this project' using errcode = '42501';
  end if;
  insert into public.time_entries (project_id, profile_id, started_at, created_by)
  values (p_project, who, now(), auth.uid())
  returning * into entry;
  return entry;
end;
$$;

create or replace function public.clock_out(p_entry uuid)
returns public.time_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry public.time_entries;
begin
  update public.time_entries
  set ended_at = now()
  where id = p_entry
    and started_at is not null
    and ended_at is null
    and (profile_id = auth.uid() or public.is_admin() or public.is_project_supervisor(project_id))
  returning * into entry;
  if entry.id is null then
    raise exception 'Nothing to clock out' using errcode = 'P0002';
  end if;
  return entry;
end;
$$;

revoke execute on function public.time_entry_hours() from public, anon, authenticated;
revoke execute on function public.clock_in(uuid, uuid) from public, anon;
revoke execute on function public.clock_out(uuid) from public, anon;
grant execute on function public.clock_in(uuid, uuid) to authenticated;
grant execute on function public.clock_out(uuid) to authenticated;

-- Supervisors and admins correct times; workers only clock in and out.
create policy "time_entries: admin or supervisor update" on public.time_entries for update to authenticated
  using (public.is_admin() or public.is_project_supervisor(project_id))
  with check (public.is_admin() or public.is_project_supervisor(project_id));

-- Forgotten clock-outs. The sweep endpoint calls these with the service role.
create or replace function public.remind_open_clocks(p_after_hours int)
returns setof public.time_entries
language sql
security definer
set search_path = ''
as $$
  update public.time_entries
  set reminded_at = now()
  where started_at is not null
    and ended_at is null
    and reminded_at is null
    and started_at <= now() - make_interval(hours => p_after_hours)
  returning *;
$$;

create or replace function public.close_stale_clocks(p_after_hours int)
returns setof public.time_entries
language sql
security definer
set search_path = ''
as $$
  update public.time_entries
  set ended_at = started_at + make_interval(hours => p_after_hours), auto_closed = true
  where started_at is not null
    and ended_at is null
    and started_at <= now() - make_interval(hours => p_after_hours)
  returning *;
$$;

revoke execute on function public.remind_open_clocks(int) from public, anon, authenticated;
revoke execute on function public.close_stale_clocks(int) from public, anon, authenticated;
grant execute on function public.remind_open_clocks(int) to service_role;
grant execute on function public.close_stale_clocks(int) to service_role;

-- Every 15 minutes, ask the app to send reminders and close stale entries. The endpoint
-- only acts on what is already due, so extra calls are harmless.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
select cron.schedule(
  'clock-sweep',
  '*/15 * * * *',
  $$select net.http_post(url := 'https://www.tooeasysolutions.com.au/api/cron/clock', body := '{}'::jsonb)$$
);
