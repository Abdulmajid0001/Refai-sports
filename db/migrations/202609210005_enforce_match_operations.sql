-- Close the remaining direct-write paths for staff invitations and match operations.

create or replace function public.create_staff_invitation(
  p_league_registration_id uuid,
  p_email text,
  p_role public.app_role,
  p_permissions jsonb default '[]'::jsonb,
  p_match_id uuid default null,
  p_expires_at timestamptz default now() + interval '7 days'
)
returns table (id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := encode(gen_random_bytes(32), 'hex');
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_email), '') is null then raise exception 'An invited email address is required'; end if;
  if p_role not in ('general_moderator', 'moderator', 'assistant_moderator', 'commentator', 'camera_operator', 'analyst', 'statistician') then
    raise exception 'This role must be invited';
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then
    raise exception 'Invitation expiry must be between now and 30 days';
  end if;
  if not exists (
    select 1 from public.league_registrations
    where id = p_league_registration_id
      and status = 'approved'
      and (owner_id = auth.uid() or public.current_profile_role() = 'super_admin')
  ) then
    raise exception 'You cannot invite staff for this league';
  end if;
  if p_match_id is not null and not exists (
    select 1 from public.matches
    where id = p_match_id and league_registration_id = p_league_registration_id
  ) then
    raise exception 'The selected match does not belong to this league';
  end if;

  insert into public.staff_invitations (league_registration_id, match_id, email, role, permissions, token_hash, expires_at, created_by)
  values (p_league_registration_id, p_match_id, lower(trim(p_email)), p_role, coalesce(p_permissions, '[]'::jsonb), encode(digest(v_token, 'sha256'), 'hex'), p_expires_at, auth.uid())
  returning staff_invitations.id into v_id;

  return query select v_id, v_token, p_expires_at;
end;
$$;

create or replace function public.guard_match_event_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
begin
  v_match_id := case when tg_op = 'DELETE' then old.match_id else new.match_id end;
  if auth.role() <> 'service_role'
    and (auth.uid() is null or not public.has_match_operation_access(v_match_id))
  then
    raise exception 'You are not assigned to operate this match';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists match_events_operation_guard on public.match_events;
create trigger match_events_operation_guard
before insert or update or delete on public.match_events
for each row execute function public.guard_match_event_write();

create or replace function public.guard_match_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
    and (auth.uid() is null or not public.has_match_operation_access(old.id))
  then
    raise exception 'You are not assigned to operate this match';
  end if;
  return new;
end;
$$;

drop trigger if exists matches_operation_guard on public.matches;
create trigger matches_operation_guard
before update on public.matches
for each row execute function public.guard_match_update();
