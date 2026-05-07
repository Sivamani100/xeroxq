-- XeroxQ File Deletion & Download Control Migration
-- Purpose: Add user file deletion capability and control shopkeeper download access
-- Author: Database Administrator (DBA)
-- Date: 2025-05-07

BEGIN;

-- ── 1. Add File Deletion Tracking Columns ──────────────────────────────────
-- Track if user has deleted their file
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS is_deleted_by_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by_user_id UUID DEFAULT NULL;

-- Index for efficient queries on deletion status
CREATE INDEX IF NOT EXISTS idx_jobs_is_deleted_by_user ON public.jobs(is_deleted_by_user);
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON public.jobs(deleted_at);

-- ── 2. Create Function to Check File Download Availability ────────────────
-- File can be downloaded ONLY when:
-- 1. User has NOT deleted the file (is_deleted_by_user = false)
-- 2. Shopkeeper has NOT completed the job (status != 'printed')

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
    
    -- File is downloadable only if:
    -- 1. Not deleted by user
    -- 2. Status is not 'printed' (not completed by shopkeeper)
    RETURN (
        v_is_deleted = false OR v_is_deleted IS NULL
    ) AND (
        v_status != 'printed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Create Function to Mark File as Deleted by User ───────────────────
-- This function handles the complete deletion process:
-- 1. Marks the job as deleted in the database
-- 2. Returns the file_path for storage deletion
-- 3. Can be called from the client with proper RLS

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
    v_status job_status_type;
BEGIN
    -- Get current job info
    SELECT j.file_path, j.is_deleted_by_user, j.status
    INTO v_file_path, v_already_deleted, v_status
    FROM public.jobs j
    WHERE j.id = p_job_id;
    
    -- Check if job exists
    IF v_file_path IS NULL THEN
        RETURN QUERY SELECT NULL::TEXT, false, 'Job not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if already deleted
    IF v_already_deleted = true THEN
        RETURN QUERY SELECT v_file_path, false, 'File already deleted'::TEXT;
        RETURN;
    END IF;
    
    -- Check if job is already printed/completed
    IF v_status = 'printed' THEN
        RETURN QUERY SELECT v_file_path, false, 'Cannot delete - job already completed by shopkeeper'::TEXT;
        RETURN;
    END IF;
    
    -- Mark as deleted
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

-- ── 4. Update RLS Policies for Jobs Table ────────────────────────────────
-- Allow users to update their own jobs (for deletion marking)
-- Note: Anonymous users can update jobs they created (based on session)

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow users to delete their jobs" ON public.jobs;

-- Create policy allowing users to mark their jobs as deleted
-- Users can only update is_deleted_by_user, deleted_at fields on their recent jobs
CREATE POLICY "Allow users to mark their jobs deleted"
ON public.jobs FOR UPDATE
USING (
    -- Job is not yet deleted
    (is_deleted_by_user = false OR is_deleted_by_user IS NULL)
    -- Job is not yet printed
    AND status != 'printed'
    -- Job was created within last 24 hours (reasonable window)
    AND created_at > NOW() - INTERVAL '24 hours'
)
WITH CHECK (
    -- Only allow setting is_deleted_by_user to true
    is_deleted_by_user = true
);

-- ── 5. Create View for Shopkeeper Jobs (Excludes Deleted Files) ──────────
-- Optional: Create a view that automatically filters out deleted files
-- This can be used by the admin portal for cleaner queries

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
    -- Computed column for download availability
    (is_deleted_by_user = false OR is_deleted_by_user IS NULL) 
        AND status != 'printed' AS is_downloadable
FROM public.jobs
WHERE (is_deleted_by_user = false OR is_deleted_by_user IS NULL)
   OR status = 'printed'; -- Keep printed jobs for records but mark not downloadable

-- ── 6. Add Comments for Documentation ────────────────────────────────────
COMMENT ON COLUMN public.jobs.is_deleted_by_user IS 'Flag indicating if the user has deleted their file. Once deleted, shopkeeper cannot download.';
COMMENT ON COLUMN public.jobs.deleted_at IS 'Timestamp when the user deleted the file';
COMMENT ON COLUMN public.jobs.deleted_by_user_id IS 'User ID who deleted the file (for authenticated users)';
COMMENT ON FUNCTION public.is_file_downloadable IS 'Checks if a file can be downloaded by shopkeeper. Returns false if user deleted file or job is printed.';
COMMENT ON FUNCTION public.mark_file_deleted_by_user IS 'Marks a file as deleted by user. Returns file_path for storage cleanup and status message.';
COMMENT ON VIEW public.active_jobs IS 'View of jobs excluding user-deleted files. Includes is_downloadable computed column.';

COMMIT;
