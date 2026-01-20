-- Add purpose, tone, recipient_type columns to email_projects table
-- These fields are required for email project creation

-- Check if columns exist before adding
DO $$ 
BEGIN
  -- Add purpose column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_projects' 
    AND column_name = 'purpose'
  ) THEN
    ALTER TABLE public.email_projects
      ADD COLUMN purpose text NOT NULL DEFAULT 'job_application';
    -- Remove default after adding for existing rows
    ALTER TABLE public.email_projects
      ALTER COLUMN purpose DROP DEFAULT;
  ELSE
    -- If column exists, ensure it's NOT NULL
    ALTER TABLE public.email_projects
      ALTER COLUMN purpose SET NOT NULL;
  END IF;

  -- Add tone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_projects' 
    AND column_name = 'tone'
  ) THEN
    ALTER TABLE public.email_projects
      ADD COLUMN tone text NOT NULL DEFAULT 'Professional';
    -- Remove default after adding for existing rows
    ALTER TABLE public.email_projects
      ALTER COLUMN tone DROP DEFAULT;
  ELSE
    -- If column exists, ensure it's NOT NULL
    ALTER TABLE public.email_projects
      ALTER COLUMN tone SET NOT NULL;
  END IF;

  -- Add recipient_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_projects' 
    AND column_name = 'recipient_type'
  ) THEN
    ALTER TABLE public.email_projects
      ADD COLUMN recipient_type text NOT NULL DEFAULT 'Manager';
    -- Remove default after adding for existing rows
    ALTER TABLE public.email_projects
      ALTER COLUMN recipient_type DROP DEFAULT;
  ELSE
    -- If column exists, ensure it's NOT NULL
    ALTER TABLE public.email_projects
      ALTER COLUMN recipient_type SET NOT NULL;
  END IF;
END $$;

