-- Canonical League Owner registration, subscription, payment and approval workflow.
-- Apply after 202609220001, 202609260001 and 202609270001.

create extension if not exists pgcrypto;

create table if not exists public.league_subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  currency text not null default 'NGN',
  active boolean not null default true,
  enforce_capacity boolean not null default true,
  max_teams integer,
  max_matches integer,
  max_live_matches integer,
  max_administrators integer,
  storage_limit_gb integer,
  viewer_limit integer,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_subscription_plan_durations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.league_subscription_plans(id) on delete cascade,
  code text not null,
  label text not null,
  months integer check (months is null or months > 0),
  price numeric(14,2) not null check (price >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  active boolean not null default true,
  is_custom_event boolean not null default false,
  unique (plan_id, code)
);

create table if not exists public.league_registration_orders (
  id uuid primary key default gen_random_uuid(),
  registration_reference text not null unique,
  public_token_hash text not null unique,
  account_user_id uuid references public.profiles(id) on delete set null,
  league_registration_id uuid unique references public.league_registrations(id) on delete set null,
  plan_id uuid not null references public.league_subscription_plans(id),
  duration_id uuid not null references public.league_subscription_plan_durations(id),
  registration_status text not null default 'payment_pending' check (registration_status in ('draft','payment_pending','payment_verification_pending','payment_verified','awaiting_admin_approval','approved','rejected','requires_action','suspended','cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending','processing','verified','failed','cancelled','expired')),
  provider text,
  provider_reference text unique,
  expected_amount numeric(14,2) not null check (expected_amount >= 0),
  currency text not null,
  amount_paid numeric(14,2),
  payment_started_at timestamptz,
  payment_verified_at timestamptz,
  signup_available_at timestamptz not null default now() + interval '3 minutes',
  payload jsonb not null,
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_registration_subscriptions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.league_registration_orders(id) on delete cascade,
  league_registration_id uuid unique references public.league_registrations(id) on delete set null,
  plan_id uuid not null references public.league_subscription_plans(id),
  duration_id uuid not null references public.league_subscription_plan_durations(id),
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','suspended')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_plan_change_requests (
  id uuid primary key default gen_random_uuid(),
  league_registration_id uuid not null references public.league_registrations(id) on delete cascade,
  current_subscription_id uuid references public.league_registration_subscriptions(id) on delete set null,
  requested_plan_id uuid not null references public.league_subscription_plans(id),
  requested_duration_id uuid not null references public.league_subscription_plan_durations(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected','payment_pending','payment_verified','completed','cancelled')),
  owner_note text,
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  payment_order_id uuid references public.league_registration_orders(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.league_registrations add column if not exists registration_order_id uuid unique references public.league_registration_orders(id) on delete set null;
alter table public.league_registrations drop constraint if exists league_registrations_subscription_plan_check;
-- A league can have its original registration order plus later approved plan-change orders.
alter table public.league_registration_orders drop constraint if exists league_registration_orders_league_registration_id_key;

insert into public.league_subscription_plans (code, name, description, max_teams, max_matches, max_live_matches, max_administrators, features)
values
  ('starter', 'Starter', 'For smaller leagues and basic match coverage.', 8, 56, 1, 2, '{"ai_coverage":"basic","recording":"limited"}'),
  ('professional', 'Professional', 'For growing leagues requiring more coverage and moderation.', 16, 240, 2, 5, '{"ai_coverage":"advanced","recording":"included"}'),
  ('advanced', 'Advanced', 'For larger leagues requiring higher coverage capacity.', 24, 552, 3, 10, '{"ai_coverage":"full","recording":"expanded"}'),
  ('enterprise', 'Enterprise', 'For large competitions and configurable high-volume operations.', null, null, null, null, '{"ai_coverage":"full","recording":"custom"}')
on conflict (code) do nothing;

insert into public.league_subscription_plan_durations (plan_id, code, label, months, price)
select plan.id, duration.code, duration.label, duration.months, 0
from public.league_subscription_plans plan
cross join (values ('one_month','1 Month',1), ('three_months','3 Months',3), ('six_months','6 Months',6), ('one_year','1 Year',12), ('event','Custom/Event Duration',null)) as duration(code, label, months)
on conflict (plan_id, code) do nothing;

alter table public.league_subscription_plans enable row level security;
alter table public.league_subscription_plan_durations enable row level security;
alter table public.league_registration_orders enable row level security;
alter table public.league_registration_subscriptions enable row level security;
alter table public.league_plan_change_requests enable row level security;

grant select, insert, update, delete on public.league_subscription_plans, public.league_subscription_plan_durations, public.league_registration_orders, public.league_registration_subscriptions to authenticated;
grant select, insert, update, delete on public.league_plan_change_requests to authenticated;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.current_profile_role() = 'super_admin'
$$;

drop policy if exists "plans_public_read" on public.league_subscription_plans;
drop policy if exists "plan_durations_public_read" on public.league_subscription_plan_durations;
drop policy if exists "plans_admin_write" on public.league_subscription_plans;
drop policy if exists "plan_durations_admin_write" on public.league_subscription_plan_durations;
drop policy if exists "orders_owner_or_admin_read" on public.league_registration_orders;
drop policy if exists "subscriptions_owner_or_admin_read" on public.league_registration_subscriptions;
drop policy if exists "plan_change_owner_or_admin_read" on public.league_plan_change_requests;
create policy "plans_public_read" on public.league_subscription_plans for select using (active or public.is_super_admin());
create policy "plan_durations_public_read" on public.league_subscription_plan_durations for select using (active or public.is_super_admin());
create policy "plans_admin_write" on public.league_subscription_plans for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "plan_durations_admin_write" on public.league_subscription_plan_durations for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "orders_owner_or_admin_read" on public.league_registration_orders for select to authenticated using (account_user_id = auth.uid() or public.is_super_admin());
create policy "subscriptions_owner_or_admin_read" on public.league_registration_subscriptions for select to authenticated using (public.is_super_admin() or exists (select 1 from public.league_registration_orders o where o.id = order_id and o.account_user_id = auth.uid()));
create policy "plan_change_owner_or_admin_read" on public.league_plan_change_requests for select to authenticated using (public.is_super_admin() or exists (select 1 from public.league_registrations lr where lr.id = league_registration_id and lr.owner_id = auth.uid()));

create or replace function public.list_public_league_subscription_plans()
returns table (plan_id uuid, code text, name text, description text, currency text, max_teams integer, max_matches integer, max_live_matches integer, features jsonb, duration_id uuid, duration_code text, duration_label text, duration_months integer, price numeric, discount_amount numeric)
language sql stable security definer set search_path = public as $$
  select p.id, p.code, p.name, p.description, p.currency, p.max_teams, p.max_matches, p.max_live_matches, p.features,
         d.id, d.code, d.label, d.months, d.price, d.discount_amount
  from public.league_subscription_plans p
  join public.league_subscription_plan_durations d on d.plan_id = p.id
  where p.active and d.active
  order by p.created_at, d.months nulls last
$$;

create or replace function public.create_league_registration_order(p_payload jsonb, p_plan_id uuid, p_duration_id uuid)
returns table (registration_reference text, public_token text, payment_status text, registration_status text, expected_amount numeric, currency text, signup_available_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_plan public.league_subscription_plans%rowtype; v_duration public.league_subscription_plan_durations%rowtype; v_token text := encode(gen_random_bytes(32), 'hex'); v_reference text := 'REG-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)); v_teams integer := coalesce((p_payload ->> 'expected_teams')::integer, 0); v_matches integer := coalesce((p_payload ->> 'expected_matches')::integer, 0);
begin
  if coalesce(nullif(trim(p_payload ->> 'league_name'), ''), '') = '' or coalesce(nullif(trim(p_payload ->> 'owner_email'), ''), '') = '' then raise exception 'League name and owner email are required'; end if;
  select * into v_plan from public.league_subscription_plans where id = p_plan_id and active;
  select * into v_duration from public.league_subscription_plan_durations where id = p_duration_id and plan_id = p_plan_id and active;
  if not found or v_plan.id is null then raise exception 'The selected plan or duration is unavailable'; end if;
  if v_plan.enforce_capacity and ((v_plan.max_teams is not null and v_teams > v_plan.max_teams) or (v_plan.max_matches is not null and v_matches > v_plan.max_matches)) then raise exception 'The selected plan cannot accommodate this league'; end if;
  insert into public.league_registration_orders (registration_reference, public_token_hash, plan_id, duration_id, expected_amount, currency, payload)
  values (v_reference, md5(v_token), p_plan_id, p_duration_id, greatest(v_duration.price - v_duration.discount_amount, 0), v_plan.currency, p_payload)
  returning registration_reference, payment_status, registration_status, expected_amount, currency, signup_available_at into registration_reference, payment_status, registration_status, expected_amount, currency, signup_available_at;
  public_token := v_token; return next;
end; $$;

drop function if exists public.get_public_league_registration_order(text);
create function public.get_public_league_registration_order(p_token text)
returns table (registration_reference text, league_name text, plan_name text, duration_label text, expected_amount numeric, currency text, payment_status text, registration_status text, signup_allowed boolean, signup_available_at timestamptz, is_plan_change boolean)
language sql stable security definer set search_path = public as $$
 select o.registration_reference, o.payload ->> 'league_name', p.name, d.label, o.expected_amount, o.currency, o.payment_status, o.registration_status,
        (o.payment_status = 'verified' or o.signup_available_at <= now()) and o.registration_status not in ('rejected','cancelled','suspended'), o.signup_available_at,
        (o.payload ? 'plan_change_request_id')
 from public.league_registration_orders o join public.league_subscription_plans p on p.id=o.plan_id join public.league_subscription_plan_durations d on d.id=o.duration_id
 where o.public_token_hash = md5(p_token);
$$;

create or replace function public.verify_league_registration_order_payment(p_order_id uuid, p_provider text, p_provider_reference text, p_amount numeric, p_currency text default 'NGN')
returns void language plpgsql security definer set search_path = public as $$
begin
 if not public.is_super_admin() then raise exception 'Only a Super Admin can verify a payment'; end if;
 update public.league_registration_orders set payment_status='verified', registration_status=case when account_user_id is null then 'payment_verified' else 'awaiting_admin_approval' end, provider=trim(p_provider), provider_reference=trim(p_provider_reference), amount_paid=p_amount, payment_verified_at=now(), updated_at=now()
 where id=p_order_id and upper(currency)=upper(p_currency) and expected_amount=p_amount;
 if not found then raise exception 'Payment amount or currency does not match this registration order'; end if;
 update public.league_plan_change_requests
 set status='payment_verified', updated_at=now()
 where payment_order_id=p_order_id and status='payment_pending';
end; $$;

create or replace function public.request_league_plan_change(p_league_registration_id uuid, p_plan_id uuid, p_duration_id uuid, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_subscription_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.league_registrations where id=p_league_registration_id and owner_id=auth.uid() and status='approved') then raise exception 'Only the active League Owner can request a plan change'; end if;
  if not exists (select 1 from public.league_subscription_plan_durations d join public.league_subscription_plans p on p.id=d.plan_id where d.id=p_duration_id and d.plan_id=p_plan_id and p.active and d.active) then raise exception 'The selected plan or duration is unavailable'; end if;
  select id into v_subscription_id from public.league_registration_subscriptions where league_registration_id=p_league_registration_id and status='active';
  insert into public.league_plan_change_requests (league_registration_id,current_subscription_id,requested_plan_id,requested_duration_id,owner_note) values (p_league_registration_id,v_subscription_id,p_plan_id,p_duration_id,nullif(trim(p_note),'')) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.create_league_plan_change_payment_order(p_request_id uuid)
returns table (registration_reference text, public_token text, expected_amount numeric, currency text)
language plpgsql security definer set search_path = public as $$
declare v_request public.league_plan_change_requests%rowtype; v_plan public.league_subscription_plans%rowtype; v_duration public.league_subscription_plan_durations%rowtype; v_token text := encode(gen_random_bytes(32), 'hex'); v_reference text := 'REG-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)); v_league_name text;
begin
  select * into v_request from public.league_plan_change_requests where id=p_request_id for update;
  if not found or not exists (select 1 from public.league_registrations where id=v_request.league_registration_id and owner_id=auth.uid() and status='approved') then raise exception 'Only the active League Owner can pay for this plan change'; end if;
  if v_request.status <> 'approved' then raise exception 'This plan change has not been approved for payment'; end if;
  select * into v_plan from public.league_subscription_plans where id=v_request.requested_plan_id and active;
  select * into v_duration from public.league_subscription_plan_durations where id=v_request.requested_duration_id and plan_id=v_plan.id and active;
  if not found or v_plan.id is null then raise exception 'The approved plan or duration is unavailable'; end if;
  select league_name into v_league_name from public.league_registrations where id=v_request.league_registration_id;
  insert into public.league_registration_orders (registration_reference, public_token_hash, account_user_id, league_registration_id, plan_id, duration_id, expected_amount, currency, payload)
  values (v_reference, md5(v_token), auth.uid(), v_request.league_registration_id, v_plan.id, v_duration.id, greatest(v_duration.price-v_duration.discount_amount, 0), v_plan.currency, jsonb_build_object('league_name', v_league_name, 'plan_change_request_id', v_request.id))
  returning registration_reference, expected_amount, currency into registration_reference, expected_amount, currency;
  update public.league_plan_change_requests set status='payment_pending', payment_order_id=(select id from public.league_registration_orders where registration_reference=v_reference), updated_at=now() where id=v_request.id;
  public_token := v_token;
  return next;
end; $$;

create or replace function public.review_league_plan_change(p_request_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only a Super Admin can review plan changes'; end if;
  update public.league_plan_change_requests set status=case when p_approve then 'approved' else 'rejected' end, admin_note=nullif(trim(p_note),''), reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now() where id=p_request_id and status='pending';
  if not found then raise exception 'Plan change request is not pending'; end if;
end; $$;

create or replace function public.finalize_league_plan_change(p_request_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_request public.league_plan_change_requests%rowtype; v_months integer; v_plan_code text;
begin
  if not public.is_super_admin() then raise exception 'Only a Super Admin can finalize plan changes'; end if;
  select * into v_request from public.league_plan_change_requests where id=p_request_id for update;
  if not found or v_request.status <> 'payment_verified' then raise exception 'The plan-change payment has not been verified'; end if;
  if not p_approve then
    update public.league_plan_change_requests set status='rejected', admin_note=nullif(trim(p_note),''), reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now() where id=p_request_id;
    return;
  end if;
  select d.months, p.code into v_months, v_plan_code from public.league_subscription_plan_durations d join public.league_subscription_plans p on p.id=d.plan_id where d.id=v_request.requested_duration_id;
  update public.league_registration_subscriptions
  set plan_id=v_request.requested_plan_id, duration_id=v_request.requested_duration_id, status='active', starts_at=now(), expires_at=case when v_months is null then null else now()+make_interval(months => v_months) end, updated_at=now()
  where id=v_request.current_subscription_id;
  update public.league_registrations set subscription_plan=v_plan_code, updated_at=now() where id=v_request.league_registration_id;
  update public.league_plan_change_requests set status='completed', admin_note=nullif(trim(p_note),''), reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now() where id=p_request_id;
end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_token text := new.raw_user_meta_data ->> 'registration_token'; v_invite_token text := new.raw_user_meta_data ->> 'invite_token'; v_requested_role text := lower(coalesce(new.raw_user_meta_data ->> 'role','')); v_order public.league_registration_orders%rowtype; v_plan_code text; v_registration_id uuid;
begin
 if v_requested_role <> 'league_owner' then
   if v_invite_token is null or not exists (select 1 from public.staff_invitations invitation where invitation.token_hash=encode(extensions.digest(v_invite_token,'sha256'),'hex') and invitation.accepted_at is null and invitation.revoked_at is null and invitation.expires_at > now() and lower(invitation.email)=lower(new.email)) then
     raise exception 'This account requires a valid League Owner invitation';
   end if;
   insert into public.profiles (id, first_name, last_name, display_name, email, phone, role, account_status, mfa_enabled)
   values (new.id, nullif(trim(new.raw_user_meta_data ->> 'first_name'),''), nullif(trim(new.raw_user_meta_data ->> 'last_name'),''), nullif(trim(new.raw_user_meta_data ->> 'display_name'),''), new.email, nullif(trim(new.raw_user_meta_data ->> 'phone'),''), 'viewer', 'pending_verification', false) on conflict (id) do nothing;
   return new;
 end if;
 if v_token is null then raise exception 'League Owner signup requires a valid registration payment flow'; end if;
 select * into v_order from public.league_registration_orders where public_token_hash=md5(v_token) for update;
 if not found or v_order.registration_status in ('rejected','cancelled','suspended') or (v_order.payment_status <> 'verified' and v_order.signup_available_at > now()) then raise exception 'This registration is not ready for account signup'; end if;
 if lower(new.email) <> lower(coalesce(v_order.payload ->> 'owner_email', '')) then raise exception 'Use the League Owner email entered during registration'; end if;
 insert into public.profiles (id, first_name, last_name, display_name, email, phone, role, account_status, mfa_enabled)
 values (new.id, nullif(trim(new.raw_user_meta_data ->> 'first_name'),''), nullif(trim(new.raw_user_meta_data ->> 'last_name'),''), nullif(trim(new.raw_user_meta_data ->> 'display_name'),''), new.email, nullif(trim(new.raw_user_meta_data ->> 'phone'),''), 'league_owner', 'pending_approval', false) on conflict (id) do nothing;
 select code into v_plan_code from public.league_subscription_plans where id=v_order.plan_id;
 insert into public.league_registrations (owner_id, status, league_name, description, sport_type, owner_full_name, owner_email, owner_phone, country, state, city, address, opening_date, closing_date, team_registration_deadline, expected_teams, competition_type, football_formats, subscription_plan, billing_mode, registration_order_id)
 values (new.id, case when v_order.payment_status='verified' then 'pending_approval'::public.onboarding_status else 'pending_payment'::public.onboarding_status end, v_order.payload->>'league_name', coalesce(v_order.payload->>'description',''), 'football', coalesce(v_order.payload->>'owner_full_name', new.email), new.email, coalesce(v_order.payload->>'owner_phone',''), coalesce(v_order.payload->>'country',''), coalesce(v_order.payload->>'state',''), coalesce(v_order.payload->>'city',''), coalesce(v_order.payload->>'address',''), coalesce((v_order.payload->>'opening_date')::date,current_date), coalesce((v_order.payload->>'closing_date')::date,current_date + 30), coalesce((v_order.payload->>'team_registration_deadline')::date,current_date), coalesce((v_order.payload->>'expected_teams')::integer,2), coalesce(v_order.payload->>'competition_type','league'), array[coalesce(v_order.payload->>'football_format','11-aside')], v_plan_code, 'league_duration', v_order.id) returning id into v_registration_id;
 update public.league_registration_orders set account_user_id=new.id, league_registration_id=v_registration_id, registration_status=case when payment_status='verified' then 'awaiting_admin_approval' else 'payment_verification_pending' end, updated_at=now() where id=v_order.id;
 insert into public.league_registration_subscriptions (order_id, league_registration_id, plan_id, duration_id) values (v_order.id, v_registration_id, v_order.plan_id, v_order.duration_id) on conflict (order_id) do update set league_registration_id=excluded.league_registration_id;
 return new;
end; $$;

create or replace function public.review_league_registration(p_registration_id uuid, p_status public.onboarding_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_order_id uuid; v_owner_id uuid; v_months integer;
begin
  if not public.is_super_admin() then raise exception 'Only a Super Admin can review a league registration'; end if;
  if p_status not in ('approved','rejected','changes_requested','suspended') then raise exception 'Invalid review decision'; end if;
  select registration_order_id, owner_id into v_order_id, v_owner_id from public.league_registrations where id=p_registration_id for update;
  if not found then raise exception 'League registration not found'; end if;
  if p_status='approved' and not exists (select 1 from public.league_registration_orders where id=v_order_id and payment_status='verified') then raise exception 'Payment must be verified before approval'; end if;
  perform set_config('app.allow_registration_review','true',true);
  update public.league_registrations set status=p_status, review_note=nullif(trim(p_note),''), reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now() where id=p_registration_id;
  update public.league_registration_orders set registration_status=case p_status when 'approved' then 'approved' when 'rejected' then 'rejected' when 'changes_requested' then 'requires_action' else 'suspended' end, admin_note=nullif(trim(p_note),''), reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now() where id=v_order_id;
  if p_status='approved' then
    select d.months into v_months from public.league_registration_subscriptions s join public.league_subscription_plan_durations d on d.id=s.duration_id where s.order_id=v_order_id;
    perform set_config('app.allow_role_update','true',true);
    update public.profiles set account_status='approved', updated_at=now() where id=v_owner_id;
    update public.league_registration_subscriptions set status='active', starts_at=now(), expires_at=case when v_months is null then null else now() + make_interval(months => v_months) end, updated_at=now() where order_id=v_order_id;
  end if;
end; $$;

create or replace function public.verify_league_payment(p_registration_id uuid, p_provider text, p_provider_reference text, p_amount numeric default null, p_currency text default 'NGN')
returns void language plpgsql security definer set search_path = public as $$
declare v_order_id uuid; v_amount numeric;
begin
  if not public.is_super_admin() then raise exception 'Only a Super Admin can verify a league payment'; end if;
  select registration_order_id into v_order_id from public.league_registrations where id=p_registration_id;
  if v_order_id is null then raise exception 'This registration does not have a payment order'; end if;
  select expected_amount into v_amount from public.league_registration_orders where id=v_order_id;
  perform public.verify_league_registration_order_payment(v_order_id, p_provider, p_provider_reference, coalesce(p_amount,v_amount), p_currency);
end; $$;

create or replace function public.expire_league_subscriptions()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if auth.role() <> 'service_role' and not public.is_super_admin() then raise exception 'Service role or Super Admin required'; end if;
  update public.league_registration_subscriptions set status='expired', updated_at=now() where status='active' and expires_at is not null and expires_at <= now();
  get diagnostics v_count = row_count;
  update public.profiles p set account_status='suspended', updated_at=now()
  from public.league_registration_orders o join public.league_registration_subscriptions s on s.order_id=o.id
  where o.account_user_id=p.id and s.status='expired' and p.role='league_owner';
  return v_count;
end; $$;

revoke all on function public.create_league_registration_order(jsonb, uuid, uuid) from public;
revoke all on function public.get_public_league_registration_order(text) from public;
revoke all on function public.list_public_league_subscription_plans() from public;
revoke all on function public.verify_league_registration_order_payment(uuid,text,text,numeric,text) from public;
revoke all on function public.expire_league_subscriptions() from public;
revoke all on function public.request_league_plan_change(uuid,uuid,uuid,text) from public;
revoke all on function public.review_league_plan_change(uuid,boolean,text) from public;
revoke all on function public.create_league_plan_change_payment_order(uuid) from public;
revoke all on function public.finalize_league_plan_change(uuid,boolean,text) from public;
grant execute on function public.create_league_registration_order(jsonb, uuid, uuid) to anon, authenticated;
grant execute on function public.get_public_league_registration_order(text) to anon, authenticated;
grant execute on function public.list_public_league_subscription_plans() to anon, authenticated;
grant execute on function public.verify_league_registration_order_payment(uuid,text,text,numeric,text) to authenticated;
grant execute on function public.expire_league_subscriptions() to authenticated;
grant execute on function public.request_league_plan_change(uuid,uuid,uuid,text) to authenticated;
grant execute on function public.review_league_plan_change(uuid,boolean,text) to authenticated;
grant execute on function public.create_league_plan_change_payment_order(uuid) to authenticated;
grant execute on function public.finalize_league_plan_change(uuid,boolean,text) to authenticated;
