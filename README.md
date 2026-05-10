# CryptoBTC / BTC Earning

A Next.js + Supabase Bitcoin rewards workspace for paid-to-click ads, faucet claims, referrals, advertiser campaigns, and withdrawal requests.

## Features

- Supabase authentication with protected dashboard routes
- Server-side reward ledger RPCs for faucet claims, ad views, campaign creation, and withdrawal requests
- Paid-to-click surf ads queue with countdown completion
- Hourly faucet with database-enforced cooldown
- Referral tracking and commission ledger entries
- Advertiser campaign creation, budget locking, campaign list, and stats
- Withdrawal request flow with pending/processing/completed/rejected states
- Polished dark fintech UI with responsive dashboard, icons, animations, and toast feedback

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill your Supabase/Postgres values:

```bash
cp .env.example .env.local
```

3. Apply the Supabase schema:

```bash
npm run db:setup
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run db:setup
npm run typecheck
npm run lint
npm run build
```

## Important Notes

- Do not commit `.env.local` or production secrets.
- The database schema source of truth is `scripts/000_setup_database.sql`.
- Real Bitcoin payout automation is not included yet; withdrawal requests are recorded for manual review.
