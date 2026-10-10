# OfferwallApi Integration

CryptoBTC uses [OfferwallApi](https://offerwallapi.com) as its ad/offer network. This
document covers everything that's wired up today, how it works end to end, and what's
left to do before it's fully live.

## What OfferwallApi is

An offerwall and advertising network built for faucet / "get paid to" sites.
Advertisers buy PTC, video, shortlink, task, banner, pop-up, and push campaigns;
publishers (us) earn a share every time a user completes one. Payouts to us are in
USDT via FaucetPay, weekly, no commission, $0.10 minimum.

## What's integrated

There are three separate pieces, added in this order:

### 1. Banner + pop-up ad scripts (display ads, site-wide)

Two `<script>` tags in the `<head>` of `app/layout.tsx`, so they load on every route:

```tsx
<script src="https://offerwallapi.com/ads/banner.js?k=7d500cb04584d48d1b8cc24f" async />
<script
  src="https://offerwallapi.com/ads/pop.js?k=667b21017345432463925432&f=1&t=1"
  data-freq="1"
  data-hours="1"
  async
/>
```

These are self-contained ad-unit embed codes generated per placement from the
OfferwallApi dashboard (**Apps & Websites**) — the `k` value is a placement key, not
the same key as the offerwall app key below. Nothing else to configure; they render
wherever OfferwallApi decides to inject the banner/pop-up based on the key.

### 2. Offerwall embed (the actual earning surface)

`app/dashboard/offerwall/page.tsx` — a new dashboard page (linked in the sidebar and
as a quick action on the dashboard home) that embeds OfferwallApi's full offer catalog
(PTC, video, shortlinks, tasks) in an iframe:

```
https://offerwallapi.com/offerwall/[OFFERWALLAPI_API_KEY]/[SUPABASE_USER_ID]
```

The Supabase auth user's UUID is passed as OfferwallApi's `USER_ID` (their `subId`) —
this is what ties a completed offer back to the right account when the postback
arrives.

### 3. Server-to-server (S2S) postback — automatic crediting

`app/api/offerwall/postback/route.ts`. When a user completes an offer, OfferwallApi's
servers call this endpoint directly (not the browser) with the result. The route:

1. Reads `subId`, `transId`, `reward`, `status`, `offer_type`, `offer_name`,
   `signature`, `signature2` from the query string (GET) or body (POST).
2. **Verifies the signature** server-side using `OFFERWALLAPI_SECRET_KEY`:
   - Preferred: `signature2 = HMAC-SHA256(subId + transId + reward, secret)`
   - Legacy fallback: `signature = MD5(subId + transId + reward + secret)`
   - Both comparisons use `crypto.timingSafeEqual` to avoid timing attacks.
3. Rejects the request (HTTP 401/400) if the signature doesn't match or required
   fields are missing — this is the only thing stopping anyone from forging a credit
   by hitting the endpoint directly.
4. Calls the `process_offerwall_postback` Postgres RPC via a **service-role** Supabase
   client (`lib/supabase/admin.ts`), which bypasses RLS since this request has no
   logged-in session.
5. Returns the literal body `ok` on success (required by OfferwallApi — anything else
   is treated as a failed delivery and retried at 1m / 5m / 15m / 1h / 6h / 24h).

**Database side** (`scripts/001_offerwall_integration.sql`):

- `offerwall_completions` table — one row per `transId`, with a `unique` constraint.
  This is what makes crediting idempotent: if OfferwallApi retries a postback (e.g.
  because our server was briefly down), the second delivery is detected and the
  function returns `already_processed = true` without crediting twice.
- `process_offerwall_postback(...)` — a `security definer` RPC that, in one
  transaction: checks for a duplicate `transId`, inserts the completion row, updates
  `profiles.btc_balance` / `total_earned` (adds for `status = 1` credit, subtracts for
  `status = 2` chargeback, never lets balance go negative), writes a `transactions`
  row with `type = 'offerwall'`, and — on a net-positive credit — calls the existing
  `award_referral_bonus()` function, so referrers get their usual 10% cut of offerwall
  earnings too, exactly like ad views and faucet claims.
- The `transactions.type` check constraint is widened to allow `'offerwall'`.
- Execute on `process_offerwall_postback` is revoked from `public`, `anon`, and
  `authenticated` — **only** the service-role key (used exclusively by the postback
  route) can call it. This is what stops a logged-in user from calling the RPC
  directly from their browser session to self-credit satoshi.

## Environment variables

Documented in `.env.example`, set on Vercel for Production/Preview/Development:

| Variable | Used by | Exposure |
|---|---|---|
| `OFFERWALLAPI_API_KEY` | `app/dashboard/offerwall/page.tsx` (builds the iframe URL) | Safe to appear in rendered HTML — this is the public app key |
| `OFFERWALLAPI_SECRET_KEY` | `app/api/offerwall/postback/route.ts` (signature verification) | Server-only, never sent to the browser, never logged |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` (RLS bypass for crediting) | Server-only — already existed in Vercel from the Supabase integration, now actually used |

## What's left to do

**The database migration has not been applied to the live Supabase project yet.**
Until `scripts/001_offerwall_integration.sql` runs against the production database,
the postback route will fail (the `process_offerwall_postback` function and
`offerwall_completions` table won't exist) — OfferwallApi will just see failed
deliveries and retry on its normal backoff schedule, so nothing breaks, but nothing
gets credited either.

To apply it, either:

- Run `npm run db:setup` locally with real Supabase credentials in `.env.local`
  (applies every `scripts/*.sql` file in order, including the new one), **or**
- Paste the contents of `scripts/001_offerwall_integration.sql` into the Supabase
  SQL Editor and run it directly.

**Also confirm in the OfferwallApi dashboard** (Apps & Websites → your app) that the
**Postback URL** is set to:

```
https://www.cryptoweb.online/api/offerwall/postback
```

(it must match your app's domain, per OfferwallApi's requirements). Use the
**Integration test** panel there first — test postbacks are sent with `debug=1` and a
`test-`-prefixed `transId`, so they exercise the full signature-verification and
crediting path without creating real earnings.

## Reward flow, end to end

1. User opens **Dashboard → Offerwall**, sees the embedded offer catalog.
2. User completes an offer on OfferwallApi's site (outside our app).
3. OfferwallApi's server calls `POST/GET https://www.cryptoweb.online/api/offerwall/postback`
   with the signed result.
4. Our route verifies the signature, credits `profiles.btc_balance`, logs a
   `transactions` row (`type = 'offerwall'`), and pays the referrer their 10% cut —
   all in one atomic, idempotent database transaction.
5. The user sees the new balance and the `Offerwall` entry next time they load the
   dashboard or transaction history — no polling, no manual claim step.
