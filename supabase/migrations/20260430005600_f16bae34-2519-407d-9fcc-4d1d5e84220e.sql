-- 1. Foreign key for giving_recipients.church_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'giving_recipients_church_id_fkey'
  ) THEN
    ALTER TABLE public.giving_recipients
      ADD CONSTRAINT giving_recipients_church_id_fkey
      FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Partial unique index on churches (legal_name + city + state) when EIN is null
CREATE UNIQUE INDEX IF NOT EXISTS churches_name_city_state_no_ein_uidx
  ON public.churches (lower(legal_name), lower(city), upper(state))
  WHERE ein IS NULL;

-- 3. Fix Life.Church denomination
UPDATE public.churches
  SET denomination = 'Non-denominational'
  WHERE (lower(legal_name) LIKE '%life.church%' OR lower(dba_name) LIKE '%life.church%' OR lower(legal_name) = 'life church');
