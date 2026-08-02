-- Extend local work opportunities for admin-created listings
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS internal_note text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS contact_public boolean NOT NULL DEFAULT false;

-- Allow draft status for admin-saved unpublished listings
ALTER TABLE public.opportunities
  DROP CONSTRAINT IF EXISTS opportunities_status_check;

ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_status_check
  CHECK (status IN ('pending_review', 'draft', 'published', 'rejected', 'filled', 'deleted'));
