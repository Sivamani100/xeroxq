-- XeroxQ Analytical Snapshot Migration
-- Purpose: Persistent long-term business intelligence.
-- Author: Data Scientist

BEGIN;

-- ── 1. The Snapshot Table ────────────────────────────────────────────────
-- This table stores aggregated shop performance. 
-- It allows us to delete raw job records safely while keeping business history.
CREATE TABLE IF NOT EXISTS public.shop_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_jobs INTEGER DEFAULT 0,
  success_jobs INTEGER DEFAULT 0,
  revenue_est DECIMAL(12, 2) DEFAULT 0.00,
  platform_fees_est DECIMAL(12, 2) DEFAULT 0.00,
  peak_hour INTEGER CHECK (peak_hour >= 0 AND peak_hour <= 23),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one snapshot per shop per day
  UNIQUE(shop_id, date)
);

-- Indexing for forecasting and time-series analysis
CREATE INDEX IF NOT EXISTS idx_metrics_date ON public.shop_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_metrics_shop_date ON public.shop_daily_metrics(shop_id, date);

-- ── 2. Snapshot Aggregation Function ─────────────────────────────────────
-- This function captures the last 24 hours of data.
CREATE OR REPLACE FUNCTION public.capture_shop_snapshots(target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.shop_daily_metrics (
    shop_id, 
    date, 
    total_jobs, 
    success_jobs, 
    revenue_est, 
    platform_fees_est,
    peak_hour
  )
  SELECT 
    shop_id,
    target_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('completed', 'printed')),
    -- Hardcoded estimate logic (Data Science baseline)
    -- Average of 5 INR per job if specific price data isn't in job record
    COUNT(*) * 5.00,
    -- Platform commission: 0.50 per job
    COUNT(*) * 0.50,
    -- Identify the peak hour for this shop
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM created_at))
  FROM public.jobs
  WHERE created_at::DATE = target_date
  GROUP BY shop_id
  ON CONFLICT (shop_id, date) DO UPDATE SET
    total_jobs = EXCLUDED.total_jobs,
    success_jobs = EXCLUDED.success_jobs,
    revenue_est = EXCLUDED.revenue_est,
    platform_fees_est = EXCLUDED.platform_fees_est,
    peak_hour = EXCLUDED.peak_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

COMMENT ON TABLE public.shop_daily_metrics IS 'Data Warehouse snapshot table for long-term business intelligence and growth tracking.';
