-- Payment confirmation is a separate, auditable workflow. A league cannot be
-- approved until a Super Admin has verified a provider reference.

create table if not exists public.league_payment_verifications (
  id uuid primary key default gen_random_uuid(),
  league_registration_id uuid not null unique references public.league_registrations(id) on delete cascade,
  provider text not null,
  provider_reference text not null,
  amount numeric(14,2),
  currency text not null default 'NGN',
  status text not null default 'verified' check (status in ('verified', 'rejected')),
  verified_by uuid not null references public.profiles(id),
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

alter table public.league_payment_verifications enable row level security;

drop policy if exists "League owners can read payment verification" on public.league_payment_verifications;
create policy "League owners can read payment verification"
on public.league_payment_verifications for select to authenticated
using (
  public.current_profile_role() = 'super_admin'
  or exists (
    select 1 from public.league_registrations lr
    where lr.id = league_payment_verifications.league_registration_id
      and lr.owner_id = auth.uid()
  )
);

create or replace function public.verify_league_payment(
  p_registration_id uuid,
  p_provider text,
  p_provider_reference text,
  p_amount numeric default null,
  p_currency text default 'NGN'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_profile_role() <> 'super_admin' then
    raise exception 'Only a Super Admin can verify a league payment';
  end if;
  if nullif(trim(p_provider), '') is null or nullif(trim(p_provider_reference), '') is null then
    raise exception 'Provider and provider reference are required';
  end if;
  if not exists (select 1 from public.league_registrations where id = p_registration_id) then
    raise exception 'League registration not found';
  end if;

  insert into public.league_payment_verifications (
    league_registration_id, provider, provider_reference, amount, currency, status, verified_by, verified_at, updated_at
  ) values (
    p_registration_id, trim(p_provider), trim(p_provider_reference), p_amount, upper(trim(coalesce(p_currency, 'NGN'))), 'verified', auth.uid(), now(), now()
  )
  on conflict (league_registration_id) do update set
    provider = excluded.provider,
    provider_reference = excluded.provider_reference,
    amount = excluded.amount,
    currency = excluded.currency,
    status = 'verified',
    verified_by = auth.uid(),
    verified_at = now(),
    updated_at = now();

  perform set_config('app.allow_registration_review', 'true', true);
  update public.league_registrations
  set payment_reference = trim(p_provider_reference),
      status = case when status = 'pending_payment' then 'pending_approval'::public.onboarding_status else status end,
      updated_at = now()
  where id = p_registration_id;
end;
$$;

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
  if p_status = 'approved' and not exists (
    select 1 from public.league_payment_verifications
    where league_registration_id = p_registration_id and status = 'verified'
  ) then
    raise exception 'Verify the league payment before approving this registration';
  end if;

  perform set_config('app.allow_registration_review', 'true', true);
  update public.league_registrations
  set status = p_status, review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_registration_id;
  if not found then raise exception 'League registration not found'; end if;
end;
$$;

revoke all on function public.verify_league_payment(uuid, text, text, numeric, text) from public;
grant execute on function public.verify_league_payment(uuid, text, text, numeric, text) to authenticated;
