CREATE POLICY "Wedding images can be uploaded anonymously"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'wedding-images'
  AND (storage.foldername(name))[1] = 'uploads'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);
CREATE POLICY "Wedding image owners can remove uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'wedding-images' AND (storage.foldername(name))[1] = 'uploads');