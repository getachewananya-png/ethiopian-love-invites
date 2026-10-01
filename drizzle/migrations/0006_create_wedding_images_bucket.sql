-- Creates the private storage bucket used for wedding photos.
--
-- Migration 0001 added RLS policies scoped to bucket_id = 'wedding-images',
-- but never created the bucket itself -- so every upload failed with
-- "Bucket not found".
--
-- The bucket is PRIVATE (public = false) on purpose: the app stores photos with
-- the service role and hands out `createSignedUrl` links valid for a year
-- (see uploadWeddingImage in src/lib/invitations.functions.ts). A public bucket
-- would make those signed URLs pointless and expose every guest photo.
--
-- ON CONFLICT keeps this re-runnable. The UPLOAD policy from 0001 already
-- restricts paths to the uploads/ prefix and to image extensions.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wedding-images',
  'wedding-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 0001 also granted INSERT to `anon` on this bucket. That was written when the
-- bucket did not exist, and the app never needs it: uploads go through the
-- service-role client, which bypasses RLS entirely. Left in place it would let
-- anyone who can reach the site push files into your bucket.
DROP POLICY IF EXISTS "Wedding images can be uploaded anonymously" ON storage.objects;