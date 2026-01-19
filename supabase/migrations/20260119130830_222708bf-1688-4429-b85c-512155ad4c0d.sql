-- Create storage bucket for client observations images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'observations', 
  'observations', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for observations bucket
CREATE POLICY "Admins can upload observation images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'observations' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view all observation images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'observations' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete observation images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'observations' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Clients can view their observation images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'observations' AND
  EXISTS (
    SELECT 1 FROM client_observations co
    JOIN clients c ON c.id = co.client_id
    WHERE 
      co.image_url LIKE '%' || storage.objects.name 
      AND c.user_id = auth.uid()
      AND (co.metadata->>'is_private')::boolean IS NOT TRUE
  )
);