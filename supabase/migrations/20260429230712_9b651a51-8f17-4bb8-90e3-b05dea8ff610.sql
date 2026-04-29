
-- Revoke EXECUTE from anon and authenticated for the trigger helpers — they are only called via triggers.
REVOKE EXECUTE ON FUNCTION public.protect_recipient_verification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_recipient_verification_on_insert() FROM PUBLIC, anon, authenticated;

-- Existing pre-migration helpers — also lock down to be safe.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Server-only tables: explicit empty-policy posture.
-- (No CREATE POLICY needed — RLS enabled with no policies = deny all to anon/authenticated.
--  Service role bypasses RLS, which is what edge functions use.)

-- Add a comment to make the intent explicit.
COMMENT ON TABLE public.chat_rate_buckets IS 'Server-only. Managed by faith-chat edge function via service role. RLS deny-all to authenticated/anon by design.';
COMMENT ON TABLE public.webhook_events IS 'Server-only. Idempotency log for incoming webhooks (Stripe, etc). RLS deny-all to authenticated/anon by design.';
