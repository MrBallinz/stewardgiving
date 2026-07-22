# Plaid Integration + Receipt PDFs + Smart Prefill

Turn Steward from "manual entry + open giving page" into the automated flow: bank connects → profits calculated nightly → one click opens the church's giving page with the amount prefilled where possible → PDF receipts stored for year-end taxes.

## 1. Plaid bank connection (read-only)

**Secrets to add (Sandbox first, swap to Production later):**
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV` (`sandbox` → `production`)

**Edge functions:**
- `plaid-link-token` — creates a Link token for the signed-in user (products: `transactions`, country: `US`).
- `plaid-exchange` — swaps the public_token for an access_token; stores it in `bank_connections` (encrypted at rest via Supabase; access_token column is service-role-only via RLS).
- `plaid-sync` — pulls last 90 days of transactions on first link, then uses `/transactions/sync` cursor for incrementals. Classifies inflows as revenue, outflows as expenses (using Plaid's `personal_finance_category`). Upserts `monthly_summaries` for each affected month.
- `plaid-webhook` — receives `SYNC_UPDATES_AVAILABLE` and triggers `plaid-sync` for that item.

**Schema additions to `bank_connections`:**
- `plaid_item_id`, `plaid_access_token` (service-role only), `institution_name`, `last_sync_at`, `sync_cursor`, `status`.

**Frontend:**
- New `ConnectBank.tsx` on Dashboard empty state and Settings — uses `react-plaid-link`, calls `plaid-link-token`, then `plaid-exchange` on success, then kicks off initial `plaid-sync`.
- Dashboard shows "Connected to {institution} • last synced X min ago" + Resync button.

**Nightly cron (pg_cron + pg_net):** calls `plaid-sync` at 3am UTC for every active connection so monthly summaries stay current.

## 2. Smart prefill per giving platform

New `src/lib/giving-prefill.ts` adapter — takes `(giving_url, amount_cents)` and returns the best deep-link:

- **Tithe.ly** — supports `?amount=` → prefill works.
- **DonorBox** — supports `?default_interval=o&amount=` → prefill works.
- **Pushpay** — no public prefill; open URL + copy amount to clipboard, show toast "Amount copied — paste into Pushpay".
- **Overflow / Givelify / EasyTithe / Generis** — same clipboard fallback.
- **Unknown domains** — clipboard fallback.

Review page uses this on the "Give now" button and records the attempt as a `giving_transactions` row with `status='pending'` until the user confirms "I completed this gift".

## 3. Receipt PDFs + year-end packet

**Storage:** create private `receipts` bucket, path `{user_id}/{yyyy}/{transaction_id}.pdf`.

**Edge function `generate-receipt`:** builds a PDF (using `pdf-lib` via npm:) with donor name, recipient name + EIN (from `giving_recipients.verified_ein`), amount, date, "No goods or services were provided" IRS language. Uploads to storage, writes `receipt_url` on the transaction row.

Trigger: after a transaction flips to `completed`.

**Year-end packet:** `/report` gets a "Download 2026 tax packet" button — edge function `generate-tax-packet` zips all receipts for the year + a summary PDF and returns a signed URL (24h).

## 4. Profit transparency

Add a "How this was calculated" drawer on each monthly summary showing the raw Plaid transactions grouped by category, so the user can see exactly what counted as revenue vs expense and mark any as excluded (transfers, owner draws). Excluded transactions recompute the month's profit + giving amount.

## Order of implementation

1. Plaid secrets + `plaid-link-token`, `plaid-exchange`, schema migration, Connect Bank UI.
2. `plaid-sync` + monthly summary upsert + nightly cron.
3. Prefill adapter + Review page wiring.
4. Receipt PDF generation + year-end packet.
5. Transaction transparency drawer.

Ship 1 + 2 first so the core "auto-calculated profit" loop is real; 3–5 layer on after you confirm the sandbox flow works with your own bank.

## Technical notes

- Plaid access tokens are stored in `bank_connections.plaid_access_token` with a column-level RLS policy denying all client access — only edge functions using the service role can read it.
- `/transactions/sync` cursor avoids duplicate imports and handles removed transactions correctly.
- Webhook endpoint uses `verify_jwt = false` and validates Plaid's `webhook_verification_key` via JWT.
- PDF generation uses `pdf-lib` (pure JS, works in Deno via `npm:pdf-lib`).
- Sandbox uses Plaid's test institution `ins_109508` with credentials `user_good / pass_good` — I'll walk you through the first connect.

## What I need from you before starting

1. Confirm you have a Plaid developer account (free) and can grab a **Sandbox** `client_id` + `secret` from https://dashboard.plaid.com/team/keys — I'll prompt for them via the secure secrets form when I begin.
2. Confirm US-only for launch (Plaid country codes / IRS receipt language assume this).