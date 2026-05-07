-- XeroxQ Feedback System Migration
-- Purpose: Complete feedback mechanism for customers, shopkeepers, and CEO
-- Author: Database Administrator (DBA)
-- Date: 2025-05-07

BEGIN;

-- ── 1. Add Feedback Settings to Shops Table ───────────────────────────────
-- Global and per-shop feedback toggle settings

ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_feedback_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_feedback_title TEXT DEFAULT 'How was your experience?';

-- ── 2. Create Platform-Level Settings for CEO ───────────────────────────
-- Store global settings that CEO can control

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- Ensure description column exists (for tables created before this migration)
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure value column is JSONB type (fix for existing tables with boolean type)
DO $$
BEGIN
    -- Check if value column exists and is not JSONB, then alter it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_settings' 
        AND column_name = 'value'
        AND data_type != 'jsonb'
    ) THEN
        ALTER TABLE public.platform_settings 
        ALTER COLUMN value TYPE JSONB USING value::text::jsonb;
    END IF;
END $$;

-- Insert default global feedback setting (CEO can toggle this)
INSERT INTO public.platform_settings (key, value, description)
VALUES (
    'global_feedback_enabled',
    '{"enabled": true, "mandatory": false}'::JSONB,
    'Global toggle for feedback system across all shops'
)
ON CONFLICT (key) DO NOTHING;

-- ── 3. Create Default Feedback Questions Table ──────────────────────────
-- These are managed by CEO/Platform Admin

CREATE TABLE IF NOT EXISTS public.feedback_questions_default (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'emoji', -- 'emoji', 'rating', 'text', 'choice'
    options JSONB, -- For emoji: ["😠","😞","😐","🙂","😍"], for choice: ["option1", "option2"]
    is_active BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general', -- 'general', 'service', 'quality', 'speed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default friendly feedback questions
INSERT INTO public.feedback_questions_default (question_text, question_type, options, display_order, category)
VALUES
    ('How satisfied are you with our printing service?', 'emoji', '["😠 Very Bad","😞 Bad","😐 Okay","🙂 Good","😍 Excellent"]', 1, 'general'),
    ('How was the print quality?', 'emoji', '["😠 Poor","😞 Fair","😐 Average","🙂 Good","😍 Perfect"]', 2, 'quality'),
    ('How fast was the service?', 'emoji', '["🐌 Too Slow","🐢 Slow","⏱️ Okay","🚀 Fast","⚡ Super Fast"]', 3, 'speed'),
    ('How friendly was our staff?', 'emoji', '["😠 Rude","😞 Unfriendly","😐 Neutral","🙂 Friendly","😍 Very Friendly"]', 4, 'service'),
    ('Would you recommend us to friends?', 'emoji', '["❌ Never","🤔 Maybe","👍 Yes","🌟 Definitely","🔥 Absolutely!"]', 5, 'general')
ON CONFLICT DO NOTHING;

-- ── 4. Create Custom Feedback Questions Table (Shop-Level) ─────────────
-- These are managed by individual shopkeepers

CREATE TABLE IF NOT EXISTS public.feedback_questions_custom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'emoji', -- 'emoji', 'rating', 'text', 'choice'
    options JSONB, -- For emoji/choice questions
    is_active BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_questions_custom_shop ON public.feedback_questions_custom(shop_id);

-- ── 5. Create Feedback Responses Table ─────────────────────────────────
-- Store all feedback responses from customers

CREATE TABLE IF NOT EXISTS public.feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_phone TEXT,
    
    -- Default question responses (JSONB with question_id as key)
    default_responses JSONB NOT NULL DEFAULT '{}',
    
    -- Custom question responses (JSONB with question_id as key)
    custom_responses JSONB NOT NULL DEFAULT '{}',
    
    -- Final text feedback about the shop
    written_feedback TEXT,
    
    -- Overall satisfaction (calculated or explicit)
    overall_rating INTEGER, -- 1-5 scale
    
    -- Metadata
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_feedback_responses_shop ON public.feedback_responses(shop_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_job ON public.feedback_responses(job_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_submitted ON public.feedback_responses(submitted_at);

-- ── 6. Create Function to Check if Feedback is Required ───────────────
-- This checks both global and shop-level settings

CREATE OR REPLACE FUNCTION public.is_feedback_enabled_for_shop(
    p_shop_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_global_enabled BOOLEAN;
    v_shop_enabled BOOLEAN;
BEGIN
    -- Check global setting (CEO controlled)
    SELECT (value->>'enabled')::BOOLEAN INTO v_global_enabled
    FROM public.platform_settings
    WHERE key = 'global_feedback_enabled';
    
    -- Default to true if not found
    IF v_global_enabled IS NULL THEN
        v_global_enabled := true;
    END IF;
    
    -- If globally disabled, return false immediately
    IF v_global_enabled = false THEN
        RETURN false;
    END IF;
    
    -- Check shop-level setting
    SELECT feedback_enabled INTO v_shop_enabled
    FROM public.shops
    WHERE id = p_shop_id;
    
    -- Default to true if not found
    IF v_shop_enabled IS NULL THEN
        v_shop_enabled := true;
    END IF;
    
    RETURN v_shop_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Create Function to Get Feedback Questions for Job ───────────────
-- Returns both default and custom questions for a specific shop

CREATE OR REPLACE FUNCTION public.get_feedback_questions(
    p_shop_id UUID
) RETURNS TABLE (
    question_id UUID,
    question_text TEXT,
    question_type TEXT,
    options JSONB,
    is_required BOOLEAN,
    display_order INTEGER,
    source TEXT -- 'default' or 'custom'
) AS $$
BEGIN
    -- Return default questions
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
    
    -- Return custom questions for this shop
    SELECT 
        fqc.id,
        fqc.question_text,
        fqc.question_type,
        fqc.options,
        fqc.is_required,
        fqc.display_order + 100, -- Custom questions come after default
        'custom'::TEXT as source
    FROM public.feedback_questions_custom fqc
    WHERE fqc.shop_id = p_shop_id
    AND fqc.is_active = true
    
    ORDER BY display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. Create Function to Submit Feedback ──────────────────────────────
-- Handles the complete feedback submission

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
    -- Check if feedback is enabled
    IF NOT public.is_feedback_enabled_for_shop(p_shop_id) THEN
        RETURN QUERY SELECT false, 'Feedback is currently disabled for this shop', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if feedback already submitted for this job
    IF EXISTS (SELECT 1 FROM public.feedback_responses WHERE job_id = p_job_id) THEN
        RETURN QUERY SELECT false, 'Feedback already submitted for this job', NULL::UUID;
        RETURN;
    END IF;
    
    -- Calculate overall rating from default responses (if emoji/rating type)
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
    
    -- Insert feedback
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

-- ── 9. Create View for Shop Feedback Analytics ───────────────────────
-- Aggregated view for shopkeepers to see feedback stats

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

-- ── 10. Enable RLS on All New Tables ────────────────────────────────────

-- RLS for feedback_questions_default
ALTER TABLE public.feedback_questions_default ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO can manage default questions"
ON public.feedback_questions_default
FOR ALL
USING (auth.email() = 'mallipurapusiva@gmail.com')
WITH CHECK (auth.email() = 'mallipurapusiva@gmail.com');

CREATE POLICY "Everyone can view active default questions"
ON public.feedback_questions_default
FOR SELECT
USING (is_active = true);

-- RLS for feedback_questions_custom
ALTER TABLE public.feedback_questions_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage their custom questions"
ON public.feedback_questions_custom
FOR ALL
USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR auth.email() = 'mallipurapusiva@gmail.com'
)
WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR auth.email() = 'mallipurapusiva@gmail.com'
);

CREATE POLICY "Everyone can view active custom questions"
ON public.feedback_questions_custom
FOR SELECT
USING (is_active = true);

-- RLS for feedback_responses
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view their feedback responses"
ON public.feedback_responses
FOR SELECT
USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR auth.email() = 'mallipurapusiva@gmail.com'
);

CREATE POLICY "Users can submit feedback (insert only)"
ON public.feedback_responses
FOR INSERT
WITH CHECK (true); -- Anyone can submit, function handles validation

-- No UPDATE or DELETE - feedback is permanent record

-- RLS for platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO can manage platform settings"
ON public.platform_settings
FOR ALL
USING (auth.email() = 'mallipurapusiva@gmail.com')
WITH CHECK (auth.email() = 'mallipurapusiva@gmail.com');

CREATE POLICY "Everyone can view platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- ── 11. Add Comments for Documentation ───────────────────────────────────
COMMENT ON TABLE public.feedback_questions_default IS 'Default feedback questions managed by CEO/Platform Admin';
COMMENT ON TABLE public.feedback_questions_custom IS 'Custom feedback questions created by shopkeepers for their shops';
COMMENT ON TABLE public.feedback_responses IS 'All customer feedback submissions';
COMMENT ON TABLE public.platform_settings IS 'Global platform settings controlled by CEO';
COMMENT ON COLUMN public.shops.feedback_enabled IS 'Toggle feedback for this specific shop';
COMMENT ON COLUMN public.shops.custom_feedback_enabled IS 'Allow custom feedback questions for this shop';
COMMENT ON FUNCTION public.is_feedback_enabled_for_shop IS 'Checks both global and shop-level feedback settings';
COMMENT ON FUNCTION public.get_feedback_questions IS 'Returns combined default and custom questions for a shop';
COMMENT ON FUNCTION public.submit_feedback IS 'Submits complete feedback with validation';

COMMIT;
