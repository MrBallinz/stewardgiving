
-- 1. Move has_role into a private schema not exposed via PostgREST
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate policies to reference private.has_role
DROP POLICY IF EXISTS "Admins read audit" ON public.church_giving_link_audit;
CREATE POLICY "Admins read audit" ON public.church_giving_link_audit
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own reports" ON public.church_reports;
CREATE POLICY "Users read own reports" ON public.church_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update reports" ON public.church_reports;
CREATE POLICY "Admins update reports" ON public.church_reports
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read all churches" ON public.churches;
CREATE POLICY "Admins read all churches" ON public.churches
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update churches" ON public.churches;
CREATE POLICY "Admins update churches" ON public.churches
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- Update audit trigger function to use private.has_role
CREATE OR REPLACE FUNCTION public.audit_church_giving_link_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  is_admin boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    is_admin := private.has_role(auth.uid(), 'admin');
  END IF;

  IF NEW.giving_url IS DISTINCT FROM OLD.giving_url
     OR NEW.giving_platform IS DISTINCT FROM OLD.giving_platform THEN

    INSERT INTO public.church_giving_link_audit(
      church_id, old_giving_url, new_giving_url,
      old_giving_platform, new_giving_platform,
      changed_by, changed_by_role)
    VALUES (
      NEW.id, OLD.giving_url, NEW.giving_url,
      OLD.giving_platform, NEW.giving_platform,
      auth.uid(),
      CASE WHEN auth.role() = 'service_role' THEN 'service_role'
           WHEN is_admin THEN 'admin'
           ELSE COALESCE(auth.role()::text,'anon') END);

    IF OLD.listing_status = 'approved'
       AND NEW.listing_status = 'approved'
       AND auth.role() <> 'service_role'
       AND NOT is_admin THEN
      NEW.listing_status := 'pending';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- Drop the publicly-exposed has_role (now unused by policies/triggers)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2. Lock down bank_connections: block direct SELECT of plaid_access_token
--    by only granting column-level SELECT on non-sensitive columns.
REVOKE SELECT ON public.bank_connections FROM authenticated, anon;
GRANT SELECT (id, user_id, institution_name, account_mask, plaid_item_id,
              created_at, is_mock, institution_id, last_sync_at, status)
  ON public.bank_connections TO authenticated;
-- Writes still governed by RLS (owner policies); UPDATE/INSERT/DELETE grants unchanged.

-- 3. Add explicit owner-scoped INSERT/DELETE policies for plaid_transactions
--    so writes are always scoped to the authenticated owner (service role bypasses RLS).
DROP POLICY IF EXISTS "Users insert own plaid transactions" ON public.plaid_transactions;
CREATE POLICY "Users insert own plaid transactions" ON public.plaid_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own plaid transactions" ON public.plaid_transactions;
CREATE POLICY "Users delete own plaid transactions" ON public.plaid_transactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
