-- Add role column to assessment_assignments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessment_assignments' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.assessment_assignments 
    ADD COLUMN role TEXT CHECK (role IN ('assessor', 'co-assessor', 'reviewer', 'spectator')) DEFAULT 'co-assessor';
  END IF;
END $$;

-- Update existing constraint to include spectator role
ALTER TABLE public.assessment_assignments 
DROP CONSTRAINT IF EXISTS assessment_assignments_role_check;

ALTER TABLE public.assessment_assignments
ADD CONSTRAINT assessment_assignments_role_check 
CHECK (role IN ('assessor', 'co-assessor', 'reviewer', 'spectator'));

-- Update project_users constraint to include spectator role
ALTER TABLE public.project_users 
DROP CONSTRAINT IF EXISTS project_users_role_check;

ALTER TABLE public.project_users
ADD CONSTRAINT project_users_role_check 
CHECK (role IN ('assessor', 'co-assessor', 'reviewer', 'spectator'));

-- Update RLS policies for assessment_assignments to respect roles
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view assessments they're assigned to" ON public.assessment_assignments;
DROP POLICY IF EXISTS "Users with edit permission can update assessments" ON public.assessment_assignments;

-- Recreate policies
CREATE POLICY "Users can view assessments they're assigned to"
  ON public.assessment_assignments FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Assessors can add team members"
  ON public.assessment_assignments FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.assessment_assignments 
      WHERE assessment_id = assessment_assignments.assessment_id 
      AND role IN ('assessor', 'co-assessor')
    )
  );

CREATE POLICY "Assessors can update team members"
  ON public.assessment_assignments FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.assessment_assignments aa
      WHERE aa.assessment_id = assessment_assignments.assessment_id 
      AND aa.role IN ('assessor', 'co-assessor')
    )
  );

CREATE POLICY "Assessors can remove team members"
  ON public.assessment_assignments FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.assessment_assignments aa
      WHERE aa.assessment_id = assessment_assignments.assessment_id 
      AND aa.role IN ('assessor', 'co-assessor')
    )
  );
