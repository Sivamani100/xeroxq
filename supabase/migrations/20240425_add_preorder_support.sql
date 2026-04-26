-- Migration: Support Pre-orders and Home/Work Service
-- Purpose: Enable shopkeepers to accept remote orders with upfront payment.

BEGIN;

-- Update shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS accept_preorders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Update jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

COMMIT;
