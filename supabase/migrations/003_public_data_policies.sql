-- Update taxa policies to allow public read access
-- Taxa should be readable by all authenticated users since it's reference data

DROP POLICY IF EXISTS "Authenticated users can view taxa" ON public.taxa;

CREATE POLICY "All authenticated users can view taxa"
  ON public.taxa FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Update assessments policies to allow viewing all assessments
-- This allows users to browse existing threat assessments in the database

DROP POLICY IF EXISTS "Users can view assessments in their projects" ON public.assessments;

CREATE POLICY "All authenticated users can view all assessments"
  ON public.assessments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Keep the existing insert/update/delete policies for assessments
-- Users can only modify assessments in projects they have edit access to

-- Note: The existing INSERT, UPDATE, and DELETE policies remain unchanged
-- Users can still only create/edit/delete assessments in their own projects
