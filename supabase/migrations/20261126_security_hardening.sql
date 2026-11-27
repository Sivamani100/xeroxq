-- ═══════════════════════════════════════════════════════════════════════════════
-- XeroxQ — Comprehensive Security, RLS, RPC & Storage Hardening Migration
-- Date: 2026-11-26
-- Target Project: vxittblwbyusehsrgffd
-- ═══════════════════════════════════════════════════════════════════════════════
-- Addresses:
--  1. Revokes anon/public EXECUTE on sensitive SECURITY DEFINER RPCs
--  2. Moves admin checks into non-exposed `private` schema using JWT/settings
--  3. Replaces USING (true) SELECT/UPDATE/INSERT policies with session & owner RLS
--  4. Enforces shop status, trial quota (3 free files), and is_paid = false on job insert
--  5. Prevents shop owners from self-approving or tampering with billing balances
--  6. Secures private `'documents'` Storage bucket with <shop_id>/<auth_uid>/ paths
--  7. Fixes `submit_feedback()` rating calculation bug (unquoted jsonb_each_text)
--  8. Recreates views with WITH (security_invoker = true)
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Non-Exposed Security Schema & Helper Functions ─────────────────────────
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- Standardize platform_settings.value to JSONB (recovers conflicting boolean migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'platform_settings'
      AND column_name = 'value' AND data_type <> 'jsonb'
  ) THEN
    ALTER TABLE public.platform_settings
      ALTER COLUMN value TYPE JSONB USING to_jsonb(value);
  END IF;
END $$;

INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('maintenance_mode', 'false'::JSONB, 'Global platform maintenance toggle'),
  ('global_feedback_enabled', '{"enabled": true, "mandatory": false}'::JSONB, 'Global toggle for feedback system across all shops'),
  ('ceo_email', '{"email": "mallipurapusiva@gmail.com"}'::JSONB, 'Platform admin / CEO email identifier')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION private.is_service_context()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT current_user IN ('service_role', 'postgres', 'supabase_admin')
      OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role';
$$;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_ceo_email TEXT;
  v_jwt JSONB;
  v_user_email TEXT;
BEGIN
  IF private.is_service_context() THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  v_jwt := auth.jwt();

  -- Preferred: explicit immutable app_metadata role claim
  IF COALESCE(v_jwt -> 'app_metadata' ->> 'role', '') = 'platform_admin' THEN
    RETURN TRUE;
  END IF;

  SELECT LOWER(TRIM(COALESCE(value ->> 'email', value #>> '{}', '')))
    INTO v_ceo_email
  FROM public.platform_settings
  WHERE key = 'ceo_email';

  IF v_ceo_email IS NULL OR v_ceo_email = '' THEN
    RETURN FALSE;
  END IF;

  v_user_email := LOWER(TRIM(COALESCE(v_jwt ->> 'email', '')));
  RETURN v_user_email <> '' AND v_user_email = v_ceo_email;
END;
$$;

REVOKE ALL ON FUNCTION private.is_service_context() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_platform_admin() FROM PUBLIC;

-- ── 2. Harden `public.shops` Policies & Column Integrity Triggers ──────────────
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Shop Directory" ON public.shops;
DROP POLICY IF EXISTS "Shop Owners Full Access" ON public.shops;
DROP POLICY IF EXISTS "Shops are viewable by everyone" ON public.shops;
DROP POLICY IF EXISTS "Allow individual shop owners to update their shops" ON public.shops;
DROP POLICY IF EXISTS "Shops public select" ON public.shops;
DROP POLICY IF EXISTS "Shop owners insert own shop" ON public.shops;
DROP POLICY IF EXISTS "Shop owners update own shop" ON public.shops;
DROP POLICY IF EXISTS "Shop owners delete own shop" ON public.shops;

CREATE POLICY "Shops public select"
  ON public.shops FOR SELECT
  TO anon, authenticated
  USING (
    is_active IS TRUE
    OR owner_id = (select auth.uid())
    OR private.is_platform_admin()
  );

CREATE POLICY "Shop owners insert own shop"
  ON public.shops FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (select auth.uid())
    OR private.is_platform_admin()
  );

CREATE POLICY "Shop owners update own shop"
  ON public.shops FOR UPDATE
  TO authenticated
  USING (
    owner_id = (select auth.uid())
    OR private.is_platform_admin()
  )
  WITH CHECK (
    owner_id = (select auth.uid())
    OR private.is_platform_admin()
  );

CREATE POLICY "Shop owners delete own shop"
  ON public.shops FOR DELETE
  TO authenticated
  USING (
    owner_id = (select auth.uid())
    OR private.is_platform_admin()
  );

-- Prevent non-admin shopkeepers from forging approval_status, balance, active flag, or file counters
CREATE OR REPLACE FUNCTION public.tr_enforce_shop_column_governance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF private.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.approval_status := 'pending';
    NEW.is_active := TRUE;
    NEW.platform_balance := 0.00;
    NEW.total_files_processed := 0;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'Cannot reassign shop owner_id';
    END IF;
    NEW.approval_status := OLD.approval_status;
    NEW.is_active := OLD.is_active;
    NEW.platform_balance := OLD.platform_balance;
    NEW.total_files_processed := OLD.total_files_processed;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_shops_column_governance ON public.shops;
CREATE TRIGGER tr_shops_column_governance
  BEFORE INSERT OR UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_enforce_shop_column_governance();

-- ── 3. Harden `public.jobs` Ownership, Payment Integrity & Trial Quota ─────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS owner_session_id UUID DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS is_auto_deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_jobs_owner_session_id ON public.jobs(owner_session_id);

DROP POLICY IF EXISTS "Jobs Access Policy" ON public.jobs;
DROP POLICY IF EXISTS "Jobs Public Read Access" ON public.jobs;
DROP POLICY IF EXISTS "Allow job submissions" ON public.jobs;
DROP POLICY IF EXISTS "Allow users to mark their jobs deleted" ON public.jobs;
DROP POLICY IF EXISTS "Allow users to delete their jobs" ON public.jobs;
DROP POLICY IF EXISTS "Shop owner view jobs" ON public.jobs;
DROP POLICY IF EXISTS "Shop owner update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Hide file data for deleted jobs" ON public.jobs;
DROP POLICY IF EXISTS "Jobs scoped select" ON public.jobs;
DROP POLICY IF EXISTS "Jobs scoped insert" ON public.jobs;
DROP POLICY IF EXISTS "Customers mark own jobs deleted" ON public.jobs;
DROP POLICY IF EXISTS "Shop owners update own shop jobs" ON public.jobs;
DROP POLICY IF EXISTS "Shop owners delete own shop jobs" ON public.jobs;

CREATE POLICY "Jobs scoped select"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (
    owner_session_id = (select auth.uid())
    OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  );

CREATE POLICY "Jobs scoped insert"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    shop_id IS NOT NULL
    AND (owner_session_id IS NULL OR owner_session_id = (select auth.uid()))
  );

CREATE POLICY "Customers mark own jobs deleted"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    owner_session_id = (select auth.uid())
    AND (is_deleted_by_user = FALSE OR is_deleted_by_user IS NULL)
    AND status <> 'printed'
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    owner_session_id = (select auth.uid())
    AND is_deleted_by_user = TRUE
    AND (deleted_by_user_id IS NULL OR deleted_by_user_id = (select auth.uid()))
  );

CREATE POLICY "Shop owners update own shop jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  );

CREATE POLICY "Shop owners delete own shop jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  );

-- Enforce server-side payment integrity (no client-spoofed is_paid=true),
-- shop active/open state, free trial limit (3 files), and atomic file counter on insert.
CREATE OR REPLACE FUNCTION public.tr_enforce_job_insert_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_shop RECORD;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();

  SELECT id, is_active, is_open, approval_status, total_files_processed
    INTO v_shop
  FROM public.shops
  WHERE id = NEW.shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target shop not found';
  END IF;

  IF COALESCE(v_shop.is_active, TRUE) = FALSE THEN
    RAISE EXCEPTION 'Shop is currently suspended';
  END IF;

  IF COALESCE(v_shop.is_open, TRUE) = FALSE AND NOT private.is_service_context() THEN
    RAISE EXCEPTION 'Shop is currently closed';
  END IF;

  IF COALESCE(v_shop.approval_status, 'pending') <> 'approved'
     AND COALESCE(v_shop.total_files_processed, 0) >= 3 THEN
    RAISE EXCEPTION 'Shop free trial scan limit (3/3) reached awaiting approval';
  END IF;

  IF NOT private.is_service_context() THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Authenticated or anonymous session required to submit print job';
    END IF;
    NEW.owner_session_id := v_uid;
    -- Clients can NEVER mark their own print jobs as paid upon insert
    NEW.is_paid := FALSE;
    NEW.status := 'pending';
    NEW.is_deleted_by_user := FALSE;
    NEW.is_auto_deleted := FALSE;
  ELSE
    NEW.owner_session_id := COALESCE(NEW.owner_session_id, v_uid);
  END IF;

  -- Atomic file counter bump (single authoritative source of truth)
  UPDATE public.shops
  SET total_files_processed = COALESCE(total_files_processed, 0) + 1
  WHERE id = NEW.shop_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_jobs_insert_security ON public.jobs;
CREATE TRIGGER tr_jobs_insert_security
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_enforce_job_insert_security();

-- Prevent customers from mutating any job column other than user-deletion flags
CREATE OR REPLACE FUNCTION public.tr_enforce_job_update_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_is_owner_or_admin BOOLEAN;
BEGIN
  IF private.is_service_context() OR private.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = OLD.shop_id AND s.owner_id = auth.uid()
  ) INTO v_is_owner_or_admin;

  IF v_is_owner_or_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.token IS DISTINCT FROM OLD.token
     OR NEW.shop_id IS DISTINCT FROM OLD.shop_id
     OR NEW.file_path IS DISTINCT FROM OLD.file_path
     OR NEW.file_name IS DISTINCT FROM OLD.file_name
     OR NEW.preferences IS DISTINCT FROM OLD.preferences
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.is_paid IS DISTINCT FROM OLD.is_paid
     OR NEW.is_preorder IS DISTINCT FROM OLD.is_preorder
     OR NEW.page_count IS DISTINCT FROM OLD.page_count
     OR NEW.customer_name IS DISTINCT FROM OLD.customer_name
     OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone
     OR NEW.owner_session_id IS DISTINCT FROM OLD.owner_session_id THEN
    RAISE EXCEPTION 'Customers may only mark their own print job as deleted';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_jobs_update_scope ON public.jobs;
CREATE TRIGGER tr_jobs_update_scope
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_enforce_job_update_scope();

-- ── 4. Lock Down Public/Admin Form Tables & Sessions ──────────────────────────
-- Contact Submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "CEO Read All Contact Submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "CEO Read All" ON public.contact_submissions;
CREATE POLICY "Allow public submissions" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin read contact submissions" ON public.contact_submissions FOR SELECT TO authenticated USING (private.is_platform_admin());

-- Newsletter Subs
ALTER TABLE public.newsletter_subs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public newsletter signups" ON public.newsletter_subs;
DROP POLICY IF EXISTS "CEO Read All Newsletter Subs" ON public.newsletter_subs;
DROP POLICY IF EXISTS "CEO Read All News" ON public.newsletter_subs;
CREATE POLICY "Allow public newsletter signups" ON public.newsletter_subs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin read newsletter subs" ON public.newsletter_subs FOR SELECT TO authenticated USING (private.is_platform_admin());

-- Security Reports
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public vulnerability reports" ON public.security_reports;
DROP POLICY IF EXISTS "Public can submit security reports" ON public.security_reports;
DROP POLICY IF EXISTS "CEO can view security reports" ON public.security_reports;
CREATE POLICY "Public submit security reports" ON public.security_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin read security reports" ON public.security_reports FOR SELECT TO authenticated USING (private.is_platform_admin());

-- Job Applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public applications" ON public.job_applications;
DROP POLICY IF EXISTS "CEO Read Job Applications" ON public.job_applications;
CREATE POLICY "Allow public applications" ON public.job_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin read job applications" ON public.job_applications FOR SELECT TO authenticated USING (private.is_platform_admin());

-- Partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public partner applications" ON public.partners;
DROP POLICY IF EXISTS "Anyone can apply to be a partner" ON public.partners;
DROP POLICY IF EXISTS "Allow public reading of approved partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can view partners" ON public.partners;
CREATE POLICY "Anyone can apply to be a partner" ON public.partners FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' OR status IS NULL);
CREATE POLICY "Public view approved partners" ON public.partners FOR SELECT TO anon, authenticated USING (status = 'approved' OR private.is_platform_admin());

-- WhatsApp Sessions (strictly server/service_role)
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "WhatsApp sessions policy" ON public.whatsapp_sessions;
DROP POLICY IF EXISTS "WhatsApp sessions service role policy" ON public.whatsapp_sessions;
CREATE POLICY "WhatsApp sessions service role only"
  ON public.whatsapp_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deleted File Audit Log
ALTER TABLE public.deleted_file_access_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert for audit logging" ON public.deleted_file_access_attempts;
DROP POLICY IF EXISTS "Shop owners see access attempts" ON public.deleted_file_access_attempts;
DROP POLICY IF EXISTS "Shop owners see their own attempts" ON public.deleted_file_access_attempts;
CREATE POLICY "Shop owners insert audit logs"
  ON public.deleted_file_access_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  );
CREATE POLICY "Shop owners see access attempts"
  ON public.deleted_file_access_attempts FOR SELECT
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  );

-- Feedback Tables (replace hardcoded email & open insert)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow public reading of settings" ON public.platform_settings;
DROP POLICY IF EXISTS "CEO can manage platform settings" ON public.platform_settings;
CREATE POLICY "Public read non-secret platform settings"
  ON public.platform_settings FOR SELECT
  TO anon, authenticated
  USING (key IN ('maintenance_mode', 'global_feedback_enabled') OR private.is_platform_admin());
CREATE POLICY "Admin manage platform settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (private.is_platform_admin())
  WITH CHECK (private.is_platform_admin());

ALTER TABLE public.feedback_questions_default ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CEO can manage default questions" ON public.feedback_questions_default;
DROP POLICY IF EXISTS "Everyone can view active default questions" ON public.feedback_questions_default;
CREATE POLICY "Public view active default questions"
  ON public.feedback_questions_default FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR private.is_platform_admin());
CREATE POLICY "Admin manage default questions"
  ON public.feedback_questions_default FOR ALL
  TO authenticated
  USING (private.is_platform_admin())
  WITH CHECK (private.is_platform_admin());

ALTER TABLE public.feedback_questions_custom ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shop owners can manage custom questions" ON public.feedback_questions_custom;
DROP POLICY IF EXISTS "Shop owners can manage their custom questions" ON public.feedback_questions_custom;
DROP POLICY IF EXISTS "Everyone can view active custom questions" ON public.feedback_questions_custom;
CREATE POLICY "Public view active custom questions"
  ON public.feedback_questions_custom FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Shop owners manage custom questions"
  ON public.feedback_questions_custom FOR ALL
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  );

ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can submit feedback (insert only)" ON public.feedback_responses;
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback_responses;
DROP POLICY IF EXISTS "Shop owners can view their feedback responses" ON public.feedback_responses;
DROP POLICY IF EXISTS "Shop owners view feedback responses" ON public.feedback_responses;
CREATE POLICY "Shop owners view feedback responses"
  ON public.feedback_responses FOR SELECT
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = (select auth.uid()))
    OR private.is_platform_admin()
  );
-- Submissions occur exclusively through validated `submit_feedback` RPC

-- ── 5. Lock Down RPC Functions & Fix Feedback Rating Bug ──────────────────────
CREATE OR REPLACE FUNCTION public.update_shop_approval_status(target_shop_id UUID, new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT private.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden: platform admin access required';
  END IF;

  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid approval status: %', new_status;
  END IF;

  UPDATE public.shops
  SET approval_status = new_status
  WHERE id = target_shop_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_shop_approval_status(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_shop_approval_status(UUID, TEXT) TO service_role;

-- increment_shop_files is superseded by tr_jobs_insert_security; restrict to service_role
REVOKE ALL ON FUNCTION public.increment_shop_files(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shop_files(UUID) TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'increment_shop_balance') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.increment_shop_balance(UUID, NUMERIC) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.increment_shop_balance(UUID, NUMERIC) TO service_role';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'purge_storage_files') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.purge_storage_files() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.purge_storage_files() TO service_role';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_storage_analytics') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.get_storage_analytics() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_storage_analytics() TO service_role';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.mark_file_deleted_by_user(
    p_job_id UUID,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    file_path TEXT,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_file_path TEXT;
    v_already_deleted BOOLEAN;
    v_status job_status_type;
    v_owner_session_id UUID;
    v_shop_owner_id UUID;
BEGIN
    SELECT j.file_path, j.is_deleted_by_user, j.status, j.owner_session_id, s.owner_id
      INTO v_file_path, v_already_deleted, v_status, v_owner_session_id, v_shop_owner_id
    FROM public.jobs j
    JOIN public.shops s ON s.id = j.shop_id
    WHERE j.id = p_job_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::TEXT, FALSE, 'Job not found'::TEXT;
        RETURN;
    END IF;

    IF NOT private.is_platform_admin()
       AND auth.uid() IS DISTINCT FROM v_owner_session_id
       AND auth.uid() IS DISTINCT FROM v_shop_owner_id THEN
        RETURN QUERY SELECT NULL::TEXT, FALSE, 'Unauthorized to delete this job'::TEXT;
        RETURN;
    END IF;

    IF v_already_deleted = TRUE THEN
        RETURN QUERY SELECT v_file_path, FALSE, 'File already deleted'::TEXT;
        RETURN;
    END IF;

    IF v_status = 'printed' THEN
        RETURN QUERY SELECT v_file_path, FALSE, 'Cannot delete - job already completed by shopkeeper'::TEXT;
        RETURN;
    END IF;

    UPDATE public.jobs
    SET
        is_deleted_by_user = TRUE,
        deleted_at = NOW(),
        deleted_by_user_id = COALESCE(auth.uid(), p_user_id),
        updated_at = NOW()
    WHERE id = p_job_id;

    RETURN QUERY SELECT v_file_path, TRUE, 'File marked for deletion'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_file_deleted_by_user(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_file_deleted_by_user(UUID, UUID) TO authenticated, service_role;

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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_feedback_id UUID;
    v_avg_rating INTEGER;
    v_job_shop_id UUID;
    v_owner_session_id UUID;
BEGIN
    SELECT shop_id, owner_session_id
      INTO v_job_shop_id, v_owner_session_id
    FROM public.jobs
    WHERE id = p_job_id;

    IF v_job_shop_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Print job not found', NULL::UUID;
        RETURN;
    END IF;

    IF v_job_shop_id <> p_shop_id THEN
        RETURN QUERY SELECT FALSE, 'Shop mismatch for print job', NULL::UUID;
        RETURN;
    END IF;

    IF NOT private.is_platform_admin() AND auth.uid() IS DISTINCT FROM v_owner_session_id THEN
        RETURN QUERY SELECT FALSE, 'Unauthorized to submit feedback for this job', NULL::UUID;
        RETURN;
    END IF;

    IF NOT public.is_feedback_enabled_for_shop(p_shop_id) THEN
        RETURN QUERY SELECT FALSE, 'Feedback is currently disabled for this shop', NULL::UUID;
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM public.feedback_responses WHERE job_id = p_job_id) THEN
        RETURN QUERY SELECT FALSE, 'Feedback already submitted for this job', NULL::UUID;
        RETURN;
    END IF;

    -- jsonb_each_text returns unquoted scalar TEXT values (fix from previously broken quoted comparisons)
    SELECT ROUND(AVG(
        CASE TRIM(value)
            WHEN '😠 Very Bad' THEN 1
            WHEN '😞 Bad' THEN 1
            WHEN '😠 Poor' THEN 1
            WHEN '😠 Rude' THEN 1
            WHEN '❌ Never' THEN 1
            WHEN '🐌 Too Slow' THEN 1
            WHEN '1' THEN 1
            WHEN '😞 Fair' THEN 2
            WHEN '😞 Unfriendly' THEN 2
            WHEN '🤔 Maybe' THEN 2
            WHEN '🐢 Slow' THEN 2
            WHEN '2' THEN 2
            WHEN '😐 Okay' THEN 3
            WHEN '😐 Average' THEN 3
            WHEN '😐 Neutral' THEN 3
            WHEN '⏱️ Okay' THEN 3
            WHEN '3' THEN 3
            WHEN '👍 Yes' THEN 4
            WHEN '🙂 Good' THEN 4
            WHEN '🙂 Friendly' THEN 4
            WHEN '🚀 Fast' THEN 4
            WHEN '4' THEN 4
            WHEN '😍 Excellent' THEN 5
            WHEN '😍 Perfect' THEN 5
            WHEN '😍 Very Friendly' THEN 5
            WHEN '🌟 Definitely' THEN 5
            WHEN '🔥 Absolutely!' THEN 5
            WHEN '⚡ Super Fast' THEN 5
            WHEN '5' THEN 5
            ELSE NULL
        END
    ))::INTEGER
    INTO v_avg_rating
    FROM jsonb_each_text(COALESCE(p_default_responses, '{}'::JSONB));

    INSERT INTO public.feedback_responses (
        job_id, shop_id, customer_name, customer_phone,
        default_responses, custom_responses, written_feedback,
        overall_rating, ip_address, user_agent
    ) VALUES (
        p_job_id, p_shop_id, p_customer_name, p_customer_phone,
        COALESCE(p_default_responses, '{}'::JSONB),
        COALESCE(p_custom_responses, '{}'::JSONB),
        p_written_feedback,
        v_avg_rating,
        NULL,
        p_user_agent
    )
    RETURNING id INTO v_feedback_id;

    RETURN QUERY SELECT TRUE, 'Feedback submitted successfully', v_feedback_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_feedback(UUID, UUID, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_feedback(UUID, UUID, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ── 6. Recreate Views with security_invoker = true ────────────────────────────
CREATE OR REPLACE VIEW public.active_jobs
WITH (security_invoker = true) AS
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
    owner_session_id,
    created_at,
    expires_at,
    updated_at,
    (is_deleted_by_user = FALSE OR is_deleted_by_user IS NULL) AND status <> 'printed' AS is_downloadable
FROM public.jobs
WHERE (is_deleted_by_user = FALSE OR is_deleted_by_user IS NULL) OR status = 'printed';

CREATE OR REPLACE VIEW public.shop_feedback_analytics
WITH (security_invoker = true) AS
SELECT
    fr.shop_id,
    s.name AS shop_name,
    COUNT(fr.id) AS total_responses,
    AVG(fr.overall_rating)::NUMERIC(3,2) AS avg_rating,
    COUNT(CASE WHEN fr.overall_rating >= 4 THEN 1 END) AS positive_count,
    COUNT(CASE WHEN fr.overall_rating <= 2 THEN 1 END) AS negative_count,
    MAX(fr.submitted_at) AS last_feedback_date
FROM public.feedback_responses fr
JOIN public.shops s ON fr.shop_id = s.id
GROUP BY fr.shop_id, s.name;

-- ── 7. Lock Down 'documents' Storage Bucket ───────────────────────────────────
UPDATE storage.buckets
SET public = FALSE
WHERE id = 'documents';

DROP POLICY IF EXISTS "Allow public uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow shop owners and service role read documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow shop owners and service role delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Customers upload own scoped documents" ON storage.objects;
DROP POLICY IF EXISTS "Scoped read documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role update documents" ON storage.objects;
DROP POLICY IF EXISTS "Scoped delete documents" ON storage.objects;

-- Enforce `<shop_id>/<auth_uid>/<filename>` object paths
CREATE POLICY "Customers upload own scoped documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] = (select auth.uid())::TEXT
    AND EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id::TEXT = (storage.foldername(name))[1]
        AND COALESCE(s.is_active, TRUE) = TRUE
    )
  );

CREATE POLICY "Scoped read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[2] = (select auth.uid())::TEXT
      OR (storage.foldername(name))[1] IN (
        SELECT id::TEXT FROM public.shops WHERE owner_id = (select auth.uid())
      )
      OR private.is_platform_admin()
    )
  );

CREATE POLICY "Service role update documents"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Scoped delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[2] = (select auth.uid())::TEXT
      OR (storage.foldername(name))[1] IN (
        SELECT id::TEXT FROM public.shops WHERE owner_id = (select auth.uid())
      )
      OR private.is_platform_admin()
    )
  );

COMMIT;
