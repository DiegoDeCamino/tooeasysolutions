-- Too Easy Ops: shift claiming with capacity checks

create or replace function public.claim_shift(p_shift uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_shift public.shifts;
  v_taken int;
begin
  select * into v_profile from public.profiles where id = v_uid and active;
  if v_profile.id is null or v_profile.role not in ('admin', 'supervisor', 'worker') then
    return 'forbidden';
  end if;

  select * into v_shift from public.shifts where id = p_shift for update;
  if v_shift.id is null or v_shift.status in ('done', 'cancelled') or v_shift.starts_at < now() then
    return 'closed';
  end if;
  if v_profile.role <> 'admin' and not (v_shift.skill = any (v_profile.skills)) then
    return 'forbidden';
  end if;
  if exists (select 1 from public.shift_signups where shift_id = p_shift and worker_id = v_uid) then
    return 'already';
  end if;

  select count(*) into v_taken from public.shift_signups where shift_id = p_shift;
  if v_taken >= v_shift.spots then
    update public.shifts set status = 'full' where id = p_shift and status = 'open';
    return 'full';
  end if;

  insert into public.shift_signups (shift_id, worker_id) values (p_shift, v_uid);
  if v_taken + 1 >= v_shift.spots then
    update public.shifts set status = 'full' where id = p_shift;
  end if;
  return 'ok';
end;
$$;

create or replace function public.leave_shift(p_shift uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shift public.shifts;
begin
  select * into v_shift from public.shifts where id = p_shift for update;
  if v_shift.id is null or v_shift.status in ('done', 'cancelled') then
    return 'closed';
  end if;
  delete from public.shift_signups where shift_id = p_shift and worker_id = auth.uid();
  if not found then
    return 'not_signed_up';
  end if;
  if v_shift.status = 'full' then
    update public.shifts set status = 'open' where id = p_shift;
  end if;
  return 'ok';
end;
$$;

revoke execute on function public.claim_shift(uuid) from public, anon;
revoke execute on function public.leave_shift(uuid) from public, anon;
grant execute on function public.claim_shift(uuid) to authenticated;
grant execute on function public.leave_shift(uuid) to authenticated;
