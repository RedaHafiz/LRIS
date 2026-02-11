-- Run this in your Supabase SQL Editor
-- Creates draft_assessments table to store drafts before approval

CREATE TABLE IF NOT EXISTS public.draft_assessments (
  draft_id TEXT PRIMARY KEY,
  "LR_Name" TEXT,
  "Crop" TEXT,
  "LR_Threat_Assessor" TEXT,
  "Assess_Date" DATE,
  
  -- All subcriteria scores
  "Subcriteria_Scores_A1.1" TEXT,
  "Subcriteria_Scores_A1.2" TEXT,
  "Subcriteria_Scores_A2.1" TEXT,
  "Subcriteria_Scores_A2.2" TEXT,
  "Subcriteria_Scores_A3.1" TEXT,
  "Subcriteria_Scores_A3.2" TEXT,
  "Subcriteria_Scores_B1.1" TEXT,
  "Subcriteria_Scores_B1.2" TEXT,
  "Subcriteria_Scores_B2.1" TEXT,
  "Subcriteria_Scores_B2.2" TEXT,
  "Subcriteria_Scores_C1.1" TEXT,
  "Subcriteria_Scores_C1.2" TEXT,
  "Subcriteria_Scores_C2.1" TEXT,
  "Subcriteria_Scores_C2.2" TEXT,
  "Subcriteria_Scores_D" TEXT,
  "Subcriteria_Scores_E" TEXT,
  
  -- Threat scores
  "Threat_Scores" NUMERIC,
  "Threat_Max_Score" NUMERIC,
  "Threat_Risk_%" NUMERIC,
  "Threat_Category" TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'pending_review', 'returned')) DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Fix assessment_assignments to work with draft_id (TEXT)
ALTER TABLE public.assessment_assignments 
DROP CONSTRAINT IF EXISTS assessment_assignments_assessment_id_fkey;

ALTER TABLE public.assessment_assignments 
ALTER COLUMN assessment_id TYPE TEXT;

-- Add constraint to allow referencing both drafts and approved assessments
-- We'll handle this in application logic

-- Fix assessment_taxa
ALTER TABLE public.assessment_taxa 
DROP CONSTRAINT IF EXISTS assessment_taxa_assessment_id_fkey;

ALTER TABLE public.assessment_taxa 
ALTER COLUMN assessment_id TYPE TEXT;

-- Fix assessment_comments
ALTER TABLE public.assessment_comments 
DROP CONSTRAINT IF EXISTS assessment_comments_assessment_id_fkey;

ALTER TABLE public.assessment_comments 
ALTER COLUMN assessment_id TYPE TEXT;

-- Enable RLS on draft_assessments
ALTER TABLE public.draft_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for draft_assessments
CREATE POLICY "Users can view their assigned drafts"
  ON public.draft_assessments FOR SELECT
  USING (
    draft_id IN (
      SELECT assessment_id FROM public.assessment_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create drafts"
  ON public.draft_assessments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their assigned drafts"
  ON public.draft_assessments FOR UPDATE
  USING (
    draft_id IN (
      SELECT assessment_id FROM public.assessment_assignments 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Assessors can delete their drafts"
  ON public.draft_assessments FOR DELETE
  USING (
    draft_id IN (
      SELECT assessment_id FROM public.assessment_assignments 
      WHERE user_id = auth.uid() AND role = 'assessor'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_draft_assessments_status ON public.draft_assessments(status);
CREATE INDEX IF NOT EXISTS idx_draft_assessments_draft_id ON public.draft_assessments(draft_id);

-- Trigger for updated_at
CREATE TRIGGER update_draft_assessments_updated_at
  BEFORE UPDATE ON public.draft_assessments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
