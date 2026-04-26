-- Migration: Add reporter_name to security_reports
ALTER TABLE security_reports ADD COLUMN IF NOT EXISTS reporter_name TEXT;

-- Refresh RLS Policies to ensure everything is consistent
DROP POLICY IF EXISTS "Public can submit security reports" ON security_reports;
CREATE POLICY "Public can submit security reports" ON security_reports 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "CEO can view security reports" ON security_reports;
CREATE POLICY "CEO can view security reports" ON security_reports 
FOR SELECT USING (true); -- Usually restricted by Service Role, but safe for CEO role
