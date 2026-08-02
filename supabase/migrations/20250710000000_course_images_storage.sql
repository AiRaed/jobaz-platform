-- Course thumbnail images (Supabase Storage bucket + admin policies)
-- Uses existing courses.image_url column — no new table column required.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "course_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "course_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "course_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "course_images_admin_delete" ON storage.objects;

CREATE POLICY "course_images_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'course-images');

CREATE POLICY "course_images_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-images' AND public.is_jobaz_admin());

CREATE POLICY "course_images_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-images' AND public.is_jobaz_admin())
  WITH CHECK (bucket_id = 'course-images' AND public.is_jobaz_admin());

CREATE POLICY "course_images_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-images' AND public.is_jobaz_admin());

NOTIFY pgrst, 'reload schema';
