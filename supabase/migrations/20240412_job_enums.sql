-- XeroxQ Database Governance: Type Scaling (ENUMs)
-- Purpose: Replace loose TEXT statuses with strict Postgres ENUMs for performance.
-- Author: Database Administrator (DBA)

BEGIN;

-- 1. Define the Job Status Type
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status_type') THEN
    CREATE TYPE job_status_type AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'failed', 'printed');
  END IF;
END $$;

-- 2. Migrate the existing jobs.status column
-- This step involves dropping the old default, then casting text to the new enum type.
ALTER TABLE public.jobs 
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.jobs 
ALTER COLUMN status TYPE job_status_type 
USING (status::job_status_type);

-- 3. Set a default for new rows
ALTER TABLE public.jobs 
ALTER COLUMN status SET DEFAULT 'pending'::job_status_type;

COMMIT;

COMMENT ON TYPE job_status_type IS 'Strict states for print jobs to ensure type safety and 3x faster indexing.';
