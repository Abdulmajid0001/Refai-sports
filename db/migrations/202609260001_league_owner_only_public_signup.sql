-- Public account creation is reserved for League Owners. Every other
-- application role must be granted by an active, email-bound league invitation.

alter table public.staff_invitations drop constraint if exists staff_invitations_role_check;
alter table public.staff_invitations drop constraint if exists staff_invitations_invitable_role_check;
alter table public.staff_invitations add constraint staff_invitations_invitable_role_check
  check (role in (
    'team_owner', 'coach', 'general_moderator', 'moderator', 'assistant_moderator',
    'commentator', 'camera_operator', 'analyst', 'statistician', 'viewer', 'sponsor'
  ));

-- This Auth-user trigger is the enforcement point for all clients, including
-- requests made directly to Supabase Auth rather than through the web page.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', ''));
  v_invite_token text := new.raw_user_meta_data ->> 'invite_token';
  v_role public.app_role;
begin
  if v_requested_role = 'league_owner' then
    v_role := 'league_owner';
  elsif v_invite_token is not null and exists (
    select 1
    from public.staff_invitations invitation
    where invitation.token_hash = encode(digest(v_invite_token, 'sha256'), 'hex')
      and invitation.accepted_at is null
      and invitation.revoked_at is null
      and invitation.expires_at > now()
      and lower(invitation.email) = lower(new.email)
  ) then
    -- The invitation RPC replaces this neutral role with the invited role.
    v_role := 'viewer';
  else
    raise exception 'Only League Owner accounts can be created without a league invitation';
  end if;

  insert into public.profiles (
    id, first_name, last_name, display_name, email, phone, role, account_status, mfa_enabled
  ) values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    v_role,
    'pending_verification',
    false
  ) on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_token text := auth.jwt() -> 'user_metadata' ->> 'invite_token';
begin
  if tg_op = 'INSERT' and new.id = auth.uid() then
    if new.role = 'league_owner' then
      new.account_status := 'pending_verification';
    elsif v_invite_token is not null and exists (
      select 1
      from public.staff_invitations invitation
      where invitation.token_hash = encode(digest(v_invite_token, 'sha256'), 'hex')
        and invitation.accepted_at is null
        and invitation.revoked_at is null
        and invitation.expires_at > now()
        and lower(invitation.email) = lower(coalesce(new.email, auth.jwt() ->> 'email', ''))
    ) then
      -- The invitation RPC assigns the final role after email confirmation.
      new.role := 'viewer';
      new.account_status := 'pending_verification';
    else
      raise exception 'Only League Owner accounts can be created without a league invitation';
    end if;
  elsif tg_op = 'UPDATE'
    and (new.role is distinct from old.role or new.account_status is distinct from old.account_status)
    and coalesce(current_setting('app.allow_role_update', true), 'false') <> 'true'
    and public.current_profile_role() <> 'super_admin' then
    raise exception 'Only a Super Admin or invitation acceptance can change a role or approval status';
  end if;
  return new;
end;
$$;

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
  if p_role not in (
    'team_owner', 'coach', 'general_moderator', 'moderator', 'assistant_moderator',
    'commentator', 'camera_operator', 'analyst', 'statistician', 'viewer', 'sponsor'
  ) then
    raise exception 'League Owners cannot invite this role';
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
    raise exception 'You cannot invite people for this league';
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
