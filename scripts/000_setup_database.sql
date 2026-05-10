create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  btc_balance bigint not null default 0 check (btc_balance >= 0),
  total_earned bigint not null default 0 check (total_earned >= 0),
  total_withdrawn bigint not null default 0 check (total_withdrawn >= 0),
  referral_code text unique not null,
  referred_by uuid references public.profiles(id),
  ads_viewed integer not null default 0 check (ads_viewed >= 0),
  is_advertiser boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  url text not null,
  reward_satoshi bigint not null check (reward_satoshi > 0),
  view_duration integer not null check (view_duration between 5 and 300),
  total_budget bigint not null check (total_budget > 0),
  remaining_budget bigint not null check (remaining_budget >= 0),
  total_views integer not null default 0 check (total_views >= 0),
  max_views_per_user integer not null default 1 check (max_views_per_user > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (remaining_budget <= total_budget)
);

create table if not exists public.ad_views (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  earned_satoshi bigint not null check (earned_satoshi > 0),
  viewed_at timestamptz not null default now()
);

create table if not exists public.faucet_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_satoshi bigint not null check (amount_satoshi > 0),
  claimed_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  bonus_earned bigint not null default 0 check (bonus_earned >= 0),
  created_at timestamptz not null default now(),
  unique (referred_id),
  check (referrer_id <> referred_id)
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_satoshi bigint not null check (amount_satoshi > 0),
  btc_address text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('ad_view', 'faucet', 'referral_bonus', 'withdrawal', 'ad_deposit')),
  amount_satoshi bigint not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_referral_code on public.profiles(referral_code);
create index if not exists idx_ads_user_id on public.ads(user_id);
create index if not exists idx_ads_active_budget on public.ads(is_active, remaining_budget);
create index if not exists idx_ad_views_user_id on public.ad_views(user_id);
create index if not exists idx_ad_views_ad_id on public.ad_views(ad_id);
create index if not exists idx_ad_views_user_ad on public.ad_views(user_id, ad_id);
create index if not exists idx_faucet_claims_user_claimed on public.faucet_claims(user_id, claimed_at desc);
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_referrals_referred_id on public.referrals(referred_id);
create index if not exists idx_withdrawals_user_created on public.withdrawals(user_id, created_at desc);
create index if not exists idx_withdrawals_status on public.withdrawals(status);
create index if not exists idx_transactions_user_created on public.transactions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.ads enable row level security;
alter table public.ad_views enable row level security;
alter table public.faucet_claims enable row level security;
alter table public.referrals enable row level security;
alter table public.withdrawals enable row level security;
alter table public.transactions enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'ads', 'ad_views', 'faucet_claims', 'referrals', 'withdrawals', 'transactions')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$$;

create policy "profiles_select_related" on public.profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1 from public.referrals r
      where (r.referrer_id = auth.uid() and r.referred_id = profiles.id)
         or (r.referred_id = auth.uid() and r.referrer_id = profiles.id)
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "ads_select_available_or_owner" on public.ads
  for select using (
    auth.uid() = user_id
    or (is_active = true and remaining_budget >= reward_satoshi)
  );

create policy "ad_views_select_related" on public.ad_views
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.ads a
      where a.id = ad_views.ad_id and a.user_id = auth.uid()
    )
  );

create policy "faucet_claims_select_own" on public.faucet_claims
  for select using (auth.uid() = user_id);

create policy "referrals_select_related" on public.referrals
  for select using (auth.uid() in (referrer_id, referred_id));

create policy "withdrawals_select_own" on public.withdrawals
  for select using (auth.uid() = user_id);

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_ads_updated_at on public.ads;
create trigger set_ads_updated_at
  before update on public.ads
  for each row execute function public.set_updated_at();

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_referral_code text;
  referrer_id_val uuid;
  referral_code_input text;
begin
  loop
    new_referral_code := public.generate_referral_code();
    exit when not exists (
      select 1 from public.profiles where referral_code = new_referral_code
    );
  end loop;

  referral_code_input := nullif(upper(trim(new.raw_user_meta_data ->> 'referred_by')), '');

  if referral_code_input is not null then
    select id into referrer_id_val
    from public.profiles
    where referral_code = referral_code_input
    limit 1;
  end if;

  insert into public.profiles (id, email, username, referral_code, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new_referral_code,
    referrer_id_val
  )
  on conflict (id) do nothing;

  if referrer_id_val is not null and referrer_id_val <> new.id then
    insert into public.referrals (referrer_id, referred_id)
    values (referrer_id_val, new.id)
    on conflict (referred_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.award_referral_bonus(
  p_referred_id uuid,
  p_earning_amount bigint
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  referrer_id_val uuid;
  bonus_amount bigint;
begin
  bonus_amount := floor(p_earning_amount * 0.10)::bigint;

  if bonus_amount <= 0 then
    return;
  end if;

  select referred_by into referrer_id_val
  from public.profiles
  where id = p_referred_id;

  if referrer_id_val is null then
    return;
  end if;

  update public.profiles
  set btc_balance = btc_balance + bonus_amount,
      total_earned = total_earned + bonus_amount
  where id = referrer_id_val;

  update public.referrals
  set bonus_earned = bonus_earned + bonus_amount
  where referrer_id = referrer_id_val
    and referred_id = p_referred_id;

  insert into public.transactions (user_id, type, amount_satoshi, description)
  values (referrer_id_val, 'referral_bonus', bonus_amount, 'Referral commission');
end;
$$;

create or replace function public.claim_faucet()
returns table(amount_satoshi bigint, balance bigint, next_available_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  last_claim_at timestamptz;
  reward bigint;
  new_balance bigint;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtext('faucet:' || current_user_id::text));

  select claimed_at into last_claim_at
  from public.faucet_claims
  where user_id = current_user_id
  order by claimed_at desc
  limit 1;

  if last_claim_at is not null and last_claim_at > now() - interval '1 hour' then
    raise exception 'Faucet cooldown active';
  end if;

  reward := floor(random() * 91 + 10)::bigint;

  insert into public.faucet_claims (user_id, amount_satoshi)
  values (current_user_id, reward);

  update public.profiles
  set btc_balance = btc_balance + reward,
      total_earned = total_earned + reward
  where id = current_user_id
  returning btc_balance into new_balance;

  insert into public.transactions (user_id, type, amount_satoshi, description)
  values (current_user_id, 'faucet', reward, 'Faucet claim');

  perform public.award_referral_bonus(current_user_id, reward);

  return query select reward, new_balance, now() + interval '1 hour';
end;
$$;

create or replace function public.complete_ad_view(p_ad_id uuid)
returns table(earned_satoshi bigint, balance bigint)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  ad_record public.ads%rowtype;
  user_view_count integer;
  new_balance bigint;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtext('ad-view:' || current_user_id::text || ':' || p_ad_id::text));

  select * into ad_record
  from public.ads
  where id = p_ad_id
  for update;

  if not found then
    raise exception 'Ad not found';
  end if;

  if ad_record.user_id = current_user_id then
    raise exception 'You cannot earn from your own ad';
  end if;

  if ad_record.is_active is not true or ad_record.remaining_budget < ad_record.reward_satoshi then
    raise exception 'Ad is not available';
  end if;

  select count(*) into user_view_count
  from public.ad_views
  where user_id = current_user_id
    and ad_id = p_ad_id;

  if user_view_count >= ad_record.max_views_per_user then
    raise exception 'View limit reached for this ad';
  end if;

  insert into public.ad_views (ad_id, user_id, earned_satoshi)
  values (p_ad_id, current_user_id, ad_record.reward_satoshi);

  update public.profiles
  set btc_balance = btc_balance + ad_record.reward_satoshi,
      total_earned = total_earned + ad_record.reward_satoshi,
      ads_viewed = ads_viewed + 1
  where id = current_user_id
  returning btc_balance into new_balance;

  update public.ads
  set remaining_budget = remaining_budget - ad_record.reward_satoshi,
      total_views = total_views + 1,
      is_active = case
        when remaining_budget - ad_record.reward_satoshi < ad_record.reward_satoshi then false
        else is_active
      end
  where id = p_ad_id;

  insert into public.transactions (user_id, type, amount_satoshi, description)
  values (current_user_id, 'ad_view', ad_record.reward_satoshi, 'Viewed: ' || ad_record.title);

  perform public.award_referral_bonus(current_user_id, ad_record.reward_satoshi);

  return query select ad_record.reward_satoshi, new_balance;
end;
$$;

create or replace function public.request_withdrawal(
  p_amount bigint,
  p_btc_address text
)
returns table(withdrawal_id uuid, balance bigint)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  new_withdrawal_id uuid;
  new_balance bigint;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount < 10000 then
    raise exception 'Minimum withdrawal is 10000 satoshi';
  end if;

  if p_btc_address !~ '(^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$)|(^bc1[ac-hj-np-z02-9]{11,71}$)' then
    raise exception 'Invalid Bitcoin address format';
  end if;

  perform pg_advisory_xact_lock(hashtext('withdraw:' || current_user_id::text));

  update public.profiles
  set btc_balance = btc_balance - p_amount,
      total_withdrawn = total_withdrawn + p_amount
  where id = current_user_id
    and btc_balance >= p_amount
  returning btc_balance into new_balance;

  if new_balance is null then
    raise exception 'Insufficient balance';
  end if;

  insert into public.withdrawals (user_id, amount_satoshi, btc_address, status)
  values (current_user_id, p_amount, trim(p_btc_address), 'pending')
  returning id into new_withdrawal_id;

  insert into public.transactions (user_id, type, amount_satoshi, description)
  values (current_user_id, 'withdrawal', -p_amount, 'Withdrawal to ' || left(trim(p_btc_address), 10) || '...');

  return query select new_withdrawal_id, new_balance;
end;
$$;

create or replace function public.create_ad_campaign(
  p_title text,
  p_description text,
  p_url text,
  p_reward_satoshi bigint,
  p_view_duration integer,
  p_total_budget bigint
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  new_ad_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if length(trim(p_title)) < 1 or length(trim(p_title)) > 100 then
    raise exception 'Title must be 1-100 characters';
  end if;

  if p_url !~* '^https?://' then
    raise exception 'URL must start with http:// or https://';
  end if;

  if p_reward_satoshi < 10 or p_reward_satoshi > 500 then
    raise exception 'Reward must be between 10 and 500 satoshi';
  end if;

  if p_view_duration < 5 or p_view_duration > 60 then
    raise exception 'View duration must be between 5 and 60 seconds';
  end if;

  if p_total_budget < p_reward_satoshi then
    raise exception 'Budget must be at least reward per view';
  end if;

  perform pg_advisory_xact_lock(hashtext('create-ad:' || current_user_id::text));

  update public.profiles
  set btc_balance = btc_balance - p_total_budget,
      is_advertiser = true
  where id = current_user_id
    and btc_balance >= p_total_budget;

  if not found then
    raise exception 'Insufficient balance';
  end if;

  insert into public.ads (
    user_id,
    title,
    description,
    url,
    reward_satoshi,
    view_duration,
    total_budget,
    remaining_budget,
    is_active
  )
  values (
    current_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    trim(p_url),
    p_reward_satoshi,
    p_view_duration,
    p_total_budget,
    p_total_budget,
    true
  )
  returning id into new_ad_id;

  insert into public.transactions (user_id, type, amount_satoshi, description)
  values (current_user_id, 'ad_deposit', -p_total_budget, 'Ad campaign: ' || trim(p_title));

  return new_ad_id;
end;
$$;

create or replace function public.set_ad_status(
  p_ad_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.ads
  set is_active = p_is_active
  where id = p_ad_id
    and user_id = current_user_id
    and remaining_budget >= reward_satoshi;

  if not found then
    raise exception 'Ad not found or budget depleted';
  end if;
end;
$$;

create or replace function public.get_platform_stats()
returns table(users_count bigint, ads_count bigint, total_paid_satoshi bigint)
language sql
security definer
set search_path = public, auth
as $$
  select
    (select count(*) from public.profiles)::bigint,
    (select count(*) from public.ads where is_active = true and remaining_budget >= reward_satoshi)::bigint,
    coalesce((select sum(abs(amount_satoshi)) from public.transactions where type = 'withdrawal'), 0)::bigint;
$$;

revoke all on function public.claim_faucet() from public;
revoke all on function public.complete_ad_view(uuid) from public;
revoke all on function public.request_withdrawal(bigint, text) from public;
revoke all on function public.create_ad_campaign(text, text, text, bigint, integer, bigint) from public;
revoke all on function public.set_ad_status(uuid, boolean) from public;

grant execute on function public.claim_faucet() to authenticated;
grant execute on function public.complete_ad_view(uuid) to authenticated;
grant execute on function public.request_withdrawal(bigint, text) to authenticated;
grant execute on function public.create_ad_campaign(text, text, text, bigint, integer, bigint) to authenticated;
grant execute on function public.set_ad_status(uuid, boolean) to authenticated;
grant execute on function public.get_platform_stats() to anon, authenticated;
