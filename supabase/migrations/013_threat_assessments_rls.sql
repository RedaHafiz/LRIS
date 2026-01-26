-- Enable Row Level Security on Threat Assessments table
ALTER TABLE public."Threat Assessments" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all threat assessments
-- This allows browsing the threat assessment database
CREATE POLICY "All authenticated users can view threat assessments"
  ON public."Threat Assessments" FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create threat assessments
CREATE POLICY "Authenticated users can create threat assessments"
  ON public."Threat Assessments" FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own threat assessments (based on LR_Threat_Assessor field)
-- Note: This is a simplified policy - adjust based on your needs
CREATE POLICY "Users can update threat assessments"
  ON public."Threat Assessments" FOR UPDATE
  TO authenticated
  USING (true);

-- Users can delete threat assessments
-- Note: Consider restricting this to admins or creators only
CREATE POLICY "Users can delete threat assessments"
  ON public."Threat Assessments" FOR DELETE
  TO authenticated
  USING (true);
