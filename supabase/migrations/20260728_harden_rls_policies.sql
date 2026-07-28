-- ═══════════════════════════════════════════════════════════════════════════════
-- XeroxQ: RLS Security Hardening & Data Isolation Migration
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fixes critical vulnerabilities:
-- 1. Restricts jobs SELECT access to shop owners and authenticated customer sessions.
-- 2. Restricts administrative tables (contact_submissions, newsletter_subs, security_reports, job_applications) SELECT access.
-- 3. Hardens storage.objects RLS on 'documents' bucket.
-- 4. Restricts whatsapp_sessions RLS to authenticated/service-role handlers.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. JOBS TABLE POLICIES ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Jobs Access Policy" ON public.jobs;
DROP POLICY IF EXISTS "Shop owner view jobs" ON public.jobs;

-- Allow shop owners to view jobs belonging to their shops
CREATE POLICY "Shop owner view jobs" ON public.jobs FOR SELECT
USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
);

-- Allow public job insertion (for customer upload flow)
DROP POLICY IF EXISTS "Allow job submissions" ON public.jobs;
CREATE POLICY "Allow job submissions" ON public.jobs FOR INSERT WITH CHECK (true);

-- ── 2. ADMIN & SENSITIVE FORM TABLES POLICIES ───────────────────────────────

-- Contact Submissions
DROP POLICY IF EXISTS "CEO Read All Contact Submissions" ON public.contact_submissions;
CREATE POLICY "CEO Read All Contact Submissions" ON public.contact_submissions FOR SELECT
USING (
    auth.role() = 'service_role' OR 
    (auth.uid() IS NOT NULL AND auth.email() = (SELECT value->>'email' FROM public.platform_settings WHERE key = 'ceo_email'))
);

-- Newsletter Subs
DROP POLICY IF EXISTS "CEO Read All Newsletter Subs" ON public.newsletter_subs;
CREATE POLICY "CEO Read All Newsletter Subs" ON public.newsletter_subs FOR SELECT
USING (
    auth.role() = 'service_role' OR 
    (auth.uid() IS NOT NULL AND auth.email() = (SELECT value->>'email' FROM public.platform_settings WHERE key = 'ceo_email'))
);

-- Security Reports (Bug Bounty)
DROP POLICY IF EXISTS "CEO can view security reports" ON public.security_reports;
CREATE POLICY "CEO can view security reports" ON public.security_reports FOR SELECT
USING (
    auth.role() = 'service_role' OR 
    (auth.uid() IS NOT NULL AND auth.email() = (SELECT value->>'email' FROM public.platform_settings WHERE key = 'ceo_email'))
);

-- Job Applications
DROP POLICY IF EXISTS "CEO Read Job Applications" ON public.job_applications;
CREATE POLICY "CEO Read Job Applications" ON public.job_applications FOR SELECT
USING (
    auth.role() = 'service_role' OR 
    (auth.uid() IS NOT NULL AND auth.email() = (SELECT value->>'email' FROM public.platform_settings WHERE key = 'ceo_email'))
);

-- ── 3. WHATSAPP SESSIONS POLICY ──────────────────────────────────────────────

DROP POLICY IF EXISTS "WhatsApp sessions policy" ON public.whatsapp_sessions;
CREATE POLICY "WhatsApp sessions service role policy" ON public.whatsapp_sessions FOR ALL
USING (auth.role() = 'service_role');

-- ── 4. STORAGE BUCKET SECURITY POLICIES ─────────────────────────────────────

DROP POLICY IF EXISTS "Allow public uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on documents" ON storage.objects;

-- Allow public upload (customers submitting print documents)
CREATE POLICY "Allow public uploads to documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

-- Allow read access only to shop owners and service role
CREATE POLICY "Allow shop owners and service role read documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' AND (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
        ))
    )
);

-- Allow delete access only to service role (janitor/cleanup) and shop owners
CREATE POLICY "Allow shop owners and service role delete documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents' AND (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
        ))
    )
);
