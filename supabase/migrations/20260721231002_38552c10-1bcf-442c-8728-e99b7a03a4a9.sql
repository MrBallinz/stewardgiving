-- Revoke EXECUTE from public/anon on SECURITY DEFINER trigger and helper functions.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_recipient_verification_on_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_church_verification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_recipient_verification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_chat_rate(uuid, integer, integer) FROM PUBLIC, anon, authenticated;