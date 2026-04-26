-- Platform Sync & Repair Migration
-- Ensures all connectivity tables exist and have correct policies.

-- 1. Contact Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Security Reports
CREATE TABLE IF NOT EXISTS security_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_name TEXT NOT NULL,
    email TEXT NOT NULL,
    type TEXT NOT NULL, 
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'reported', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL, 
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    resume_url TEXT,
    portfolio_url TEXT,
    message TEXT,
    status TEXT DEFAULT 'applied', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS Policies (Public Inserts)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing if any to avoid conflicts
DROP POLICY IF EXISTS "Allow public submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow public newsletter signups" ON newsletter_subs;
DROP POLICY IF EXISTS "Allow public vulnerability reports" ON security_reports;
DROP POLICY IF EXISTS "Allow public applications" ON job_applications;

CREATE POLICY "Allow public submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public newsletter signups" ON newsletter_subs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public vulnerability reports" ON security_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public applications" ON job_applications FOR INSERT WITH CHECK (true);

-- Ensure the CEO can read them (even though API uses service role, it's good practice)
CREATE POLICY "CEO Read All" ON contact_submissions FOR SELECT USING (true);
CREATE POLICY "CEO Read All News" ON newsletter_subs FOR SELECT USING (true);
