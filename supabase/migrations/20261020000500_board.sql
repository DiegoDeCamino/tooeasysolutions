-- Site whiteboard: cards on top of a project's feed. Internal to the team.

create table public.board_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('note', 'checklist', 'photo', 'measures')),
  title text not null default '' check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 4000),
  color text not null default 'yellow' check (color in ('yellow', 'green', 'blue', 'pink', 'gray')),
  -- checklist: [{id, text, done}]; measures: [{id, label, value}]
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 100),
  photo_path text,
  position int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index board_cards_project_idx on public.board_cards (project_id, position);
create trigger board_cards_touch before update on public.board_cards
  for each row execute function public.touch_updated_at();

alter table public.board_cards enable row level security;

-- A shared board: the whole team reads, adds and edits. Deleting is for the author,
-- the project's supervisors and admins.
create policy "board_cards: admin or member read" on public.board_cards for select to authenticated
  using (public.is_admin() or public.is_project_member(project_id));
create policy "board_cards: admin or member insert" on public.board_cards for insert to authenticated
  with check (created_by = (select auth.uid()) and (public.is_admin() or public.is_project_member(project_id)));
create policy "board_cards: admin or member update" on public.board_cards for update to authenticated
  using (public.is_admin() or public.is_project_member(project_id))
  with check (public.is_admin() or public.is_project_member(project_id));
create policy "board_cards: author, supervisor or admin delete" on public.board_cards for delete to authenticated
  using (public.is_admin() or public.is_project_supervisor(project_id) or created_by = (select auth.uid()));

-- Tick one checklist item in place, so two people ticking at once don't overwrite each other.
create or replace function public.set_board_item_done(p_card uuid, p_item text, p_done boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.board_cards
  set items = (
        select coalesce(jsonb_agg(
          case when elem ->> 'id' = p_item then jsonb_set(elem, '{done}', to_jsonb(p_done)) else elem end
          order by ord
        ), '[]'::jsonb)
        from jsonb_array_elements(items) with ordinality as t(elem, ord)
      ),
      updated_by = auth.uid()
  where id = p_card and kind = 'checklist';
  if not found then
    raise exception 'Card not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_board_item_done(uuid, text, boolean) from public, anon;
grant execute on function public.set_board_item_done(uuid, text, boolean) to authenticated;
