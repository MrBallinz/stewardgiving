ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS enrichment_attempted_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_last_error text,
  ADD COLUMN IF NOT EXISTS giving_url_source text;

ALTER TABLE public.churches DROP CONSTRAINT IF EXISTS churches_giving_platform_check;
ALTER TABLE public.churches ADD CONSTRAINT churches_giving_platform_check
  CHECK (giving_platform IS NULL OR giving_platform = ANY (ARRAY[
    'tithely','pushpay','givelify','anedot','subsplash','vanco','churchtrac',
    'overflow','planning_center','easytithe','stripe_direct','every_org',
    'donorbox','generis','breeze','unknown'
  ]));

CREATE INDEX IF NOT EXISTS churches_enrichment_status_idx ON public.churches (enrichment_status);
CREATE INDEX IF NOT EXISTS churches_giving_url_null_idx ON public.churches (id) WHERE giving_url IS NULL;