-- =========================
-- ROLE ENUM FIX
-- =========================

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role'
      and n.nspname = 'public'
  ) then
    create type public.app_role as enum (
      'super_admin',
      'league_owner',
      'team_owner',
      'coach',
      'moderator',
      'camera_operator',
      'commentator',
      'viewer',
      'sponsor'
    );
  end if;
end
$$;

alter type public.app_role add value if not exists 'super_admin';
alter type public.app_role add value if not exists 'league_owner';
alter type public.app_role add value if not exists 'team_owner';
alter type public.app_role add value if not exists 'coach';
alter type public.app_role add value if not exists 'moderator';
alter type public.app_role add value if not exists 'camera_operator';
alter type public.app_role add value if not exists 'commentator';
alter type public.app_role add value if not exists 'viewer';
alter type public.app_role add value if not exists 'sponsor';

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'onboarding_status'
      and n.nspname = 'public'
  ) then
    create type public.onboarding_status as enum (
      'draft',
      'pending_verification',
      'pending_payment',
      'pending_approval',
      'changes_requested',
      'approved',
      'rejected',
      'suspended'
    );
  end if;
end
$$;

-- =========================
-- PROFILES
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  email text,
  phone text,
  role public.app_role not null default 'viewer',
  account_status public.onboarding_status not null default 'pending_verification',
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz
);

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists account_status public.onboarding_status default 'pending_verification';
alter table public.profiles add column if not exists mfa_enabled boolean not null default false;
alter table public.profiles add column if not exists last_login timestamptz;

-- =========================
-- LEAGUE REGISTRATION
-- =========================

create table if not exists public.league_registrations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status public.onboarding_status not null default 'pending_payment',

  league_name text not null,
  short_name text,
  description text not null,
  sport_type text not null default 'football',
  logo_url text,
  banner_url text,
  intro_video_url text,
  anthem_url text,
  slogan text,

  owner_full_name text not null,
  organization_name text,
  owner_email text not null,
  owner_phone text not null,
  country text not null,
  state text not null,
  city text not null,
  address text not null,

  opening_date date not null,
  closing_date date not null,
  team_registration_deadline date not null,
  expected_teams integer not null check (expected_teams > 0),
  competition_type text not null check (competition_type in ('league','knockout','cup','hybrid')),

  football_formats text[] not null default '{}',
  venue_mode text not null default 'single' check (venue_mode in ('single','multiple')),
  venues jsonb not null default '[]'::jsonb,

  rules_text text,
  rules_file_url text,
  documents jsonb not null default '[]'::jsonb,
  branding_assets jsonb not null default '{}'::jsonb,
  graphics_preferences jsonb not null default '{}'::jsonb,
  automation jsonb not null default '{}'::jsonb,

  subscription_plan text not null check (subscription_plan in ('starter','professional','elite')),
  billing_mode text not null check (billing_mode in ('monthly','league_duration','annual')),
  payment_reference text,

  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- WALLETS
-- =========================

create table if not exists public.league_wallets (
  id uuid primary key default gen_random_uuid(),
  league_registration_id uuid not null references public.league_registrations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  currency text not null default 'NGN',
  available_balance numeric(14,2) not null default 0,
  ledger_balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.league_wallets(id) on delete cascade,
  entry_type text not null,
  amount numeric(14,2) not null,
  platform_tax numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null,
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- TEAM INVITES & TEAMS
-- =========================

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  league_registration_id uuid not null references public.league_registrations(id) on delete cascade,
  token text not null unique,
  email text,
  role public.app_role not null default 'team_owner',
  expires_at timestamptz,
  used_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.team_registrations (
  id uuid primary key default gen_random_uuid(),
  league_registration_id uuid not null references public.league_registrations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_id uuid references public.team_invites(id),

  status public.onboarding_status not null default 'pending_approval',

  team_name text not null,
  short_name text not null,
  logo_url text,
  badge_url text,
  banner_url text,
  motto text,
  description text,

  owner_name text not null,
  owner_email text not null,
  owner_phone text not null,

  head_coach text not null,
  assistant_coach text,
  team_manager text not null,
  medical_staff text,

  sponsor_logos jsonb not null default '[]'::jsonb,
  jerseys jsonb not null default '{}'::jsonb,

  home_ground text,
  training_ground text,

  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- PLAYERS
-- =========================

create table if not exists public.player_registrations (
  id uuid primary key default gen_random_uuid(),
  team_registration_id uuid not null references public.team_registrations(id) on delete cascade,

  full_name text not null,
  passport_photo_url text,
  full_body_photo_url text,
  jersey_number integer not null check (jersey_number between 1 and 99),
  dob date not null,
  nationality text not null,
  position text not null,
  preferred_foot text check (preferred_foot in ('left','right','both')),
  height_cm integer,
  weight_kg integer,

  contract_info text,
  emergency_contact text,
  media jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- =========================
-- CHANGE HISTORY
-- =========================

create table if not exists public.change_history_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_role public.app_role,
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  previous_value jsonb,
  new_value jsonb,
  device text,
  ip_address text,
  created_at timestamptz not null default now()
);

-- =========================
-- ROLE FUNCTION FIX
-- =========================

drop function if exists public.current_profile_role();

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

-- =========================
-- ENABLE RLS
-- =========================

alter table public.profiles enable row level security;
alter table public.league_registrations enable row level security;
alter table public.league_wallets enable row level security;
alter table public.wallet_ledger_entries enable row level security;
alter table public.team_invites enable row level security;
alter table public.team_registrations enable row level security;
alter table public.player_registrations enable row level security;
alter table public.change_history_logs enable row level security;

-- =========================
-- POLICIES
-- =========================

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select
using (
  id = auth.uid()
  or public.current_profile_role()::text = 'super_admin'
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
for update
using (
  id = auth.uid()
  or public.current_profile_role()::text = 'super_admin'
);

drop policy if exists "league_owner_or_admin" on public.league_registrations;
create policy "league_owner_or_admin" on public.league_registrations
for all
using (
  owner_id = auth.uid()
  or public.current_profile_role()::text = 'super_admin'
)
with check (
  owner_id = auth.uid()
  or public.current_profile_role()::text = 'super_admin'
);

drop policy if exists "team_invites_league_owner_or_admin" on public.team_invites;
create policy "team_invites_league_owner_or_admin" on public.team_invites
for all
using (
  public.current_profile_role()::text = 'super_admin'
  or exists (
    select 1
    from public.league_registrations lr
    where lr.id = league_registration_id
      and lr.owner_id = auth.uid()
  )
)
with check (
  public.current_profile_role()::text = 'super_admin'
  or exists (
    select 1
    from public.league_registrations lr
    where lr.id = league_registration_id
      and lr.owner_id = auth.uid()
  )
);

drop policy if exists "team_owner_league_owner_or_admin" on public.team_registrations;
create policy "team_owner_league_owner_or_admin" on public.team_registrations
for all
using (
  owner_id = auth.uid()
  or public.current_profile_role()::text = 'super_admin'
  or exists (
    select 1
    from public.league_registrations lr
    where lr.id = league_registration_id
      and lr.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  or public.current_profile_role()::text = 'super_admin'
  or exists (
    select 1
    from public.league_registrations lr
    where lr.id = league_registration_id
      and lr.owner_id = auth.uid()
  )
);

drop policy if exists "players_team_or_league_or_admin" on public.player_registrations;
create policy "players_team_or_league_or_admin" on public.player_registrations
for all
using (
  public.current_profile_role()::text = 'super_admin'
  or exists (
    select 1
    from public.team_registrations tr
    where tr.id = team_registration_id
      and tr.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.team_registrations tr
    join public.league_registrations lr on lr.id = tr.league_registration_id
    where tr.id = team_registration_id
      and lr.owner_id = auth.uid()
  )
)
with check (
  public.current_profile_role()::text = 'super_admin'
  or exists (
    select 1
    from public.team_registrations tr
    where tr.id = team_registration_id
      and tr.owner_id = auth.uid()
  )
);
