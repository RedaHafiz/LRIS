-- Add status and review fields to Threat Assessments table
ALTER TABLE public."Threat Assessments" 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'pending_review', 'returned', 'approved')) DEFAULT 'draft';

ALTER TABLE public."Threat Assessments"
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."Threat Assessments"
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public."Threat Assessments"
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Create comments table for assessment reviews
CREATE TABLE IF NOT EXISTS public.assessment_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (assessment_id) REFERENCES public."Threat Assessments"(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_assessment_comments_assessment_id ON public.assessment_comments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_comments_user_id ON public.assessment_comments(user_id);

-- Enable RLS on comments table
ALTER TABLE public.assessment_comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Users can view comments on assessments they have access to"
  ON public.assessment_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_assignments 
      WHERE assessment_id = assessment_comments.assessment_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can add comments"
  ON public.assessment_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_assignments 
      WHERE assessment_id = assessment_comments.assessment_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.assessment_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.assessment_comments FOR DELETE
  USING (auth.uid() = user_id);
