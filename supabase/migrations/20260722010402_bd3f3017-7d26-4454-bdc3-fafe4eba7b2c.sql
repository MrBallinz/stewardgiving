
-- 1. Add listing lifecycle + verification columns to churches
ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'pending'
    CHECK (listing_status IN ('pending','approved','rejected','flagged')),
  ADD COLUMN IF NOT EXISTS verified_501c3 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_notes text;

-- Backfill: everything currently seeded/enriched is treated as approved so the app keeps working.
UPDATE public.churches SET listing_status = 'approved'
  WHERE listing_status = 'pending'
    AND source_type IN ('seeded','enriched','irs_bmf');

CREATE INDEX IF NOT EXISTS churches_listing_status_idx ON public.churches(listing_status);

-- 2. Audit log for every giving-link change
CREATE TABLE IF NOT EXISTS public.church_giving_link_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  old_giving_url text,
  new_giving_url text,
  old_giving_platform text,
  new_giving_platform text,
  changed_by uuid,
  changed_by_role text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.church_giving_link_audit TO authenticated;
GRANT ALL ON public.church_giving_link_audit TO service_role;
ALTER TABLE public.church_giving_link_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.church_giving_link_audit
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS church_giving_link_audit_church_idx
  ON public.church_giving_link_audit(church_id, created_at DESC);

-- 3. Reports table (user-submitted "report this listing")
CREATE TABLE IF NOT EXISTS public.church_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  reporter_user_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','reviewed','dismissed','actioned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
GRANT SELECT, INSERT ON public.church_reports TO authenticated;
GRANT ALL ON public.church_reports TO service_role;
ALTER TABLE public.church_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own reports" ON public.church_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());
CREATE POLICY "Users read own reports" ON public.church_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reports" ON public.church_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS church_reports_status_idx ON public.church_reports(status, created_at DESC);

-- 4. Trigger: any change to giving_url on an approved listing bumps status back to pending + logs audit.
CREATE OR REPLACE FUNCTION public.audit_church_giving_link_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    is_admin := public.has_role(auth.uid(), 'admin');
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

    -- If an approved listing's giving link changes and the change isn't
    -- explicitly re-approved by an admin, re-enter review.
    IF OLD.listing_status = 'approved'
       AND NEW.listing_status = 'approved'
       AND auth.role() <> 'service_role'
       AND NOT is_admin THEN
      NEW.listing_status := 'pending';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_church_giving_link ON public.churches;
CREATE TRIGGER trg_audit_church_giving_link
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.audit_church_giving_link_change();

-- 5. Replace public read policy so only approved listings are visible to end users.
DROP POLICY IF EXISTS "Churches public read" ON public.churches;
CREATE POLICY "Approved churches public read" ON public.churches
  FOR SELECT
  USING (listing_status = 'approved');
CREATE POLICY "Admins read all churches" ON public.churches
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Submitters read own pending churches" ON public.churches
  FOR SELECT TO authenticated
  USING (submitted_by_user_id = auth.uid());

-- Force user submissions into pending state.
DROP POLICY IF EXISTS "Users submit churches" ON public.churches;
CREATE POLICY "Users submit churches" ON public.churches
  FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by_user_id = auth.uid()
    AND source_type = 'user_submitted'
    AND enrichment_status = 'user_submitted'
    AND verification_status = 'community_submitted'
    AND listing_status = 'pending'
    AND approved_by_admin_id IS NULL
    AND last_verified_at IS NULL
  );

-- Admins can update churches (approve, edit).
CREATE POLICY "Admins update churches" ON public.churches
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
