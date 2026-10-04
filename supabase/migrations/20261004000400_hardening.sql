-- Too Easy Ops: advisor fixes
-- 1. Helper functions are only for RLS evaluation by signed-in users; anon never needs them.
-- 2. "admin write" policies were FOR ALL, overlapping the read policies on SELECT.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_on_shift(uuid) from public, anon;
revoke execute on function public.is_project_member(uuid) from public, anon;
revoke execute on function public.is_project_supervisor(uuid) from public, anon;
-- Column defaults run as the inserting role, so signed-in users keep these.
revoke execute on function public.random_token(int) from public, anon;
revoke execute on function public.random_ref() from public, anon;
grant execute on function public.random_token(int) to authenticated;
grant execute on function public.random_ref() to authenticated;
grant execute on function public.my_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_on_shift(uuid) to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.is_project_supervisor(uuid) to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['clean_types', 'addons', 'price_presets', 'stage_templates', 'shifts', 'shift_details', 'shift_signups', 'projects', 'project_members']
  loop
    execute format('drop policy if exists %I on public.%I', t || ': admin write', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t || ': admin insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t || ': admin update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || ': admin delete', t);
  end loop;
end;
$$;

-- bookings: one SELECT policy covering admin and the owning client.
drop policy if exists "bookings: admin" on public.bookings;
drop policy if exists "bookings: client reads own" on public.bookings;
create policy "bookings: admin or owner read" on public.bookings for select to authenticated
  using (public.is_admin() or client_user_id = (select auth.uid()));
create policy "bookings: admin insert" on public.bookings for insert to authenticated with check (public.is_admin());
create policy "bookings: admin update" on public.bookings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "bookings: admin delete" on public.bookings for delete to authenticated using (public.is_admin());
