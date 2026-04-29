-- =========================================================
-- STEWARD MVP — additive schema migration
-- =========================================================

-- ---------- bank_connections: add is_mock ----------
ALTER TABLE public.bank_connections
  ADD COLUMN IF NOT EXISTS is_mock boolean NOT NULL DEFAULT true;

-- ---------- giving_recipients: extend ----------
ALTER TABLE public.giving_recipients
  ADD COLUMN IF NOT EXISTS church_id uuid,
  ADD COLUMN IF NOT EXISTS custom_name text,
  ADD COLUMN IF NOT EXISTS custom_ein text,
  ADD COLUMN IF NOT EXISTS giving_method text NOT NULL DEFAULT 'platform_link',
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.giving_recipients
  DROP CONSTRAINT IF EXISTS giving_recipients_method_check;
ALTER TABLE public.giving_recipients
  ADD CONSTRAINT giving_recipients_method_check
  CHECK (giving_method IN ('platform_link','manual','check'));

ALTER TABLE public.giving_recipients
  DROP CONSTRAINT IF EXISTS giving_recipients_alloc_check;
ALTER TABLE public.giving_recipients
  ADD CONSTRAINT giving_recipients_alloc_check
  CHECK (allocation_percent >= 0 AND allocation_percent <= 100);

-- ---------- monthly_summaries: extend ----------
ALTER TABLE public.monthly_summaries
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.monthly_summaries
  DROP CONSTRAINT IF EXISTS monthly_summaries_source_check;
ALTER TABLE public.monthly_summaries
  ADD CONSTRAINT monthly_summaries_source_check
  CHECK (source IN ('manual','mock_bank','import','plaid_future'));

-- unique(user_id, month) — only add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_summaries_user_month_unique'
  ) THEN
    ALTER TABLE public.monthly_summaries
      ADD CONSTRAINT monthly_summaries_user_month_unique UNIQUE (user_id, month);
  END IF;
END $$;

-- ---------- giving_transactions: extend ----------
ALTER TABLE public.giving_transactions
  ADD COLUMN IF NOT EXISTS marked_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;

-- =========================================================
-- CHURCHES — public read, server-only verification writes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ein text UNIQUE,
  legal_name text NOT NULL,
  dba_name text,
  street text,
  city text,
  state text,
  zip text,
  ntee_code text,
  denomination text,
  website text,
  phone text,
  giving_platform text,
  giving_url text,
  google_place_id text,
  enrichment_status text NOT NULL DEFAULT 'seeded',
  verification_status text NOT NULL DEFAULT 'unverified',
  source_type text NOT NULL DEFAULT 'seeded',
  source_url text,
  submitted_by_user_id uuid,
  approved_by_admin_id uuid,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT churches_giving_platform_check CHECK (
    giving_platform IS NULL OR giving_platform IN (
      'tithely','pushpay','givelify','anedot','subsplash','vanco',
      'churchtrac','overflow','planning_center','easytithe',
      'stripe_direct','every_org','unknown'
    )
  ),
  CONSTRAINT churches_enrichment_check CHECK (
    enrichment_status IN ('seeded','enriched','verified','user_submitted','user_corrected','rejected')
  ),
  CONSTRAINT churches_verification_check CHECK (
    verification_status IN ('verified','community_submitted','needs_review','unverified')
  )
);

CREATE INDEX IF NOT EXISTS churches_legal_name_idx ON public.churches USING gin (to_tsvector('simple', legal_name));
CREATE INDEX IF NOT EXISTS churches_dba_idx ON public.churches (dba_name);
CREATE INDEX IF NOT EXISTS churches_state_city_idx ON public.churches (state, city);
CREATE INDEX IF NOT EXISTS churches_ein_idx ON public.churches (ein);

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Churches public read" ON public.churches;
CREATE POLICY "Churches public read" ON public.churches
  FOR SELECT TO authenticated USING (true);

-- Authenticated users may submit a new church, but they can never set verification fields.
DROP POLICY IF EXISTS "Users submit churches" ON public.churches;
CREATE POLICY "Users submit churches" ON public.churches
  FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by_user_id = auth.uid()
    AND source_type = 'user_submitted'
    AND enrichment_status = 'user_submitted'
    AND verification_status = 'community_submitted'
    AND approved_by_admin_id IS NULL
    AND last_verified_at IS NULL
  );

-- No client UPDATE / DELETE on churches. Service role bypasses RLS.

-- updated_at trigger
DROP TRIGGER IF EXISTS churches_set_updated_at ON public.churches;
CREATE TRIGGER churches_set_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Defense-in-depth: block any client write to verification fields even if a future policy is added.
CREATE OR REPLACE FUNCTION public.protect_church_verification()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'community_submitted';
    NEW.approved_by_admin_id := NULL;
    NEW.last_verified_at := NULL;
    RETURN NEW;
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.approved_by_admin_id IS DISTINCT FROM OLD.approved_by_admin_id
     OR NEW.last_verified_at IS DISTINCT FROM OLD.last_verified_at THEN
    RAISE EXCEPTION 'Verification fields may only be set by the verification service.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS churches_protect_verification ON public.churches;
CREATE TRIGGER churches_protect_verification
  BEFORE INSERT OR UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.protect_church_verification();

-- =========================================================
-- CHURCH CORRECTIONS — user-submitted edits queue
-- =========================================================
CREATE TABLE IF NOT EXISTS public.church_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field_corrected text NOT NULL,
  old_value text,
  new_value text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.church_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own corrections insert" ON public.church_corrections;
CREATE POLICY "Own corrections insert" ON public.church_corrections
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Own corrections select" ON public.church_corrections;
CREATE POLICY "Own corrections select" ON public.church_corrections
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================
-- SUBSCRIPTIONS — Stripe state per user
-- =========================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  tier text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own subscription select" ON public.subscriptions;
CREATE POLICY "Own subscription select" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- No client write policies. Edge functions write with the service role.

DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- SEED — 50 well-known U.S. churches & ministries
-- All marked unverified seed data. EIN left null unless known.
-- =========================================================
INSERT INTO public.churches
  (legal_name, dba_name, city, state, denomination, website, giving_platform, giving_url,
   enrichment_status, source_type, verification_status)
VALUES
  ('Saddleback Valley Community Church','Saddleback Church','Lake Forest','CA','Non-denominational','https://saddleback.com','pushpay','https://saddleback.com/give','seeded','manual_seed','unverified'),
  ('North Point Community Church',NULL,'Alpharetta','GA','Non-denominational','https://northpoint.org','pushpay','https://northpoint.org/give','seeded','manual_seed','unverified'),
  ('Lakewood Church',NULL,'Houston','TX','Non-denominational','https://lakewoodchurch.com','pushpay','https://lakewoodchurch.com/give','seeded','manual_seed','unverified'),
  ('Elevation Church',NULL,'Charlotte','NC','Southern Baptist','https://elevationchurch.org','pushpay','https://elevationchurch.org/giving','seeded','manual_seed','unverified'),
  ('Passion City Church',NULL,'Atlanta','GA','Non-denominational','https://passioncitychurch.com','pushpay','https://passioncitychurch.com/give','seeded','manual_seed','unverified'),
  ('Watermark Community Church',NULL,'Dallas','TX','Non-denominational','https://watermark.org','pushpay','https://watermark.org/give','seeded','manual_seed','unverified'),
  ('Bethel Church',NULL,'Redding','CA','Charismatic','https://bethel.com','tithely','https://bethel.com/giving','seeded','manual_seed','unverified'),
  ('The Village Church',NULL,'Flower Mound','TX','Southern Baptist','https://thevillagechurch.net','pushpay','https://thevillagechurch.net/give','seeded','manual_seed','unverified'),
  ('Life.Church',NULL,'Edmond','OK','Evangelical Covenant','https://life.church','pushpay','https://life.church/give','seeded','manual_seed','unverified'),
  ('Church of the Highlands',NULL,'Birmingham','AL','Non-denominational','https://churchofthehighlands.com','pushpay','https://churchofthehighlands.com/giving','seeded','manual_seed','unverified'),
  ('Hillsong Church USA',NULL,'New York','NY','Pentecostal','https://hillsong.com','pushpay','https://hillsong.com/giving','seeded','manual_seed','unverified'),
  ('Mosaic',NULL,'Los Angeles','CA','Non-denominational','https://mosaic.org','tithely','https://mosaic.org/give','seeded','manual_seed','unverified'),
  ('Redeemer Presbyterian Church',NULL,'New York','NY','Presbyterian','https://redeemer.com','pushpay','https://redeemer.com/give','seeded','manual_seed','unverified'),
  ('Times Square Church',NULL,'New York','NY','Non-denominational','https://tsc.nyc','tithely','https://tsc.nyc/giving','seeded','manual_seed','unverified'),
  ('Bayside Church',NULL,'Granite Bay','CA','Non-denominational','https://baysideonline.com','pushpay','https://baysideonline.com/give','seeded','manual_seed','unverified'),
  ('Mariners Church',NULL,'Irvine','CA','Non-denominational','https://marinerschurch.org','pushpay','https://marinerschurch.org/give','seeded','manual_seed','unverified'),
  ('Calvary Chapel Costa Mesa',NULL,'Costa Mesa','CA','Calvary Chapel','https://calvarycm.com','tithely','https://calvarycm.com/giving','seeded','manual_seed','unverified'),
  ('Gateway Church',NULL,'Southlake','TX','Non-denominational','https://gatewaypeople.com','pushpay','https://gatewaypeople.com/give','seeded','manual_seed','unverified'),
  ('Prestonwood Baptist Church',NULL,'Plano','TX','Southern Baptist','https://prestonwood.org','pushpay','https://prestonwood.org/giving','seeded','manual_seed','unverified'),
  ('Second Baptist Church',NULL,'Houston','TX','Southern Baptist','https://second.org','pushpay','https://second.org/giving','seeded','manual_seed','unverified'),
  ('Cross Church',NULL,'Springdale','AR','Southern Baptist','https://crosschurch.com','pushpay','https://crosschurch.com/give','seeded','manual_seed','unverified'),
  ('Grace Community Church',NULL,'Sun Valley','CA','Non-denominational','https://gracechurch.org','tithely','https://gracechurch.org/give','seeded','manual_seed','unverified'),
  ('Christ Fellowship',NULL,'Palm Beach Gardens','FL','Non-denominational','https://gochristfellowship.com','pushpay','https://gochristfellowship.com/give','seeded','manual_seed','unverified'),
  ('NewSpring Church',NULL,'Anderson','SC','Southern Baptist','https://newspring.cc','pushpay','https://newspring.cc/give','seeded','manual_seed','unverified'),
  ('Eagle Brook Church',NULL,'Centerville','MN','Baptist General','https://eaglebrookchurch.com','pushpay','https://eaglebrookchurch.com/giving','seeded','manual_seed','unverified'),
  ('Willow Creek Community Church',NULL,'South Barrington','IL','Non-denominational','https://willowcreek.org','pushpay','https://willowcreek.org/giving','seeded','manual_seed','unverified'),
  ('Harvest Christian Fellowship',NULL,'Riverside','CA','Non-denominational','https://harvest.org','tithely','https://harvest.org/donate','seeded','manual_seed','unverified'),
  ('Menlo Church',NULL,'Menlo Park','CA','Presbyterian','https://menlo.church','pushpay','https://menlo.church/give','seeded','manual_seed','unverified'),
  ('Reality LA',NULL,'Los Angeles','CA','Acts 29','https://realityla.com','tithely','https://realityla.com/give','seeded','manual_seed','unverified'),
  ('Vintage Church',NULL,'Raleigh','NC','Acts 29','https://vintagechurch.org','planning_center','https://vintagechurch.org/give','seeded','manual_seed','unverified'),
  ('Summit Church',NULL,'Durham','NC','Southern Baptist','https://summitchurch.com','pushpay','https://summitchurch.com/give','seeded','manual_seed','unverified'),
  ('Apostles Church',NULL,'New York','NY','Anglican','https://apostles.nyc','planning_center','https://apostles.nyc/give','seeded','manual_seed','unverified'),
  ('Trinity Church Wall Street',NULL,'New York','NY','Episcopal','https://trinitywallstreet.org','tithely','https://trinitywallstreet.org/give','seeded','manual_seed','unverified'),
  ('Reality SF',NULL,'San Francisco','CA','Acts 29','https://realitysf.com','tithely','https://realitysf.com/give','seeded','manual_seed','unverified'),
  ('Epic Church',NULL,'San Francisco','CA','Non-denominational','https://epicsf.com','planning_center','https://epicsf.com/giving','seeded','manual_seed','unverified'),
  ('City Church',NULL,'Tallahassee','FL','Non-denominational','https://citychurchtally.com','planning_center','https://citychurchtally.com/give','seeded','manual_seed','unverified'),
  ('Hope Church',NULL,'Memphis','TN','Presbyterian','https://hopechurchmemphis.com','pushpay','https://hopechurchmemphis.com/give','seeded','manual_seed','unverified'),
  ('Cherry Hills Community Church',NULL,'Highlands Ranch','CO','Presbyterian','https://chcc.org','pushpay','https://chcc.org/give','seeded','manual_seed','unverified'),
  ('Compassion International',NULL,'Colorado Springs','CO',NULL,'https://compassion.com','stripe_direct','https://compassion.com/donate','seeded','manual_seed','unverified'),
  ('World Vision','World Vision USA','Federal Way','WA',NULL,'https://worldvision.org','stripe_direct','https://donate.worldvision.org','seeded','manual_seed','unverified'),
  ('Samaritan''s Purse',NULL,'Boone','NC',NULL,'https://samaritanspurse.org','stripe_direct','https://samaritanspurse.org/donate','seeded','manual_seed','unverified'),
  ('International Justice Mission','IJM','Washington','DC',NULL,'https://ijm.org','stripe_direct','https://ijm.org/donate','seeded','manual_seed','unverified'),
  ('Cru','Campus Crusade for Christ','Orlando','FL',NULL,'https://cru.org','stripe_direct','https://give.cru.org','seeded','manual_seed','unverified'),
  ('Wycliffe Bible Translators',NULL,'Orlando','FL',NULL,'https://wycliffe.org','stripe_direct','https://wycliffe.org/donate','seeded','manual_seed','unverified'),
  ('Voice of the Martyrs',NULL,'Bartlesville','OK',NULL,'https://persecution.com','stripe_direct','https://persecution.com/donate','seeded','manual_seed','unverified'),
  ('Young Life',NULL,'Colorado Springs','CO',NULL,'https://younglife.org','stripe_direct','https://younglife.org/donate','seeded','manual_seed','unverified'),
  ('The Navigators',NULL,'Colorado Springs','CO',NULL,'https://navigators.org','stripe_direct','https://navigators.org/donate','seeded','manual_seed','unverified'),
  ('Focus on the Family',NULL,'Colorado Springs','CO',NULL,'https://focusonthefamily.com','stripe_direct','https://donate.focusonthefamily.com','seeded','manual_seed','unverified'),
  ('Prison Fellowship',NULL,'Lansdowne','VA',NULL,'https://prisonfellowship.org','stripe_direct','https://prisonfellowship.org/donate','seeded','manual_seed','unverified'),
  ('Gideons International',NULL,'Nashville','TN',NULL,'https://gideons.org','stripe_direct','https://gideons.org/donate','seeded','manual_seed','unverified')
ON CONFLICT DO NOTHING;