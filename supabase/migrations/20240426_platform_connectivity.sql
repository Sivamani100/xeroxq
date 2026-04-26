-- Platform Connectivity Migration
-- Created: 2026-04-26

-- 1. Contact Submissions (Landing Page Shop Join)
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

-- 3. Blogs
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'XeroxQ Team',
    image_url TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Partners
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    bio TEXT,
    profile_url TEXT,
    logo_url TEXT,
    type TEXT DEFAULT 'partner', 
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Job Applications
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

-- 6. Platform News
CREATE TABLE IF NOT EXISTS platform_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Security Reports (Bug Bounty)
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

-- 8. Platform Settings (Maintenance Mode)
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO platform_settings (key, value) VALUES ('maintenance_mode', false) ON CONFLICT (key) DO NOTHING;

-- ── 9. RLS POLICIES (Privacy & Integrity) ───────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Anonymous Insert Policies (Public forms)
CREATE POLICY "Allow public submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public newsletter signups" ON newsletter_subs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public applications" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public vulnerability reports" ON security_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public partner applications" ON partners FOR INSERT WITH CHECK (true);

-- Public Select Policies (Read-only access)
CREATE POLICY "Allow public reading of blogs" ON blogs FOR SELECT USING (is_published = true);
CREATE POLICY "Allow public reading of news" ON platform_news FOR SELECT USING (true);
CREATE POLICY "Allow public reading of approved partners" ON partners FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow public reading of settings" ON platform_settings FOR SELECT USING (true);

-- Note: CEO Portal uses the Service Role key via the /api/platform-admin/stats route,
-- which bypasses these RLS policies to allow full administrative control.
