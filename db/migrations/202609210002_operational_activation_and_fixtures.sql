-- Canonical activation bridge: registrations become operational public entities only after approval.
-- Existing operational rows remain intact; this migration only adds traceable links.

alter table public.leagues
  add column if not exists league_registration_id uuid unique references public.league_registrations(id) on delete set null;
alter table public.teams
  add column if not exists team_registration_id uuid unique references public.team_registrations(id) on delete set null;
alter table public.matches
  add column if not exists league_registration_id uuid references public.league_registrations(id) on delete set null;

create index if not exists leagues_registration_idx on public.leagues (league_registration_id);
create index if not exists teams_registration_idx on public.teams (team_registration_id);
create index if not exists matches_registration_idx on public.matches (league_registration_id, kickoff_at);

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
      join public.matches m on m.id = p_match_id
      where (msa.match_id = p_match_id or (msa.match_id is null and msa.league_registration_id = m.league_registration_id))
        and msa.user_id = auth.uid()
        and msa.revoked_at is null
        and (msa.starts_at is null or msa.starts_at <= now())
        and (msa.expires_at is null or msa.expires_at > now())
    )
$$;

create or replace function public.registration_slug(p_name text, p_id uuid)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_name, 'refai')), '[^a-z0-9]+', '-', 'g'))
    || '-' || left(p_id::text, 8)
$$;

create or replace function public.activate_league_registration(p_registration_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.league_registrations%rowtype;
  v_league_id uuid;
begin
  if auth.uid() is null or public.current_profile_role() <> 'super_admin' then
    raise exception 'Only a Super Admin can activate a league';
  end if;

  select * into v_registration
  from public.league_registrations
  where id = p_registration_id
  for update;
  if not found then raise exception 'League registration not found'; end if;
  if v_registration.status <> 'approved' then
    raise exception 'Approve the registration before activation';
  end if;

  select id into v_league_id from public.leagues
  where league_registration_id = p_registration_id;

  if v_league_id is null then
    insert into public.leagues (
      name, slug, logo_url, description, format, created_by, league_registration_id
    ) values (
      v_registration.league_name,
      public.registration_slug(v_registration.league_name, v_registration.id),
      v_registration.logo_url,
      v_registration.description,
      coalesce(v_registration.football_formats[1], '5-aside'),
      v_registration.owner_id,
      v_registration.id
    )
    returning id into v_league_id;
  end if;

  insert into public.league_wallets (league_registration_id, owner_id)
  values (p_registration_id, v_registration.owner_id)
  on conflict do nothing;

  return v_league_id;
end;
$$;

create or replace function public.activate_team_registration(p_team_registration_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.team_registrations%rowtype;
  v_league_id uuid;
  v_team_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_registration
  from public.team_registrations
  where id = p_team_registration_id
  for update;
  if not found then raise exception 'Team registration not found'; end if;
  if v_registration.status <> 'approved' then
    raise exception 'Approve the team before activation';
  end if;
  if not exists (
    select 1 from public.league_registrations
    where id = v_registration.league_registration_id
      and (owner_id = auth.uid() or public.current_profile_role() = 'super_admin')
  ) then raise exception 'You cannot activate this team'; end if;

  select id into v_league_id from public.leagues
  where league_registration_id = v_registration.league_registration_id;
  if v_league_id is null then
    raise exception 'Activate the league before activating its teams';
  end if;

  select id into v_team_id from public.teams
  where team_registration_id = p_team_registration_id;
  if v_team_id is null then
    insert into public.teams (
      name, slug, logo_url, league_id, created_by, team_registration_id
    ) values (
      v_registration.team_name,
      public.registration_slug(v_registration.team_name, v_registration.id),
      v_registration.logo_url,
      v_league_id,
      v_registration.owner_id,
      v_registration.id
    )
    returning id into v_team_id;
  end if;

  return v_team_id;
end;
$$;

create or replace function public.create_operational_match(
  p_league_registration_id uuid,
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_kickoff_at timestamptz,
  p_venue text,
  p_matchday integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id uuid;
  v_match_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_home_team_id = p_away_team_id then raise exception 'Home and away teams must differ'; end if;
  if p_kickoff_at <= now() - interval '1 day' then raise exception 'Kickoff cannot be more than one day in the past'; end if;
  if not exists (
    select 1 from public.league_registrations
    where id = p_league_registration_id
      and status = 'approved'
      and (owner_id = auth.uid() or public.current_profile_role() = 'super_admin')
  ) then raise exception 'You cannot schedule a match for this league'; end if;

  select id into v_league_id from public.leagues
  where league_registration_id = p_league_registration_id;
  if v_league_id is null then raise exception 'League is not activated'; end if;
  if not exists (select 1 from public.teams where id = p_home_team_id and league_id = v_league_id)
    or not exists (select 1 from public.teams where id = p_away_team_id and league_id = v_league_id)
  then raise exception 'Both teams must be active members of this league'; end if;

  insert into public.matches (
    home_team_id, away_team_id, home_score, away_score, status, kickoff_at, venue, league_id, matchday, league_registration_id
  ) values (
    p_home_team_id, p_away_team_id, 0, 0, 'scheduled', p_kickoff_at, nullif(trim(p_venue), ''), v_league_id, p_matchday, p_league_registration_id
  )
  returning id into v_match_id;
  return v_match_id;
end;
$$;

revoke all on function public.activate_league_registration(uuid) from public;
revoke all on function public.activate_team_registration(uuid) from public;
revoke all on function public.create_operational_match(uuid, uuid, uuid, timestamptz, text, integer) from public;
grant execute on function public.activate_league_registration(uuid) to authenticated;
grant execute on function public.activate_team_registration(uuid) to authenticated;
grant execute on function public.create_operational_match(uuid, uuid, uuid, timestamptz, text, integer) to authenticated;
