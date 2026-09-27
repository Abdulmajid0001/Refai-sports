-- Product-completion repair. Apply this file once after 202609270002.
-- It is additive and safe to run after the previously applied subscription workflow.

create table if not exists public.subscription_notification_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.league_registration_subscriptions(id) on delete cascade,
  notice_key text not null,
  created_at timestamptz not null default now(),
  unique (subscription_id, notice_key)
);

alter table public.subscription_notification_log enable row level security;
revoke all on public.subscription_notification_log from anon, authenticated;

-- A plan feature is enabled unless the Super Admin explicitly turns that key off.
-- This preserves access for the seeded plans while allowing feature-by-feature control.
create or replace function public.league_subscription_feature_enabled(p_league_registration_id uuid, p_feature text)
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when auth.role() = 'service_role' or public.is_super_admin() then true
    else coalesce((plan.features ->> p_feature)::boolean, true)
  end
  from public.league_registration_subscriptions subscription
  join public.league_subscription_plans plan on plan.id = subscription.plan_id
  where subscription.league_registration_id = p_league_registration_id
    and subscription.status = 'active'
    and (subscription.expires_at is null or subscription.expires_at > now())
  order by subscription.updated_at desc
  limit 1
$$;

create or replace function public.require_league_subscription_feature(p_league_registration_id uuid, p_feature text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.league_subscription_feature_enabled(p_league_registration_id, p_feature) then
    raise exception 'Your active subscription does not include %', replace(p_feature, '_', ' ');
  end if;
end;
$$;

-- Keep staff invitations behind both ownership and the plan feature.
create or replace function public.create_staff_invitation(
  p_league_registration_id uuid,
  p_email text,
  p_role public.app_role,
  p_permissions jsonb default '[]'::jsonb,
  p_match_id uuid default null,
  p_expires_at timestamptz default now() + interval '7 days'
)
returns table (id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_token text := encode(gen_random_bytes(32), 'hex'); v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_email), '') is null then raise exception 'An invited email address is required'; end if;
  if p_role not in ('general_moderator', 'moderator', 'assistant_moderator', 'commentator', 'camera_operator', 'analyst', 'statistician') then raise exception 'This role must be invited'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then raise exception 'Invitation expiry must be between now and 30 days'; end if;
  if not exists (select 1 from public.league_registrations where id=p_league_registration_id and status='approved' and (owner_id=auth.uid() or public.is_super_admin())) then raise exception 'You cannot invite staff for this league'; end if;
  perform public.require_league_subscription_feature(p_league_registration_id, 'staff_invitations');
  if p_match_id is not null and not exists (select 1 from public.matches where id=p_match_id and league_registration_id=p_league_registration_id) then raise exception 'The selected match does not belong to this league'; end if;
  insert into public.staff_invitations (league_registration_id, match_id, email, role, permissions, token_hash, expires_at, created_by)
  values (p_league_registration_id, lower(trim(p_email)), p_role, coalesce(p_permissions, '[]'::jsonb), encode(extensions.digest(v_token, 'sha256'), 'hex'), p_expires_at, auth.uid())
  returning staff_invitations.id into v_id;
  return query select v_id, v_token, p_expires_at;
end;
$$;

create or replace function public.guard_match_event_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_match_id uuid; v_registration_id uuid;
begin
  v_match_id := case when tg_op = 'DELETE' then old.match_id else new.match_id end;
  select league_registration_id into v_registration_id from public.matches where id=v_match_id;
  if auth.role() <> 'service_role' and (auth.uid() is null or not public.has_match_operation_access(v_match_id)) then raise exception 'You are not assigned to operate this match'; end if;
  if v_registration_id is not null then perform public.require_league_subscription_feature(v_registration_id, 'match_operations'); end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.guard_match_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_registration_id uuid;
begin
  if auth.role() <> 'service_role' and (auth.uid() is null or not public.has_match_operation_access(old.id)) then raise exception 'You are not assigned to operate this match'; end if;
  select league_registration_id into v_registration_id from public.matches where id=old.id;
  if v_registration_id is not null then perform public.require_league_subscription_feature(v_registration_id, 'match_operations'); end if;
  return new;
end;
$$;

create or replace function public.refresh_my_subscription_notifications()
returns integer language plpgsql security definer set search_path = public as $$
declare v_subscription record; v_key text; v_title text; v_body text; v_count integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for v_subscription in
    select subscription.id, subscription.expires_at, plan.name as plan_name
    from public.league_registration_subscriptions subscription
    join public.league_registration_orders order_record on order_record.id=subscription.order_id
    join public.league_subscription_plans plan on plan.id=subscription.plan_id
    where order_record.account_user_id=auth.uid() and subscription.status='active' and subscription.expires_at is not null
  loop
    if v_subscription.expires_at <= now() then
      v_key := 'expired'; v_title := 'Subscription expired'; v_body := v_subscription.plan_name || ' has expired. Request a plan change or renewal to restore access.';
    elsif v_subscription.expires_at <= now() + interval '1 day' then
      v_key := 'one_day'; v_title := 'Subscription expires tomorrow'; v_body := v_subscription.plan_name || ' expires within one day.';
    elsif v_subscription.expires_at <= now() + interval '7 days' then
      v_key := 'seven_days'; v_title := 'Subscription expires in 7 days'; v_body := v_subscription.plan_name || ' expires soon.';
    elsif v_subscription.expires_at <= now() + interval '14 days' then
      v_key := 'fourteen_days'; v_title := 'Subscription expires in 14 days'; v_body := v_subscription.plan_name || ' expires soon.';
    elsif v_subscription.expires_at <= now() + interval '30 days' then
      v_key := 'thirty_days'; v_title := 'Subscription expires in 30 days'; v_body := v_subscription.plan_name || ' expires soon.';
    else
      continue;
    end if;
    insert into public.subscription_notification_log(subscription_id, notice_key) values (v_subscription.id, v_key) on conflict do nothing;
    if found then
      insert into public.notifications(user_id, kind, title, body) values (auth.uid(), 'subscription', v_title, v_body);
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

create or replace function public.get_league_top_scorers(p_league_id uuid)
returns table (player_name text, team_name text, goals bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(substring(event.detail from 'Scorer: ([^,]+)')), ''), 'Unspecified scorer') as player_name,
         coalesce(team.name, 'Unknown team') as team_name,
         count(*)::bigint as goals
  from public.match_events event
  join public.matches match_record on match_record.id=event.match_id
  left join public.teams team on team.id=event.team_id
  where match_record.league_id=p_league_id
    and event.type='goal'
    and coalesce(event.visibility, 'live') <> 'internal'
    and coalesce(event.publication_status, 'published')='published'
  group by 1, 2
  order by goals desc, player_name asc
  limit 25
$$;

revoke all on function public.league_subscription_feature_enabled(uuid, text) from public;
revoke all on function public.require_league_subscription_feature(uuid, text) from public;
revoke all on function public.refresh_my_subscription_notifications() from public;
revoke all on function public.get_league_top_scorers(uuid) from public;
grant execute on function public.league_subscription_feature_enabled(uuid, text) to authenticated;
grant execute on function public.require_league_subscription_feature(uuid, text) to authenticated;
grant execute on function public.refresh_my_subscription_notifications() to authenticated;
grant execute on function public.get_league_top_scorers(uuid) to anon, authenticated;
