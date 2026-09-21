-- Security and workflow completion for the role-based operating model.
-- This migration is additive: it leaves existing registrations and broadcasts intact.

create extension if not exists pgcrypto;

alter type public.app_role add value if not exists 'general_moderator';
alter type public.app_role add value if not exists 'assistant_moderator';
alter type public.app_role add value if not exists 'analyst';
alter type public.app_role add value if not exists 'statistician';

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  league_registration_id uuid not null references public.league_registrations(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  email text not null,
  role public.app_role not null,
  permissions jsonb not null default '[]'::jsonb,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (role in ('general_moderator', 'moderator', 'assistant_moderator', 'commentator', 'camera_operator', 'analyst', 'statistician'))
);

create index if not exists staff_invitations_league_idx on public.staff_invitations (league_registration_id, created_at desc);
create index if not exists staff_invitations_email_idx on public.staff_invitations (lower(email));

create table if not exists public.match_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid unique references public.staff_invitations(id) on delete set null,
  league_registration_id uuid not null references public.league_registrations(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  permissions jsonb not null default '[]'::jsonb,
  starts_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists match_staff_assignments_active_idx
  on public.match_staff_assignments (league_registration_id, match_id, user_id, role)
  where revoked_at is null;

create table if not exists public.match_action_audit (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  source text not null default 'manual' check (source in ('manual', 'ai', 'sensor', 'system')),
  created_at timestamptz not null default now()
);

alter table public.match_events add column if not exists visibility text not null default 'live'
  check (visibility in ('live', 'timeline', 'internal'));
alter table public.match_events add column if not exists publication_status text not null default 'published'
  check (publication_status in ('pending', 'confirmed', 'rejected', 'published'));
alter table public.match_events add column if not exists source text not null default 'manual'
  check (source in ('manual', 'ai', 'sensor', 'system'));
alter table public.match_events add column if not exists client_event_id uuid;
create unique index if not exists match_events_client_event_idx
  on public.match_events (match_id, client_event_id) where client_event_id is not null;

-- A user may update contact details, but role and approval state are server-owned.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.id = auth.uid() then
    if new.role not in ('league_owner', 'team_owner', 'sponsor', 'viewer') then
      new.role := 'viewer';
    end if;
    if new.role <> 'viewer' then
      new.account_status := 'pending_verification';
    else
      new.account_status := 'approved';
    end if;
  elsif tg_op = 'UPDATE'
    and (new.role is distinct from old.role or new.account_status is distinct from old.account_status)
    and coalesce(current_setting('app.allow_role_update', true), 'false') <> 'true'
    and public.current_profile_role() <> 'super_admin' then
    raise exception 'Only a Super Admin can change a role or approval status';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
before insert or update on public.profiles
for each row execute function public.guard_profile_privileges();

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
  if p_role not in ('general_moderator', 'moderator', 'assistant_moderator', 'commentator', 'camera_operator', 'analyst', 'statistician') then
    raise exception 'This role must be invited';
  end if;
  if p_expires_at <= now() then raise exception 'Invitation expiry must be in the future'; end if;
  if not exists (
    select 1 from public.league_registrations
    where id = p_league_registration_id
      and (owner_id = auth.uid() or public.current_profile_role() = 'super_admin')
  ) then raise exception 'You cannot invite staff for this league'; end if;

  insert into public.staff_invitations (league_registration_id, match_id, email, role, permissions, token_hash, expires_at, created_by)
  values (p_league_registration_id, p_match_id, lower(trim(p_email)), p_role, coalesce(p_permissions, '[]'::jsonb), encode(digest(v_token, 'sha256'), 'hex'), p_expires_at, auth.uid())
  returning staff_invitations.id into v_id;

  return query select v_id, v_token, p_expires_at;
end;
$$;

create or replace function public.accept_staff_invitation(p_token text)
returns table (role public.app_role, league_registration_id uuid, match_id uuid, permissions jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare v_invite public.staff_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in before accepting an invitation'; end if;
  select * into v_invite from public.staff_invitations
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'Invitation is invalid'; end if;
  if v_invite.revoked_at is not null or v_invite.accepted_at is not null or v_invite.expires_at <= now() then
    raise exception 'Invitation is no longer active';
  end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> lower(v_invite.email) then
    raise exception 'This invitation belongs to a different email address';
  end if;

  perform set_config('app.allow_role_update', 'true', true);
  update public.profiles set role = v_invite.role, account_status = 'approved', updated_at = now() where id = auth.uid();
  update public.staff_invitations set accepted_at = now() where id = v_invite.id;
  insert into public.match_staff_assignments (invitation_id, league_registration_id, match_id, user_id, role, permissions, expires_at)
  values (v_invite.id, v_invite.league_registration_id, v_invite.match_id, auth.uid(), v_invite.role, v_invite.permissions, v_invite.expires_at);
  return query select v_invite.role, v_invite.league_registration_id, v_invite.match_id, v_invite.permissions;
end;
$$;

create or replace function public.audit_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.match_action_audit (match_id, actor_id, action_type, entity_type, entity_id, previous_value, new_value, source)
  values (
    coalesce(new.match_id, old.match_id), auth.uid(), lower(tg_op) || '_event', 'match_event', coalesce(new.id, old.id),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    coalesce(case when tg_op = 'DELETE' then old.source else new.source end, 'manual')
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists match_events_audit on public.match_events;
create trigger match_events_audit
after insert or update or delete on public.match_events
for each row execute function public.audit_match_event();

alter table public.staff_invitations enable row level security;
alter table public.match_staff_assignments enable row level security;
alter table public.match_action_audit enable row level security;

create policy "staff_invitations_owner_or_admin" on public.staff_invitations
for select using (created_by = auth.uid() or public.current_profile_role() = 'super_admin');
create policy "staff_assignments_owner_assignee_or_admin" on public.match_staff_assignments
for select using (
  user_id = auth.uid() or public.current_profile_role() = 'super_admin' or exists (
    select 1 from public.league_registrations lr where lr.id = league_registration_id and lr.owner_id = auth.uid()
  )
);
create policy "match_action_audit_authorized_read" on public.match_action_audit
for select using (
  actor_id = auth.uid() or public.current_profile_role() = 'super_admin' or exists (
    select 1 from public.match_staff_assignments msa
    where msa.match_id = match_action_audit.match_id and msa.user_id = auth.uid() and msa.revoked_at is null
  )
);

revoke all on function public.create_staff_invitation(uuid, text, public.app_role, jsonb, uuid, timestamptz) from public;
revoke all on function public.accept_staff_invitation(text) from public;
grant execute on function public.create_staff_invitation(uuid, text, public.app_role, jsonb, uuid, timestamptz) to authenticated;
grant execute on function public.accept_staff_invitation(text) to authenticated;

create or replace function public.has_match_operation_access(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'super_admin'
    or exists (
      select 1
      from public.match_staff_assignments msa
      where msa.match_id = p_match_id
        and msa.user_id = auth.uid()
        and msa.revoked_at is null
        and (msa.starts_at is null or msa.starts_at <= now())
        and (msa.expires_at is null or msa.expires_at > now())
    )
$$;

revoke all on function public.has_match_operation_access(uuid) from public;
grant execute on function public.has_match_operation_access(uuid) to authenticated;
