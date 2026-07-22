
-- Plaid columns on bank_connections
ALTER TABLE public.bank_connections
  ADD COLUMN IF NOT EXISTS plaid_item_id text,
  ADD COLUMN IF NOT EXISTS plaid_access_token text,
  ADD COLUMN IF NOT EXISTS institution_name text,
  ADD COLUMN IF NOT EXISTS institution_id text,
  ADD COLUMN IF NOT EXISTS sync_cursor text,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS bank_connections_plaid_item_id_key
  ON public.bank_connections(plaid_item_id) WHERE plaid_item_id IS NOT NULL;

-- Lock down access token: only service_role can read/write it
REVOKE ALL (plaid_access_token) ON public.bank_connections FROM anon, authenticated;
-- (service_role has ALL from the earlier GRANT ALL)

-- Plaid transactions cache (used to compute monthly summaries)
CREATE TABLE IF NOT EXISTS public.plaid_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_connection_id uuid NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  plaid_transaction_id text NOT NULL UNIQUE,
  account_id text,
  posted_date date NOT NULL,
  amount_cents bigint NOT NULL,           -- positive = outflow (expense), negative = inflow (revenue) per Plaid sign
  iso_currency_code text DEFAULT 'USD',
  name text,
  merchant_name text,
  pf_category_primary text,
  pf_category_detailed text,
  pending boolean NOT NULL DEFAULT false,
  excluded boolean NOT NULL DEFAULT false,
  classification text NOT NULL DEFAULT 'auto',  -- 'auto' | 'revenue' | 'expense' | 'transfer' | 'excluded'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.plaid_transactions TO authenticated;
GRANT ALL ON public.plaid_transactions TO service_role;

ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_txns_select" ON public.plaid_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Only allow user to update classification / excluded flags on their own rows
CREATE POLICY "own_txns_update" ON public.plaid_transactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS plaid_txns_user_date_idx
  ON public.plaid_transactions(user_id, posted_date DESC);

CREATE TRIGGER plaid_txns_updated_at
  BEFORE UPDATE ON public.plaid_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Restore has_role EXECUTE to authenticated (needed for RLS policies on admin queues)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
