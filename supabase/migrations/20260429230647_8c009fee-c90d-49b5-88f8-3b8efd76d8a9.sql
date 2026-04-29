
-- 1. Lock verification columns: replace user UPDATE policy with one that forbids writing verification_* fields.
-- We use a row-level trigger that raises if a non-service-role attempts to change verification fields.

CREATE OR REPLACE FUNCTION public.protect_recipient_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if the caller is the service role (used by edge functions with service key).
  -- auth.role() returns 'service_role' for service-key requests, 'authenticated' for users.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block any user-side change to verification columns.
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_name IS DISTINCT FROM OLD.verified_name
     OR NEW.verified_logo_url IS DISTINCT FROM OLD.verified_logo_url
     OR NEW.verified_ein IS DISTINCT FROM OLD.verified_ein
     OR NEW.verification_notes IS DISTINCT FROM OLD.verification_notes
  THEN
    RAISE EXCEPTION 'Verification fields can only be set by the verification service.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_recipient_verification_trg ON public.giving_recipients;
CREATE TRIGGER protect_recipient_verification_trg
BEFORE UPDATE ON public.giving_recipients
FOR EACH ROW
EXECUTE FUNCTION public.protect_recipient_verification();

-- Also block users from inserting pre-verified recipients.
CREATE OR REPLACE FUNCTION public.reset_recipient_verification_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.verification_status := 'unverified';
  NEW.verified_at := NULL;
  NEW.verified_name := NULL;
  NEW.verified_logo_url := NULL;
  NEW.verified_ein := NULL;
  NEW.verification_notes := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reset_recipient_verification_on_insert_trg ON public.giving_recipients;
CREATE TRIGGER reset_recipient_verification_on_insert_trg
BEFORE INSERT ON public.giving_recipients
FOR EACH ROW
EXECUTE FUNCTION public.reset_recipient_verification_on_insert();

-- 2. Append-only ledger for giving_transactions: lock UPDATE/DELETE on non-pending rows.
DROP POLICY IF EXISTS "Own tx update" ON public.giving_transactions;
DROP POLICY IF EXISTS "Own tx delete" ON public.giving_transactions;

CREATE POLICY "Own tx update pending only"
ON public.giving_transactions
FOR UPDATE
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.monthly_summaries ms
    WHERE ms.id = giving_transactions.monthly_summary_id
      AND ms.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.monthly_summaries ms
    WHERE ms.id = giving_transactions.monthly_summary_id
      AND ms.user_id = auth.uid()
  )
);

CREATE POLICY "Own tx delete pending only"
ON public.giving_transactions
FOR DELETE
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.monthly_summaries ms
    WHERE ms.id = giving_transactions.monthly_summary_id
      AND ms.user_id = auth.uid()
  )
);

-- Also lock monthly_summaries once approved: only update if previous status was 'pending'.
DROP POLICY IF EXISTS "Own summaries update" ON public.monthly_summaries;
CREATE POLICY "Own summaries update pending only"
ON public.monthly_summaries
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- 3. Persistent rate-limit bucket for faith-chat (server-managed).
CREATE TABLE IF NOT EXISTS public.chat_rate_buckets (
  user_id uuid PRIMARY KEY,
  minute_window_start timestamptz NOT NULL DEFAULT now(),
  minute_count int NOT NULL DEFAULT 0,
  hour_window_start timestamptz NOT NULL DEFAULT now(),
  hour_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rate_buckets ENABLE ROW LEVEL SECURITY;
-- No user policies: this table is server-only (service role bypasses RLS).

-- 4. Webhook events idempotency table for Stripe (and others).
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,           -- e.g. Stripe event id
  source text NOT NULL,          -- e.g. 'stripe'
  type text,
  payload jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No user policies: server-only.
