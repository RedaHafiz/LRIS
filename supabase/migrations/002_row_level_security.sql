-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_taxa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view projects they belong to"
  ON public.projects FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users WHERE project_id = projects.id
    )
  );

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project admins can update projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = projects.id AND role = 'working_set_admin'
    )
  );

CREATE POLICY "Project admins can delete projects"
  ON public.projects FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = projects.id AND role = 'working_set_admin'
    )
  );

-- Project users policies
CREATE POLICY "Users can view project members of their projects"
  ON public.project_users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users pu WHERE pu.project_id = project_users.project_id
    )
  );

CREATE POLICY "Project admins can add users to projects"
  ON public.project_users FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = project_users.project_id AND role = 'working_set_admin'
    )
  );

CREATE POLICY "Project admins can update user roles"
  ON public.project_users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users pu
      WHERE pu.project_id = project_users.project_id AND pu.role = 'working_set_admin'
    )
  );

CREATE POLICY "Project admins can remove users"
  ON public.project_users FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users pu
      WHERE pu.project_id = project_users.project_id AND pu.role = 'working_set_admin'
    )
  );

-- Assessments policies
CREATE POLICY "Users can view assessments in their projects"
  ON public.assessments FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users WHERE project_id = assessments.project_id
    )
  );

CREATE POLICY "Project members with edit permission can create assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = assessments.project_id 
      AND role IN ('working_set_admin', 'edit_assessments')
    )
  );

CREATE POLICY "Project members with edit permission can update assessments"
  ON public.assessments FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = assessments.project_id 
      AND role IN ('working_set_admin', 'edit_assessments')
    )
  );

CREATE POLICY "Project admins can delete assessments"
  ON public.assessments FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = assessments.project_id AND role = 'working_set_admin'
    )
  );

-- Assessment assignments policies
CREATE POLICY "Users can view assessment assignments in their projects"
  ON public.assessment_assignments FOR SELECT
  USING (
    auth.uid() IN (
      SELECT pu.user_id FROM public.project_users pu
      JOIN public.assessments a ON a.project_id = pu.project_id
      WHERE a.id = assessment_assignments.assessment_id
    )
  );

CREATE POLICY "Project members with edit permission can assign users"
  ON public.assessment_assignments FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT pu.user_id FROM public.project_users pu
      JOIN public.assessments a ON a.project_id = pu.project_id
      WHERE a.id = assessment_assignments.assessment_id 
      AND pu.role IN ('working_set_admin', 'edit_assessments')
    )
  );

CREATE POLICY "Project members with edit permission can update assignments"
  ON public.assessment_assignments FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT pu.user_id FROM public.project_users pu
      JOIN public.assessments a ON a.project_id = pu.project_id
      WHERE a.id = assessment_assignments.assessment_id 
      AND pu.role IN ('working_set_admin', 'edit_assessments')
    )
  );

CREATE POLICY "Project members with edit permission can remove assignments"
  ON public.assessment_assignments FOR DELETE
  USING (
    auth.uid() IN (
      SELECT pu.user_id FROM public.project_users pu
      JOIN public.assessments a ON a.project_id = pu.project_id
      WHERE a.id = assessment_assignments.assessment_id 
      AND pu.role IN ('working_set_admin', 'edit_assessments')
    )
  );

-- Taxa policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view taxa"
  ON public.taxa FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create taxa"
  ON public.taxa FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Assessment taxa policies
CREATE POLICY "Users can view assessment taxa for their projects"
  ON public.assessment_taxa FOR SELECT
  USING (
    auth.uid() IN (
      SELECT pu.user_id FROM public.project_users pu
      JOIN public.assessments a ON a.project_id = pu.project_id
      WHERE a.id = assessment_taxa.assessment_id
    )
  );

CREATE POLICY "Project members with edit permission can add taxa to assessments"
  ON public.assessment_taxa FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT pu.user_id FROM public.project_users pu
      JOIN public.assessments a ON a.project_id = pu.project_id
      WHERE a.id = assessment_taxa.assessment_id 
      AND pu.role IN ('working_set_admin', 'edit_assessments')
    )
  );

CREATE POLICY "Project members with edit permission can remove taxa from assessments"
  ON public.assessment_taxa FOR DELETE
  USING (
    auth.uid() IN (
      SELECT pu.user_id FROM public.project_users pu
      JOIN public.assessments a ON a.project_id = pu.project_id
      WHERE a.id = assessment_taxa.assessment_id 
      AND pu.role IN ('working_set_admin', 'edit_assessments')
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
