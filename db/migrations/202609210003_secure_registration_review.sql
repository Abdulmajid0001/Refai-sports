-- Review-state protection. Registration owners may amend their submitted data,
-- but approval, suspension, reviewer and payment-reference fields are server-owned.

create or replace function public.guard_registration_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_profile_role() <> 'super_admin'
    and coalesce(current_setting('app.allow_registration_review', true), 'false') <> 'true'
    and (
      new.status is distinct from old.status
      or new.review_note is distinct from old.review_note
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
      or (to_jsonb(new) -> 'payment_reference') is distinct from (to_jsonb(old) -> 'payment_reference')
    )
  then
    raise exception 'Registration review fields can only be changed by Super Admin';
  end if;
  return new;
end;
$$;

drop trigger if exists league_registration_review_guard on public.league_registrations;
create trigger league_registration_review_guard
before update on public.league_registrations
for each row execute function public.guard_registration_review_fields();

drop trigger if exists team_registration_review_guard on public.team_registrations;
create trigger team_registration_review_guard
before update on public.team_registrations
for each row execute function public.guard_registration_review_fields();

create or replace function public.review_league_registration(
  p_registration_id uuid,
  p_status public.onboarding_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_profile_role() <> 'super_admin' then
    raise exception 'Only a Super Admin can review a league registration';
  end if;
  if p_status not in ('approved', 'rejected', 'changes_requested', 'suspended') then
    raise exception 'Invalid review decision';
  end if;
  perform set_config('app.allow_registration_review', 'true', true);
  update public.league_registrations
  set status = p_status, review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_registration_id;
  if not found then raise exception 'League registration not found'; end if;
end;
$$;

create or replace function public.review_team_registration(
  p_registration_id uuid,
  p_status public.onboarding_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_profile_role() <> 'super_admin' then
    raise exception 'Only a Super Admin can review a team registration';
  end if;
  if p_status not in ('approved', 'rejected', 'changes_requested', 'suspended') then
    raise exception 'Invalid review decision';
  end if;
  perform set_config('app.allow_registration_review', 'true', true);
  update public.team_registrations
  set status = p_status, review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_registration_id;
  if not found then raise exception 'Team registration not found'; end if;
end;
$$;

revoke all on function public.review_league_registration(uuid, public.onboarding_status, text) from public;
revoke all on function public.review_team_registration(uuid, public.onboarding_status, text) from public;
grant execute on function public.review_league_registration(uuid, public.onboarding_status, text) to authenticated;
grant execute on function public.review_team_registration(uuid, public.onboarding_status, text) to authenticated;
