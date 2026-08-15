/*
# TECH — Avatars storage bucket policies

## Summary
Adds RLS policies to the storage.objects table for the 'avatars' bucket:
- Authenticated users can upload their own avatar (path starts with their user ID)
- Public read access for avatars (profile photos are public)
*/

DROP POLICY IF EXISTS "avatar_upload_own" ON storage.objects;
CREATE POLICY "avatar_upload_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
CREATE POLICY "avatar_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatar_read_public" ON storage.objects;
CREATE POLICY "avatar_read_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'avatars');
