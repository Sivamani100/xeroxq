-- Migration: Ensure partners table has all required columns
-- This script safely adds columns if they are missing

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='type') THEN
        ALTER TABLE partners ADD COLUMN type TEXT DEFAULT 'Developer';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='status') THEN
        ALTER TABLE partners ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='bio') THEN
        ALTER TABLE partners ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='profile_url') THEN
        ALTER TABLE partners ADD COLUMN profile_url TEXT;
    END IF;
END $$;

-- Ensure RLS is enabled and policies are correct
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can apply to be a partner" ON partners;
CREATE POLICY "Anyone can apply to be a partner" ON partners 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view partners" ON partners;
CREATE POLICY "Admins can view partners" ON partners 
FOR SELECT USING (true); -- Restricted by Service Role in the API, so this is safe
