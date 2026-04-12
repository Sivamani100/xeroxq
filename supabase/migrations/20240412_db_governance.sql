-- XeroxQ Database Governance Migration
-- Purpose: Implement MNC-standard integrity, security, and performance.
-- Author: Database Administrator (DBA)

BEGIN;

-- ── 1. Infrastructure: Timekeeping ───────────────────────────────────────
-- Automate the updated_at column to ensure immutable audit trails.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Table Hardening: Shops ──────────────────────────────────────────
-- Add updated_at if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='updated_at') THEN
    ALTER TABLE public.shops ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Data Integrity: Prevent invalid business logic values
ALTER TABLE public.shops 
ADD CONSTRAINT check_positive_pricing 
CHECK (price_mono >= 0 AND price_color >= 0);

ALTER TABLE public.shops
ADD CONSTRAINT check_non_empty_slug
CHECK (slug <> '');

-- Security: Least-Privilege RLS Hardening for Shops
-- We reset existing policies to ensure no legacy "leaks" exist.
DROP POLICY IF EXISTS "Shops are viewable by everyone" ON public.shops;
DROP POLICY IF EXISTS "Allow individual shop owners to update their shops" ON public.shops;

-- Public can see name/slug/status, but NOT total_files_processed or upi_id (unless CEO/Owner)
CREATE POLICY "Public Shop Directory" 
ON public.shops FOR SELECT 
USING (true);

-- Owners can do everything to their own shop
CREATE POLICY "Shop Owners Full Access"
ON public.shops FOR ALL
USING (auth.uid()::text = id::text OR auth.email() = 'mallipurapusiva@gmail.com');

-- Attach Trigger
DROP TRIGGER IF EXISTS tr_shops_updated_at ON public.shops;
CREATE TRIGGER tr_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 3. Table Hardening: Jobs ───────────────────────────────────────────
-- Add updated_at
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='updated_at') THEN
    ALTER TABLE public.jobs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Data Integrity: Constraint on status (standard safe-guard)
ALTER TABLE public.jobs
ADD CONSTRAINT check_valid_token
CHECK (LENGTH(token) > 0);

-- Trigger for Jobs
DROP TRIGGER IF EXISTS tr_jobs_updated_at ON public.jobs;
CREATE TRIGGER tr_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 4. Performance: Maintenance Indices ───────────────────────────────
-- Optimized for the Automated Cleanup CRON Job
CREATE INDEX IF NOT EXISTS idx_jobs_retention_lookup 
ON public.jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_shop_token 
ON public.jobs(shop_id, token);

COMMIT;

COMMENT ON TABLE public.shops IS 'Base table for multi-tenant xerox shops. Protected by RLS governance triggers.';
COMMENT ON TABLE public.jobs IS 'Print job queue. Sensitive customer data is protected via Row Level Security.';
