-- Create draft_assessments table for assessments that haven't been approved yet
CREATE TABLE IF NOT EXISTS public.draft_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id TEXT UNIQUE NOT NULL,
  lr_name TEXT NOT NULL,
  crop TEXT NOT NULL,
  lr_threat_assessor TEXT,
  assess_date DATE,
  
  -- Subcriteria scores (A1.1 through E)
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
  
  -- Threat scoring results
  threat_scores NUMERIC,
  threat_max_score NUMERIC,
  threat_risk_percent NUMERIC,
  threat_category TEXT,
  
  -- Status and workflow
  status TEXT CHECK (status IN ('draft', 'pending_review', 'returned')) DEFAULT 'draft',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Create draft_assignments table (similar to assessment_assignments but for drafts)
CREATE TABLE IF NOT EXISTS public.draft_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id TEXT NOT NULL REFERENCES public.draft_assessments(draft_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('assessor', 'co-assessor', 'reviewer')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(draft_id, user_id)
);

-- Create draft_taxa table (link drafts to taxonomy)
CREATE TABLE IF NOT EXISTS public.draft_taxa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id TEXT NOT NULL REFERENCES public.draft_assessments(draft_id) ON DELETE CASCADE,
  taxa_id UUID NOT NULL REFERENCES public."Taxa"(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(draft_id, taxa_id)
);

-- Create draft_comments table
CREATE TABLE IF NOT EXISTS public.draft_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id TEXT NOT NULL REFERENCES public.draft_assessments(draft_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_draft_assessments_draft_id ON public.draft_assessments(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_assessments_status ON public.draft_assessments(status);
CREATE INDEX IF NOT EXISTS idx_draft_assignments_draft_id ON public.draft_assignments(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_assignments_user_id ON public.draft_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_taxa_draft_id ON public.draft_taxa(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_comments_draft_id ON public.draft_comments(draft_id);

-- Enable RLS
ALTER TABLE public.draft_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_taxa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for draft_assessments
CREATE POLICY "Users can view drafts they're assigned to"
  ON public.draft_assessments FOR SELECT
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create drafts"
  ON public.draft_assessments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Assessors can update their drafts"
  ON public.draft_assessments FOR UPDATE
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments 
      WHERE user_id = auth.uid() AND role IN ('assessor', 'co-assessor')
    )
  );

CREATE POLICY "Assessors can delete their drafts"
  ON public.draft_assessments FOR DELETE
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments 
      WHERE user_id = auth.uid() AND role = 'assessor'
    )
  );

-- RLS Policies for draft_assignments
CREATE POLICY "Users can view assignments for their drafts"
  ON public.draft_assignments FOR SELECT
  USING (
    user_id = auth.uid() OR
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create draft assignments"
  ON public.draft_assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Assessors can update draft assignments"
  ON public.draft_assignments FOR UPDATE
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments 
      WHERE user_id = auth.uid() AND role = 'assessor'
    )
  );

CREATE POLICY "Assessors can delete draft assignments"
  ON public.draft_assignments FOR DELETE
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments 
      WHERE user_id = auth.uid() AND role = 'assessor'
    )
  );

-- RLS Policies for draft_taxa
CREATE POLICY "Users can view taxa links for their drafts"
  ON public.draft_taxa FOR SELECT
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create taxa links"
  ON public.draft_taxa FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Assessors can delete taxa links"
  ON public.draft_taxa FOR DELETE
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments 
      WHERE user_id = auth.uid() AND role IN ('assessor', 'co-assessor')
    )
  );

-- RLS Policies for draft_comments
CREATE POLICY "Users can view comments for their drafts"
  ON public.draft_comments FOR SELECT
  USING (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on their assigned drafts"
  ON public.draft_comments FOR INSERT
  WITH CHECK (
    draft_id IN (
      SELECT draft_id FROM public.draft_assignments WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_draft_assessments_updated_at
  BEFORE UPDATE ON public.draft_assessments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
