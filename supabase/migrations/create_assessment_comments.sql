-- Create assessment_comments table
CREATE TABLE IF NOT EXISTS public.assessment_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS for now
ALTER TABLE public.assessment_comments DISABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assessment_comments_assessment_id ON public.assessment_comments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_comments_user_id ON public.assessment_comments(user_id);
