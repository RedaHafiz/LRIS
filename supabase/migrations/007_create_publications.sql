-- Create publications table
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  journal TEXT,
  year INTEGER,
  doi TEXT,
  url TEXT,
  abstract TEXT,
  keywords TEXT[],
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create publication_comments table
CREATE TABLE IF NOT EXISTS public.publication_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publication_id UUID REFERENCES public.publications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_publications_added_by ON public.publications(added_by);
CREATE INDEX IF NOT EXISTS idx_publications_year ON public.publications(year);
CREATE INDEX IF NOT EXISTS idx_publication_comments_publication_id ON public.publication_comments(publication_id);
CREATE INDEX IF NOT EXISTS idx_publication_comments_user_id ON public.publication_comments(user_id);

-- Add updated_at trigger to publications
CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger to publication_comments
CREATE TRIGGER update_publication_comments_updated_at
  BEFORE UPDATE ON public.publication_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_comments ENABLE ROW LEVEL SECURITY;

-- Publications policies (everyone can view)
CREATE POLICY "Anyone can view publications"
  ON public.publications FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add publications"
  ON public.publications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own publications"
  ON public.publications FOR UPDATE
  USING (auth.uid() = added_by);

CREATE POLICY "Users can delete their own publications"
  ON public.publications FOR DELETE
  USING (auth.uid() = added_by);

-- Publication comments policies
CREATE POLICY "Anyone can view publication comments"
  ON public.publication_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON public.publication_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
  ON public.publication_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.publication_comments FOR DELETE
  USING (auth.uid() = user_id);
