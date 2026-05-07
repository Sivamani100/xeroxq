-- Migration: Add Shop Location Field
-- Purpose: Allow shopkeepers to provide their shop location for better discoverability

BEGIN;

-- Add shop_location column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='shop_location') THEN
    ALTER TABLE public.shops ADD COLUMN shop_location TEXT;
  END IF;
END $$;

-- Add shop_lat column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='shop_lat') THEN
    ALTER TABLE public.shops ADD COLUMN shop_lat NUMERIC(10, 8);
  END IF;
END $$;

-- Add shop_lng column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='shop_lng') THEN
    ALTER TABLE public.shops ADD COLUMN shop_lng NUMERIC(11, 8);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.shops.shop_location IS 'Physical address/location of the shop provided by the shopkeeper';
COMMENT ON COLUMN public.shops.shop_lat IS 'Latitude coordinate of the shop location';
COMMENT ON COLUMN public.shops.shop_lng IS 'Longitude coordinate of the shop location';

COMMIT;
