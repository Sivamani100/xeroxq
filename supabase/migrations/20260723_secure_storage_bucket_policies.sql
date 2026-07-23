-- ═══════════════════════════════════════════════════════════════════════════════
-- XeroxQ: Storage Bucket RLS Policies Fix
-- ═══════════════════════════════════════════════════════════════════════════════
-- Ensures public/anonymous uploaders can upload, select, update, and delete
-- files in the 'documents' bucket without hitting RLS errors.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow public uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow shop owners to list their document folder" ON storage.objects;

CREATE POLICY "Allow public uploads to documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public select from documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

CREATE POLICY "Allow public update on documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public delete on documents"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'documents');
