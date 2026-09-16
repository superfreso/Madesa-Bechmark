/*
# Add variable_fields to payment_methods and create competitor-logos storage bucket

1. Changes to payment_methods
- Add `variable_fields` jsonb column (defaults to '[]') to store which numeric fields
  are marked as "Variable/Análisis" instead of a fixed number.

2. Storage
- Create `competitor-logos` bucket (public) for competitor logo image uploads.
- Add storage policies allowing public read and anon/authenticated write/delete.

3. Security
- Storage policies for the new bucket (public read, anon+authenticated CRUD).
*/

ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS variable_fields jsonb DEFAULT '[]';

INSERT INTO storage.buckets (id, name, public)
VALUES ('competitor-logos', 'competitor-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read competitor logos" ON storage.objects;
CREATE POLICY "Public read competitor logos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'competitor-logos');

DROP POLICY IF EXISTS "Anon can upload competitor logos" ON storage.objects;
CREATE POLICY "Anon can upload competitor logos" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'competitor-logos');

DROP POLICY IF EXISTS "Anon can update competitor logos" ON storage.objects;
CREATE POLICY "Anon can update competitor logos" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'competitor-logos');

DROP POLICY IF EXISTS "Anon can delete competitor logos" ON storage.objects;
CREATE POLICY "Anon can delete competitor logos" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'competitor-logos');
