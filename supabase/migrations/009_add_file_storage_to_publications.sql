-- Add file storage fields to publications table
ALTER TABLE public.publications 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create storage bucket for publications (run this in Supabase dashboard SQL editor if needed)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('publications', 'publications', true);

-- Enable public access to publications bucket
-- CREATE POLICY "Public Access"
-- ON storage.objects FOR SELECT
-- USING ( bucket_id = 'publications' );

-- CREATE POLICY "Authenticated users can upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'publications' AND auth.role() = 'authenticated' );
