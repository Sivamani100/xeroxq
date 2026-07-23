-- ═══════════════════════════════════════════════════════════════════════════════
-- XeroxQ: Shop Approval RPC Security Migration
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this script in Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create a SECURITY DEFINER function to allow platform admin approval/rejection
--    regardless of strict RLS policies on the shops table.
CREATE OR REPLACE FUNCTION public.update_shop_approval_status(target_shop_id UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.shops
  SET approval_status = new_status
  WHERE id = target_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execution permissions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.update_shop_approval_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shop_approval_status(UUID, TEXT) TO anon;
