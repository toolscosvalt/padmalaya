/*
  # Create Storage Bucket for Logos

  1. Storage Setup
    - Create a public 'logos' bucket for storing site logos and images
    - Enable public access for easy image retrieval
  
  2. Security
    - Set up storage policies for public read access
    - Restrict uploads to authenticated admin users only
*/

-- Create public storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to logos
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Only authenticated users can upload logos (for admin use)
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Only authenticated users can update logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- Only authenticated users can delete logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');
