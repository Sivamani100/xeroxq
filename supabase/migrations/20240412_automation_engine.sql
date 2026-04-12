-- XeroxQ Autonomous Infrastructure Migration
-- Purpose: Financial Enforcement & Self-Healing Audit Logs
-- Author: Automation Engineer

BEGIN;

-- ── 1. Shop Financial Hardening ──────────────────────────────────────────
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS platform_balance DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ── 2. Job Retry Logic ──────────────────────────────────────────────────
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- ── 3. Automation Audit Logs ──────────────────────────────────────────────
-- In an MNC, every "autonomous" action must be logged for transparency.
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- e.g., 'BILLING_DEDUCTION', 'AUTO_RETRY', 'DEACTIVATION'
  shop_id UUID REFERENCES public.shops(id),
  job_id UUID REFERENCES public.jobs(id),
  details JSONB,
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin auditing
CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON public.automation_logs(created_at);

-- ── 4. Self-Healing Triggers ─────────────────────────────────────────────
-- Automatically deactivate shop if balance falls too low (Deactivation Guardrail)
CREATE OR REPLACE FUNCTION public.tr_enforce_shop_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.platform_balance < -500.00 AND OLD.platform_balance >= -500.00 THEN
    NEW.is_active = FALSE;
    
    INSERT INTO public.automation_logs (event_type, shop_id, details, severity)
    VALUES ('DEACTIVATION', NEW.id, jsonb_build_object('reason', 'Negative balance threshold -500 exceeded', 'balance', NEW.platform_balance), 'warning');
  END IF;
  
  -- Auto-reactivate if they pay back
  IF NEW.platform_balance >= 0.00 AND OLD.platform_balance < 0.00 THEN
    NEW.is_active = TRUE;
    
    INSERT INTO public.automation_logs (event_type, shop_id, details, severity)
    VALUES ('REACTIVATION', NEW.id, jsonb_build_object('reason', 'Balance restored', 'balance', NEW.platform_balance), 'info');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_shop_financial_guardrail ON public.shops;
CREATE TRIGGER tr_shop_financial_guardrail
  BEFORE UPDATE OF platform_balance ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.tr_enforce_shop_deactivation();

COMMIT;

COMMENT ON TABLE public.automation_logs IS 'Audit trail for all self-healing and autonomous system actions.';
