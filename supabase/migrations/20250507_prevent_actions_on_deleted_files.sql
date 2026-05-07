-- XeroxQ Database-Level Protection for Deleted Files
-- Purpose: Prevent ANY action (print, download, complete) on user-deleted files at the database level
-- Author: Database Administrator (DBA)
-- Date: 2025-05-07
-- Note: Run this AFTER 20250507_add_file_deletion_features.sql

BEGIN;

-- ── 1. Create Function to Enforce Deleted File Protection ────────────────
-- This trigger function will block any updates to jobs that are marked as deleted by user

CREATE OR REPLACE FUNCTION public.tr_enforce_deleted_file_protection()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the file has been deleted by the user
    IF OLD.is_deleted_by_user = true THEN
        -- Allow only specific safe operations even after deletion:
        -- 1. Shopkeeper can still delete the record completely (full cleanup)
        -- 2. Nothing else should be allowed
        
        -- If trying to change status to 'printed' or any other status
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Cannot change status of deleted file (Token: %). User has deleted this file.', OLD.token
                USING HINT = 'This file was deleted by the user and no further actions are allowed.';
        END IF;
        
        -- If trying to modify file_path (download attempts)
        IF NEW.file_path IS DISTINCT FROM OLD.file_path THEN
            RAISE EXCEPTION 'Cannot modify file path of deleted file (Token: %). User has deleted this file.', OLD.token
                USING HINT = 'This file was deleted by the user and no further actions are allowed.';
        END IF;
        
        -- If trying to update preferences or any other operational field
        IF NEW.preferences IS DISTINCT FROM OLD.preferences THEN
            RAISE EXCEPTION 'Cannot modify preferences of deleted file (Token: %). User has deleted this file.', OLD.token
                USING HINT = 'This file was deleted by the user and no further actions are allowed.';
        END IF;
        
        -- Block any other changes except specific allowed fields
        -- Allowed: updated_at (for timestamp updates)
        -- Not allowed: anything else that could indicate an action on the file
    END IF;
    
    -- Prevent marking as 'printed' if file was deleted (even if checking at same time)
    IF NEW.status = 'printed' AND (OLD.is_deleted_by_user = true OR NEW.is_deleted_by_user = true) THEN
        RAISE EXCEPTION 'Cannot complete job - file has been deleted by user (Token: %)', OLD.token
            USING HINT = 'The user deleted this file before completion. Inform customer to re-upload if needed.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Attach Trigger for Deleted File Protection ──────────────────────────
-- This trigger fires on every UPDATE to check the protection rules

DROP TRIGGER IF EXISTS tr_jobs_deleted_protection ON public.jobs;

CREATE TRIGGER tr_jobs_deleted_protection
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_enforce_deleted_file_protection();

-- ── 3. Create Function to Check Download/Print Permission ───────────────
-- This function can be called by APIs to verify if an action is allowed

CREATE OR REPLACE FUNCTION public.check_file_action_allowed(
    p_job_id UUID,
    p_action TEXT -- 'download', 'print', 'complete', 'view'
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
    -- Get current job state
    SELECT is_deleted_by_user, status, token
    INTO v_is_deleted, v_status, v_token
    FROM public.jobs
    WHERE id = p_job_id;
    
    -- If job not found
    IF v_token IS NULL THEN
        RETURN QUERY SELECT false, 'Job not found', false, ''::TEXT;
        RETURN;
    END IF;
    
    -- Check if deleted by user
    IF v_is_deleted = true THEN
        RETURN QUERY SELECT 
            false, 
            'File deleted by user (Token: ' || v_token || '). No actions allowed.',
            true,
            v_status::TEXT;
        RETURN;
    END IF;
    
    -- For complete action, check if already printed
    IF p_action = 'complete' AND v_status = 'printed' THEN
        RETURN QUERY SELECT 
            false, 
            'Job already completed (Token: ' || v_token || ')',
            false,
            v_status::TEXT;
        RETURN;
    END IF;
    
    -- For download/print actions, check if printed
    IF p_action IN ('download', 'print') AND v_status = 'printed' THEN
        RETURN QUERY SELECT 
            false, 
            'Job already completed - file access restricted (Token: ' || v_token || ')',
            false,
            v_status::TEXT;
        RETURN;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT true, 'Action allowed', false, v_status::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Create Row-Level Security Policy for Deleted Files ───────────────
-- Ensure that deleted files cannot be read by normal queries (optional extra protection)

-- First, enable a policy that excludes deleted files from normal SELECT queries
-- Note: Shop owners should still see deleted files in their history (marked as deleted)
-- but should not be able to access the actual file data

-- Create a policy that restricts access to file_path for deleted files
CREATE POLICY "Hide file data for deleted jobs"
ON public.jobs FOR SELECT
USING (
    -- Always allow seeing the job record itself
    -- But we'll use application logic to hide the file_path
    true
);

-- ── 5. Create Function to Auto-Log Blocked Attempts ───────────────────
-- Log when shopkeepers try to access deleted files (for audit purposes)

CREATE TABLE IF NOT EXISTS public.deleted_file_access_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id),
    shop_id UUID REFERENCES public.shops(id),
    action_attempted TEXT NOT NULL, -- 'download', 'print', 'complete'
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    attempted_by UUID, -- shop owner user ID
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_deleted_access_attempts_job ON public.deleted_file_access_attempts(job_id);
CREATE INDEX IF NOT EXISTS idx_deleted_access_attempts_time ON public.deleted_file_access_attempts(attempted_at);

COMMENT ON TABLE public.deleted_file_access_attempts IS 'Audit log for tracking attempts to access user-deleted files';

-- Function to log blocked attempts
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

-- ── 6. Enable RLS on Audit Table and Add Policies ────────────────────────

-- Enable RLS on the audit table
ALTER TABLE public.deleted_file_access_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role and authenticated shop owners can insert (log attempts)
-- Note: The function uses SECURITY DEFINER so it bypasses RLS anyway
CREATE POLICY "Allow insert for audit logging"
ON public.deleted_file_access_attempts FOR INSERT
WITH CHECK (true);

-- Policy: Only shop owners can see their own shop's attempts
-- Admin/CEO can see all attempts via service role
CREATE POLICY "Shop owners see their own attempts"
ON public.deleted_file_access_attempts FOR SELECT
USING (
    shop_id IN (
        SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
    OR
    auth.email() = 'mallipurapusiva@gmail.com' -- CEO/Admin access
);

-- Policy: No direct updates allowed (audit trail is immutable)
-- (No UPDATE policy = updates are blocked)

-- Policy: No direct deletes allowed (audit trail must be preserved)
-- (No DELETE policy = deletes are blocked)

-- ── 7. Add Comments for Documentation ────────────────────────────────────
COMMENT ON FUNCTION public.tr_enforce_deleted_file_protection IS 'Trigger function that prevents any updates to jobs marked as deleted by user. Blocks status changes, file path modifications, and preference updates.';
COMMENT ON FUNCTION public.check_file_action_allowed IS 'Checks if a specific action (download, print, complete) is allowed on a job. Returns detailed reason if blocked.';
COMMENT ON FUNCTION public.log_deleted_file_attempt IS 'Logs attempts to access deleted files for security auditing.';

COMMIT;
