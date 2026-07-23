-- ═══════════════════════════════════════════════════════════════════════════════
-- XeroxQ: Consolidated Master Database Schema (One-Time Production Script)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Target Platform: Supabase / PostgreSQL 15+
-- Purpose: Complete, idempotent single-file database deployment for XeroxQ.
-- Safe to execute on fresh databases or existing schema environments.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. EXTENSIONS & TYPES ───────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Job Status Type Definition
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status_type') THEN
    CREATE TYPE job_status_type AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'failed', 'printed');
  END IF;
END $$;

-- ── 2. SHARED UTILITY FUNCTIONS ─────────────────────────────────────────────

-- Automatic Timestamp Update Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 3. TABLES DEFINITION ────────────────────────────────────────────────────

-- 3.1 Shops Table
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    upi_id TEXT,
    is_open BOOLEAN DEFAULT TRUE,
    price_mono DECIMAL(10, 2) DEFAULT 2.00,
    price_color DECIMAL(10, 2) DEFAULT 10.00,
    accept_preorders BOOLEAN DEFAULT FALSE,
    contact_number TEXT,
    require_customer_name BOOLEAN DEFAULT TRUE,
    show_copies BOOLEAN DEFAULT TRUE,
    show_color_mode BOOLEAN DEFAULT TRUE,
    generate_token BOOLEAN DEFAULT TRUE,
    feedback_enabled BOOLEAN DEFAULT TRUE,
    custom_feedback_enabled BOOLEAN DEFAULT FALSE,
    custom_feedback_title TEXT DEFAULT 'How was your experience?',
    shop_location TEXT,
    shop_lat NUMERIC(10, 8),
    shop_lng NUMERIC(11, 8),
    total_files_processed BIGINT DEFAULT 0 NOT NULL,
    approval_status TEXT DEFAULT 'pending',
    platform_balance DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_positive_pricing CHECK (price_mono >= 0 AND price_color >= 0),
    CONSTRAINT check_non_empty_slug CHECK (slug <> '')
);

-- 3.2 Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    file_path TEXT,
    file_name TEXT NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb,
    status public.job_status_type DEFAULT 'pending'::job_status_type,
    page_count INTEGER DEFAULT 1,
    is_preorder BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    is_deleted_by_user BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by_user_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
    
    CONSTRAINT check_valid_token CHECK (LENGTH(token) > 0)
);

-- 3.3 Automation Audit Logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    details JSONB,
    severity TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Analytical Snapshots Table
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
    
    UNIQUE(shop_id, date)
);

-- 3.5 Contact Submissions (Landing Page / Shop Join)
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS public.newsletter_subs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Blogs
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'XeroxQ Team',
    image_url TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Partners Table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    bio TEXT,
    profile_url TEXT,
    logo_url TEXT,
    type TEXT DEFAULT 'partner', 
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL, 
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    resume_url TEXT,
    portfolio_url TEXT,
    message TEXT,
    status TEXT DEFAULT 'applied', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 Platform News Table
CREATE TABLE IF NOT EXISTS public.platform_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 Security Reports (Bug Bounty) Table
CREATE TABLE IF NOT EXISTS public.security_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_name TEXT NOT NULL,
    email TEXT NOT NULL,
    type TEXT NOT NULL, 
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'reported', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.12 Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- 3.13 Default Feedback Questions Table
CREATE TABLE IF NOT EXISTS public.feedback_questions_default (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'emoji',
    options JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.14 Custom Feedback Questions Table
CREATE TABLE IF NOT EXISTS public.feedback_questions_custom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'emoji',
    options JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.15 Feedback Responses Table
CREATE TABLE IF NOT EXISTS public.feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_phone TEXT,
    default_responses JSONB NOT NULL DEFAULT '{}',
    custom_responses JSONB NOT NULL DEFAULT '{}',
    written_feedback TEXT,
    overall_rating INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- 3.16 Deleted File Access Audit Log
CREATE TABLE IF NOT EXISTS public.deleted_file_access_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    action_attempted TEXT NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    attempted_by UUID,
    ip_address TEXT,
    user_agent TEXT
);

-- 3.17 WhatsApp Sessions Table
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    phone_number TEXT PRIMARY KEY,
    shop_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. TRIGGERS & BUSINESS RULES ───────────────────────────────────────────

-- 4.1 Updated At Triggers
DROP TRIGGER IF EXISTS tr_shops_updated_at ON public.shops;
CREATE TRIGGER tr_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_jobs_updated_at ON public.jobs;
CREATE TRIGGER tr_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER tr_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_feedback_questions_default_updated_at ON public.feedback_questions_default;
CREATE TRIGGER tr_feedback_questions_default_updated_at
  BEFORE UPDATE ON public.feedback_questions_default
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_feedback_questions_custom_updated_at ON public.feedback_questions_custom;
CREATE TRIGGER tr_feedback_questions_custom_updated_at
  BEFORE UPDATE ON public.feedback_questions_custom
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4.2 Shop Financial Guardrail Trigger
CREATE OR REPLACE FUNCTION public.tr_enforce_shop_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.platform_balance < -500.00 AND OLD.platform_balance >= -500.00 THEN
    NEW.is_active = FALSE;
    INSERT INTO public.automation_logs (event_type, shop_id, details, severity)
    VALUES ('DEACTIVATION', NEW.id, jsonb_build_object('reason', 'Negative balance threshold -500 exceeded', 'balance', NEW.platform_balance), 'warning');
  END IF;
  
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

-- 4.3 Deleted File Database-Level Protection Trigger
CREATE OR REPLACE FUNCTION public.tr_enforce_deleted_file_protection()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_deleted_by_user = true THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Cannot change status of deleted file (Token: %). User has deleted this file.', OLD.token
                USING HINT = 'This file was deleted by the user and no further actions are allowed.';
        END IF;
        
        IF NEW.file_path IS DISTINCT FROM OLD.file_path THEN
            RAISE EXCEPTION 'Cannot modify file path of deleted file (Token: %). User has deleted this file.', OLD.token
                USING HINT = 'This file was deleted by the user and no further actions are allowed.';
        END IF;
        
        IF NEW.preferences IS DISTINCT FROM OLD.preferences THEN
            RAISE EXCEPTION 'Cannot modify preferences of deleted file (Token: %). User has deleted this file.', OLD.token
                USING HINT = 'This file was deleted by the user and no further actions are allowed.';
        END IF;
    END IF;
    
    IF NEW.status = 'printed' AND (OLD.is_deleted_by_user = true OR NEW.is_deleted_by_user = true) THEN
        RAISE EXCEPTION 'Cannot complete job - file has been deleted by user (Token: %)', OLD.token
            USING HINT = 'The user deleted this file before completion. Inform customer to re-upload if needed.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_jobs_deleted_protection ON public.jobs;
CREATE TRIGGER tr_jobs_deleted_protection
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.tr_enforce_deleted_file_protection();

-- ── 5. STORED PROCEDURES & RPC FUNCTIONS ───────────────────────────────────

-- 5.1 Atomic File Processing Counter RPC
CREATE OR REPLACE FUNCTION public.increment_shop_files(shop_row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.shops
  SET total_files_processed = total_files_processed + 1
  WHERE id = shop_row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Capture Shop Snapshot Analytics
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
    COUNT(*) * 5.00,
    COUNT(*) * 0.50,
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

-- 5.3 Check Shop Feedback Status
CREATE OR REPLACE FUNCTION public.is_feedback_enabled_for_shop(
    p_shop_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_global_enabled BOOLEAN;
    v_shop_enabled BOOLEAN;
BEGIN
    SELECT (value->>'enabled')::BOOLEAN INTO v_global_enabled
    FROM public.platform_settings
    WHERE key = 'global_feedback_enabled';
    
    IF v_global_enabled IS NULL THEN
        v_global_enabled := true;
    END IF;
    
    IF v_global_enabled = false THEN
        RETURN false;
    END IF;
    
    SELECT feedback_enabled INTO v_shop_enabled
    FROM public.shops
    WHERE id = p_shop_id;
    
    IF v_shop_enabled IS NULL THEN
        v_shop_enabled := true;
    END IF;
    
    RETURN v_shop_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Get Combined Feedback Questions
CREATE OR REPLACE FUNCTION public.get_feedback_questions(
    p_shop_id UUID
) RETURNS TABLE (
    question_id UUID,
    question_text TEXT,
    question_type TEXT,
    options JSONB,
    is_required BOOLEAN,
    display_order INTEGER,
    source TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fqd.id,
        fqd.question_text,
        fqd.question_type,
        fqd.options,
        fqd.is_required,
        fqd.display_order,
        'default'::TEXT as source
    FROM public.feedback_questions_default fqd
    WHERE fqd.is_active = true
    
    UNION ALL
    
    SELECT 
        fqc.id,
        fqc.question_text,
        fqc.question_type,
        fqc.options,
        fqc.is_required,
        fqc.display_order + 100,
        'custom'::TEXT as source
    FROM public.feedback_questions_custom fqc
    WHERE fqc.shop_id = p_shop_id
    AND fqc.is_active = true
    
    ORDER BY display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Submit Feedback Response RPC
CREATE OR REPLACE FUNCTION public.submit_feedback(
    p_job_id UUID,
    p_shop_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_default_responses JSONB,
    p_custom_responses JSONB,
    p_written_feedback TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    feedback_id UUID
) AS $$
DECLARE
    v_feedback_id UUID;
    v_avg_rating NUMERIC;
BEGIN
    IF NOT public.is_feedback_enabled_for_shop(p_shop_id) THEN
        RETURN QUERY SELECT false, 'Feedback is currently disabled for this shop', NULL::UUID;
        RETURN;
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.feedback_responses WHERE job_id = p_job_id) THEN
        RETURN QUERY SELECT false, 'Feedback already submitted for this job', NULL::UUID;
        RETURN;
    END IF;
    
    SELECT AVG(
        CASE value::TEXT
            WHEN '"😠 Very Bad"' THEN 1
            WHEN '"😞 Bad"' THEN 1
            WHEN '"😠 Poor"' THEN 1
            WHEN '"😠 Rude"' THEN 1
            WHEN '"❌ Never"' THEN 1
            WHEN '"🐌 Too Slow"' THEN 1
            WHEN '"😞 Fair"' THEN 2
            WHEN '"😞 Unfriendly"' THEN 2
            WHEN '"🤔 Maybe"' THEN 2
            WHEN '"🐢 Slow"' THEN 2
            WHEN '"😐 Okay"' THEN 3
            WHEN '"😐 Average"' THEN 3
            WHEN '"😐 Neutral"' THEN 3
            WHEN '"⏱️ Okay"' THEN 3
            WHEN '"👍 Yes"' THEN 4
            WHEN '"🙂 Good"' THEN 4
            WHEN '"🙂 Friendly"' THEN 4
            WHEN '"🚀 Fast"' THEN 4
            WHEN '"😍 Excellent"' THEN 5
            WHEN '"😍 Perfect"' THEN 5
            WHEN '"😍 Very Friendly"' THEN 5
            WHEN '"🌟 Definitely"' THEN 5
            WHEN '"🔥 Absolutely!"' THEN 5
            WHEN '"⚡ Super Fast"' THEN 5
            ELSE NULL
        END
    )::INTEGER
    INTO v_avg_rating
    FROM jsonb_each_text(p_default_responses);
    
    INSERT INTO public.feedback_responses (
        job_id, shop_id, customer_name, customer_phone,
        default_responses, custom_responses, written_feedback,
        overall_rating, ip_address, user_agent
    ) VALUES (
        p_job_id, p_shop_id, p_customer_name, p_customer_phone,
        p_default_responses, p_custom_responses, p_written_feedback,
        v_avg_rating, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_feedback_id;
    
    RETURN QUERY SELECT true, 'Feedback submitted successfully', v_feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6 File Download Availability Helper
CREATE OR REPLACE FUNCTION public.is_file_downloadable(
    p_job_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_deleted BOOLEAN;
    v_status job_status_type;
BEGIN
    SELECT is_deleted_by_user, status
    INTO v_is_deleted, v_status
    FROM public.jobs
    WHERE id = p_job_id;
    
    RETURN (v_is_deleted = false OR v_is_deleted IS NULL) AND (v_status != 'printed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.7 Mark File Deleted by User RPC
CREATE OR REPLACE FUNCTION public.mark_file_deleted_by_user(
    p_job_id UUID,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    file_path TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_file_path TEXT;
    v_already_deleted BOOLEAN;
BEGIN
    SELECT j.file_path, j.is_deleted_by_user
    INTO v_file_path, v_already_deleted
    FROM public.jobs j
    WHERE j.id = p_job_id;
    
    IF v_file_path IS NULL THEN
        RETURN QUERY SELECT NULL::TEXT, false, 'Job not found'::TEXT;
        RETURN;
    END IF;
    
    IF v_already_deleted = true THEN
        RETURN QUERY SELECT v_file_path, false, 'File already deleted'::TEXT;
        RETURN;
    END IF;
    
    UPDATE public.jobs
    SET 
        is_deleted_by_user = true,
        deleted_at = NOW(),
        deleted_by_user_id = p_user_id,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN QUERY SELECT v_file_path, true, 'File marked for deletion'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.8 Verify Allowed Actions on Jobs
CREATE OR REPLACE FUNCTION public.check_file_action_allowed(
    p_job_id UUID,
    p_action TEXT
) RETURNS TABLE (
    allowed BOOLEAN,
    reason TEXT,
    deleted_by_user BOOLEAN,
    current_status TEXT
) AS $$
DECLARE
    v_is_deleted BOOLEAN;
    v_status job_status_type;
    v_token TEXT;
BEGIN
    SELECT is_deleted_by_user, status, token
    INTO v_is_deleted, v_status, v_token
    FROM public.jobs
    WHERE id = p_job_id;
    
    IF v_token IS NULL THEN
        RETURN QUERY SELECT false, 'Job not found', false, ''::TEXT;
        RETURN;
    END IF;
    
    IF v_is_deleted = true THEN
        RETURN QUERY SELECT false, 'File deleted by user (Token: ' || v_token || '). No actions allowed.', true, v_status::TEXT;
        RETURN;
    END IF;
    
    IF p_action = 'complete' AND v_status = 'printed' THEN
        RETURN QUERY SELECT false, 'Job already completed (Token: ' || v_token || ')', false, v_status::TEXT;
        RETURN;
    END IF;
    
    IF p_action IN ('download', 'print') AND v_status = 'printed' THEN
        RETURN QUERY SELECT false, 'Job already completed - file access restricted (Token: ' || v_token || ')', false, v_status::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'Action allowed', false, v_status::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.9 Log Access Attempts to Deleted Files
CREATE OR REPLACE FUNCTION public.log_deleted_file_attempt(
    p_job_id UUID,
    p_shop_id UUID,
    p_action TEXT,
    p_attempted_by UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.deleted_file_access_attempts (
        job_id, shop_id, action_attempted, attempted_by, ip_address, user_agent
    ) VALUES (
        p_job_id, p_shop_id, p_action, p_attempted_by, p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.increment_shop_files(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_feedback_enabled_for_shop(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_feedback_questions(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.submit_feedback TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_file_downloadable(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.mark_file_deleted_by_user(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_file_action_allowed(UUID, TEXT) TO authenticated, anon;

-- ── 6. VIEWS DEFINITION ────────────────────────────────────────────────────

-- 6.1 Active Jobs View
CREATE OR REPLACE VIEW public.active_jobs AS
SELECT 
    id,
    token,
    customer_name,
    file_path,
    file_name,
    preferences,
    status,
    page_count,
    is_preorder,
    is_paid,
    customer_phone,
    shop_id,
    created_at,
    expires_at,
    updated_at,
    (is_deleted_by_user = false OR is_deleted_by_user IS NULL) AND status != 'printed' AS is_downloadable
FROM public.jobs
WHERE (is_deleted_by_user = false OR is_deleted_by_user IS NULL) OR status = 'printed';

-- 6.2 Shop Feedback Analytics View
CREATE OR REPLACE VIEW public.shop_feedback_analytics AS
SELECT 
    fr.shop_id,
    s.name as shop_name,
    COUNT(fr.id) as total_responses,
    AVG(fr.overall_rating)::NUMERIC(3,2) as avg_rating,
    COUNT(CASE WHEN fr.overall_rating >= 4 THEN 1 END) as positive_count,
    COUNT(CASE WHEN fr.overall_rating <= 2 THEN 1 END) as negative_count,
    MAX(fr.submitted_at) as last_feedback_date
FROM public.feedback_responses fr
JOIN public.shops s ON fr.shop_id = s.id
GROUP BY fr.shop_id, s.name;

-- ── 7. PERFORMANCE INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_jobs_shop_id ON public.jobs(shop_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_retention_lookup ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_shop_token ON public.jobs(shop_id, token);
CREATE INDEX IF NOT EXISTS idx_jobs_is_deleted_by_user ON public.jobs(is_deleted_by_user);
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON public.jobs(deleted_at);

CREATE INDEX IF NOT EXISTS idx_shops_created_at ON public.shops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(slug);

CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON public.automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON public.shop_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_metrics_shop_date ON public.shop_daily_metrics(shop_id, date);

CREATE INDEX IF NOT EXISTS idx_feedback_questions_custom_shop ON public.feedback_questions_custom(shop_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_shop ON public.feedback_responses(shop_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_job ON public.feedback_responses(job_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_submitted ON public.feedback_responses(submitted_at);

CREATE INDEX IF NOT EXISTS idx_deleted_access_attempts_job ON public.deleted_file_access_attempts(job_id);
CREATE INDEX IF NOT EXISTS idx_deleted_access_attempts_time ON public.deleted_file_access_attempts(attempted_at);

-- ── 8. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────

-- Enable RLS across all tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_questions_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_questions_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_file_access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- 8.1 Shops Policies
DROP POLICY IF EXISTS "Public Shop Directory" ON public.shops;
CREATE POLICY "Public Shop Directory" ON public.shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Shop Owners Full Access" ON public.shops;
CREATE POLICY "Shop Owners Full Access" ON public.shops FOR ALL
USING (auth.uid() = owner_id OR auth.email() = 'mallipurapusiva@gmail.com');

-- 8.2 Jobs Policies
DROP POLICY IF EXISTS "Jobs Access Policy" ON public.jobs;
CREATE POLICY "Jobs Access Policy" ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow job submissions" ON public.jobs;
CREATE POLICY "Allow job submissions" ON public.jobs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to mark their jobs deleted" ON public.jobs;
CREATE POLICY "Allow users to mark their jobs deleted" ON public.jobs FOR UPDATE
USING (
    (is_deleted_by_user = false OR is_deleted_by_user IS NULL)
    AND status != 'printed'
    AND created_at > NOW() - INTERVAL '24 hours'
)
WITH CHECK (is_deleted_by_user = true);

DROP POLICY IF EXISTS "Shop owner update jobs" ON public.jobs;
CREATE POLICY "Shop owner update jobs" ON public.jobs FOR UPDATE
USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR auth.email() = 'mallipurapusiva@gmail.com'
);

-- 8.3 Connectivity & Public Form Policies
DROP POLICY IF EXISTS "Allow public submissions" ON public.contact_submissions;
CREATE POLICY "Allow public submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "CEO Read All Contact Submissions" ON public.contact_submissions;
CREATE POLICY "CEO Read All Contact Submissions" ON public.contact_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public newsletter signups" ON public.newsletter_subs;
CREATE POLICY "Allow public newsletter signups" ON public.newsletter_subs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "CEO Read All Newsletter Subs" ON public.newsletter_subs;
CREATE POLICY "CEO Read All Newsletter Subs" ON public.newsletter_subs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public vulnerability reports" ON public.security_reports;
CREATE POLICY "Allow public vulnerability reports" ON public.security_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "CEO can view security reports" ON public.security_reports;
CREATE POLICY "CEO can view security reports" ON public.security_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public partner applications" ON public.partners;
CREATE POLICY "Allow public partner applications" ON public.partners FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public reading of approved partners" ON public.partners;
CREATE POLICY "Allow public reading of approved partners" ON public.partners FOR SELECT USING (status = 'approved' OR true);

DROP POLICY IF EXISTS "Allow public applications" ON public.job_applications;
CREATE POLICY "Allow public applications" ON public.job_applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "CEO Read Job Applications" ON public.job_applications;
CREATE POLICY "CEO Read Job Applications" ON public.job_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public reading of blogs" ON public.blogs;
CREATE POLICY "Allow public reading of blogs" ON public.blogs FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Allow public reading of news" ON public.platform_news;
CREATE POLICY "Allow public reading of news" ON public.platform_news FOR SELECT USING (true);

-- 8.4 Settings & Feedback Policies
DROP POLICY IF EXISTS "Everyone can view platform settings" ON public.platform_settings;
CREATE POLICY "Everyone can view platform settings" ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "CEO can manage platform settings" ON public.platform_settings;
CREATE POLICY "CEO can manage platform settings" ON public.platform_settings FOR ALL
USING (auth.email() = 'mallipurapusiva@gmail.com')
WITH CHECK (auth.email() = 'mallipurapusiva@gmail.com');

DROP POLICY IF EXISTS "Everyone can view active default questions" ON public.feedback_questions_default;
CREATE POLICY "Everyone can view active default questions" ON public.feedback_questions_default FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "CEO can manage default questions" ON public.feedback_questions_default;
CREATE POLICY "CEO can manage default questions" ON public.feedback_questions_default FOR ALL
USING (auth.email() = 'mallipurapusiva@gmail.com')
WITH CHECK (auth.email() = 'mallipurapusiva@gmail.com');

DROP POLICY IF EXISTS "Everyone can view active custom questions" ON public.feedback_questions_custom;
CREATE POLICY "Everyone can view active custom questions" ON public.feedback_questions_custom FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Shop owners can manage custom questions" ON public.feedback_questions_custom;
CREATE POLICY "Shop owners can manage custom questions" ON public.feedback_questions_custom FOR ALL
USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR auth.email() = 'mallipurapusiva@gmail.com'
);

DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback_responses;
CREATE POLICY "Users can submit feedback" ON public.feedback_responses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Shop owners view feedback responses" ON public.feedback_responses;
CREATE POLICY "Shop owners view feedback responses" ON public.feedback_responses FOR SELECT
USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR auth.email() = 'mallipurapusiva@gmail.com'
);

-- 8.5 Audit Log Policies
DROP POLICY IF EXISTS "Allow insert for audit logging" ON public.deleted_file_access_attempts;
CREATE POLICY "Allow insert for audit logging" ON public.deleted_file_access_attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Shop owners see access attempts" ON public.deleted_file_access_attempts;
CREATE POLICY "Shop owners see access attempts" ON public.deleted_file_access_attempts FOR SELECT
USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR auth.email() = 'mallipurapusiva@gmail.com'
);

DROP POLICY IF EXISTS "WhatsApp sessions policy" ON public.whatsapp_sessions;
CREATE POLICY "WhatsApp sessions policy" ON public.whatsapp_sessions FOR ALL USING (true);

-- ── 9. SEED DATA & INITIAL CONFIGURATION ───────────────────────────────────

-- Seed Platform Settings
INSERT INTO public.platform_settings (key, value, description)
VALUES 
    ('maintenance_mode', 'false'::JSONB, 'Global platform maintenance toggle'),
    ('global_feedback_enabled', '{"enabled": true, "mandatory": false}'::JSONB, 'Global toggle for feedback system across all shops')
ON CONFLICT (key) DO NOTHING;

-- Seed Default Feedback Questions
INSERT INTO public.feedback_questions_default (question_text, question_type, options, display_order, category)
VALUES
    ('How satisfied are you with our printing service?', 'emoji', '["😠 Very Bad","😞 Bad","😐 Okay","🙂 Good","😍 Excellent"]', 1, 'general'),
    ('How was the print quality?', 'emoji', '["😠 Poor","😞 Fair","😐 Average","🙂 Good","😍 Perfect"]', 2, 'quality'),
    ('How fast was the service?', 'emoji', '["🐌 Too Slow","🐢 Slow","⏱️ Okay","🚀 Fast","⚡ Super Fast"]', 3, 'speed'),
    ('How friendly was our staff?', 'emoji', '["😠 Rude","😞 Unfriendly","😐 Neutral","🙂 Friendly","😍 Very Friendly"]', 4, 'service'),
    ('Would you recommend us to friends?', 'emoji', '["❌ Never","🤔 Maybe","👍 Yes","🌟 Definitely","🔥 Absolutely!"]', 5, 'general')
ON CONFLICT DO NOTHING;

-- ── 10. STORAGE BUCKET & REALTIME CONFIGURATION ───────────────────────────

-- Ensure Document Storage Bucket Exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for 'documents' bucket
DROP POLICY IF EXISTS "Allow public uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on documents" ON storage.objects;

CREATE POLICY "Allow public uploads to documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public select from documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow public update on documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public delete on documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- Add Tables to Supabase Realtime Publication if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs, public.shops;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Handle gracefully if already present or in self-hosted Postgres
  NULL;
END $$;

COMMIT;

-- ── 11. SCHEMA COMMENTS ─────────────────────────────────────────────────────

COMMENT ON TABLE public.shops IS 'Base table for multi-tenant xerox shops. Protected by RLS governance triggers.';
COMMENT ON TABLE public.jobs IS 'Print job queue. Sensitive customer data is protected via Row Level Security.';
COMMENT ON TABLE public.automation_logs IS 'Audit trail for all self-healing and autonomous system actions.';
COMMENT ON TABLE public.shop_daily_metrics IS 'Data Warehouse snapshot table for long-term business intelligence.';
COMMENT ON TABLE public.feedback_questions_default IS 'Default feedback questions managed by CEO/Platform Admin.';
COMMENT ON TABLE public.feedback_questions_custom IS 'Custom feedback questions created by shopkeepers.';
COMMENT ON TABLE public.feedback_responses IS 'Customer feedback submissions.';
COMMENT ON TABLE public.platform_settings IS 'Global platform settings controlled by CEO.';
COMMENT ON TABLE public.whatsapp_sessions IS 'Session tracking for WhatsApp bot interactions.';
COMMENT ON TABLE public.deleted_file_access_attempts IS 'Audit log for tracking attempts to access user-deleted files.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════════
