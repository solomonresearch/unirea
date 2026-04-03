-- Create private feedback-screenshots bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback',
  'feedback',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload screenshots only into their own folder (feedback/{userId}/...)
CREATE POLICY "Users can upload own feedback screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can read feedback screenshots (needed to generate signed URLs client-side)
CREATE POLICY "Admins can read feedback screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'feedback'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
