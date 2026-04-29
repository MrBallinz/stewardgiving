ALTER TABLE public.giving_recipients
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS platform_slug text,
  ADD COLUMN IF NOT EXISTS donate_url text,
  ADD COLUMN IF NOT EXISTS website text;