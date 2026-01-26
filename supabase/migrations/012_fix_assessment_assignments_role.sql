-- Change assessment_assignments from permission to role
ALTER TABLE public.assessment_assignments 
DROP CONSTRAINT IF EXISTS assessment_assignments_permission_check;

ALTER TABLE public.assessment_assignments 
RENAME COLUMN permission TO role;

ALTER TABLE public.assessment_assignments 
ADD CONSTRAINT assessment_assignments_role_check 
CHECK (role IN ('assessor', 'reviewer'));
