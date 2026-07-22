
ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS org_type text NOT NULL DEFAULT 'church';

ALTER TABLE public.churches
  DROP CONSTRAINT IF EXISTS churches_org_type_check;

ALTER TABLE public.churches
  ADD CONSTRAINT churches_org_type_check
  CHECK (org_type IN ('church','mission','nonprofit'));

CREATE INDEX IF NOT EXISTS churches_org_type_idx ON public.churches(org_type);
