-- Project to-do list: small jobs, optionally for a given day and a given person.

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  due_date date,
  assignee_id uuid references public.profiles (id) on delete set null,
  done_at timestamptz,
  done_by uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index project_tasks_project_idx on public.project_tasks (project_id, due_date);
create index project_tasks_open_due_idx on public.project_tasks (due_date) where done_at is null;

alter table public.project_tasks enable row level security;

create policy "project_tasks: admin or member read" on public.project_tasks for select to authenticated
  using (public.is_admin() or public.is_project_member(project_id));
create policy "project_tasks: admin or member insert" on public.project_tasks for insert to authenticated
  with check (created_by = (select auth.uid()) and (public.is_admin() or public.is_project_member(project_id)));
-- Editing the task itself: its author, the project's supervisors and admins.
create policy "project_tasks: author, supervisor or admin update" on public.project_tasks for update to authenticated
  using (public.is_admin() or public.is_project_supervisor(project_id) or created_by = (select auth.uid()))
  with check (public.is_admin() or public.is_project_supervisor(project_id) or created_by = (select auth.uid()));
create policy "project_tasks: author, supervisor or admin delete" on public.project_tasks for delete to authenticated
  using (public.is_admin() or public.is_project_supervisor(project_id) or created_by = (select auth.uid()));

-- Anyone on the team can tick a task off (or back on), without being able to edit it.
create or replace function public.set_task_done(p_task uuid, p_done boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.project_tasks
  set done_at = case when p_done then coalesce(done_at, now()) end,
      done_by = case when p_done then coalesce(done_by, auth.uid()) end
  where id = p_task
    and (public.is_admin() or public.is_project_member(project_id));
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_task_done(uuid, boolean) from public, anon;
grant execute on function public.set_task_done(uuid, boolean) to authenticated;
