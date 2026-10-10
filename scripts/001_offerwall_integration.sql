-- OfferwallApi integration: completion ledger + idempotent S2S postback crediting.
-- Run this after scripts/000_setup_database.sql (safe to re-run).

-- Allow the 'offerwall' transaction type alongside the existing ones.
do $$
declare
  con record;
begin
  for con in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'transactions'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%type%'
  loop
    execute format('alter table public.transactions drop constraint %I', con.conname);
  end loop;
end;
$$;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('ad_view', 'faucet', 'referral_bonus', 'withdrawal', 'ad_deposit', 'offerwall'));

-- One row per OfferwallApi postback transId, so retried deliveries can't double-credit.
create table if not exists public.offerwall_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trans_id text not null unique,
  reward_satoshi bigint not null check (reward_satoshi > 0),
  status smallint not null check (status in (1, 2)), -- 1 = credit, 2 = chargeback
  offer_type text,
  offer_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_offerwall_completions_user on public.offerwall_completions(user_id);

alter table public.offerwall_completions enable row level security;

drop policy if exists "offerwall_completions_select_own" on public.offerwall_completions;
create policy "offerwall_completions_select_own" on public.offerwall_completions
  for select using (auth.uid() = user_id);

-- Called only by the server-side postback route (service role), never by a logged-in
-- user's session — see revoke statements at the bottom of this file.
create or replace function public.process_offerwall_postback(
  p_user_id uuid,
  p_trans_id text,
  p_reward_satoshi bigint,
  p_status smallint,
  p_offer_type text default null,
  p_offer_name text default null
)
returns table(already_processed boolean, applied_satoshi bigint)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  applied bigint;
begin
  if exists (select 1 from public.offerwall_completions where trans_id = p_trans_id) then
    return query select true, 0::bigint;
    return;
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Unknown user for offerwall postback';
  end if;

  applied := case when p_status = 2 then -p_reward_satoshi else p_reward_satoshi end;

  insert into public.offerwall_completions (user_id, trans_id, reward_satoshi, status, offer_type, offer_name)
  values (p_user_id, p_trans_id, p_reward_satoshi, p_status, p_offer_type, p_offer_name);

  update public.profiles
  set btc_balance = greatest(btc_balance + applied, 0),
      total_earned = case when applied > 0 then total_earned + applied else total_earned end
  where id = p_user_id;

  insert into public.transactions (user_id, type, amount_satoshi, description)
  values (p_user_id, 'offerwall', applied, coalesce(p_offer_name, 'Offerwall reward'));

  if applied > 0 then
    perform public.award_referral_bonus(p_user_id, applied);
  end if;

  return query select false, applied;
end;
$$;

revoke all on function public.process_offerwall_postback(uuid, text, bigint, smallint, text, text) from public;
revoke all on function public.process_offerwall_postback(uuid, text, bigint, smallint, text, text) from anon;
revoke all on function public.process_offerwall_postback(uuid, text, bigint, smallint, text, text) from authenticated;
-- Intentionally no grant: only the service_role (used by app/api/offerwall/postback)
-- can call this function. Supabase grants service_role implicit access to public
-- schema functions, so no explicit grant statement is needed here.
