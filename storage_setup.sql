-- ==============================================================================
-- KONDAGAON NODAL INSPECTION - SUPABASE STORAGE BUCKET SETUP
-- यह SQL Supabase SQL Editor में चलाएं ताकि फोटो Supabase Storage में पूरी तरह स्टोर हों
-- ==============================================================================

-- 1. Create public storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies if any to avoid conflict
DROP POLICY IF EXISTS "Allow public read inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete inspection-photos" ON storage.objects;

-- 3. Create RLS policies allowing upload and download
CREATE POLICY "Allow public read inspection-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-photos');

CREATE POLICY "Allow public upload inspection-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inspection-photos');

CREATE POLICY "Allow public update inspection-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inspection-photos');

CREATE POLICY "Allow public delete inspection-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'inspection-photos');
