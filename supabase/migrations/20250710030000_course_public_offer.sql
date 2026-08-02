-- Public user-facing marketing offers (separate from internal commission fields)

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS public_offer_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS public_offer_label text,
ADD COLUMN IF NOT EXISTS public_offer_description text,
ADD COLUMN IF NOT EXISTS public_offer_code text,
ADD COLUMN IF NOT EXISTS public_offer_terms text,
ADD COLUMN IF NOT EXISTS public_offer_expires_at date;

NOTIFY pgrst, 'reload schema';
