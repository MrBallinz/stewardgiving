ALTER TABLE public.giving_recipients
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_name text,
  ADD COLUMN IF NOT EXISTS verified_logo_url text,
  ADD COLUMN IF NOT EXISTS verified_ein text,
  ADD COLUMN IF NOT EXISTS verification_notes text;