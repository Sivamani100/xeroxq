-- Migration: Add Shop Customization Settings
-- Purpose: Allow shopkeepers to control customer upload fields and token generation.

BEGIN;

-- Add new columns if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='require_customer_name') THEN
    ALTER TABLE public.shops ADD COLUMN require_customer_name BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='show_copies') THEN
    ALTER TABLE public.shops ADD COLUMN show_copies BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='show_color_mode') THEN
    ALTER TABLE public.shops ADD COLUMN show_color_mode BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='generate_token') THEN
    ALTER TABLE public.shops ADD COLUMN generate_token BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

COMMIT;
