REVOKE EXECUTE ON FUNCTION public.protect_recipient_verification() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.protect_church_verification() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reset_recipient_verification_on_insert() FROM anon, authenticated, public;