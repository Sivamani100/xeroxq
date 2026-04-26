-- Migration: Add Page Count to Jobs
-- Purpose: Support accurate revenue calculation based on document length.

BEGIN;

-- Add page_count column to jobs table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='page_count') THEN
    ALTER TABLE public.jobs ADD COLUMN page_count INTEGER DEFAULT 1;
  END IF;
END $$;

COMMIT;
