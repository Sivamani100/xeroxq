-- ═══════════════════════════════════════════════════════════════════════════════
-- XeroxQ: Billing Counter Migration
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in your Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add a persistent counter column to the shops table.
--    This column NEVER decreases, even when jobs are deleted by admin or cron.
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS total_files_processed BIGINT DEFAULT 0 NOT NULL;

-- 2. Create a secure RPC function that atomically increments the counter.
--    This is called from the client after every successful file upload.
CREATE OR REPLACE FUNCTION public.increment_shop_files(shop_row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.shops
  SET total_files_processed = total_files_processed + 1
  WHERE id = shop_row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execution to authenticated users (required for RLS)
GRANT EXECUTE ON FUNCTION public.increment_shop_files(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shop_files(UUID) TO anon;
