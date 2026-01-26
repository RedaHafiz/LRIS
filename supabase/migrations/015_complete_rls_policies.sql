-- ============================================
-- COMPLETE RLS POLICIES FOR ALL TABLES
-- Run this to secure the entire database
-- ============================================

-- First, enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_taxa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Threat Assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Taxa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Passport Data" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- PROJECTS POLICIES
-- ============================================
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

-- ============================================
-- PROJECT_USERS POLICIES
-- ============================================
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

-- ============================================
-- THREAT ASSESSMENTS POLICIES
-- ============================================
CREATE POLICY "All authenticated users can view threat assessments"
  ON public."Threat Assessments" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create threat assessments"
  ON public."Threat Assessments" FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update threat assessments"
  ON public."Threat Assessments" FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete threat assessments"
  ON public."Threat Assessments" FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- TAXA (CROP TAXONOMY) POLICIES
-- ============================================
CREATE POLICY "All authenticated users can view crop taxonomy"
  ON public."Taxa" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add crop taxonomy"
  ON public."Taxa" FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update crop taxonomy"
  ON public."Taxa" FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- PASSPORT DATA POLICIES (PUBLIC)
-- ============================================
CREATE POLICY "Public read access to passport data"
  ON public."Passport Data"
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert passport data"
  ON public."Passport Data"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update passport data"
  ON public."Passport Data"
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete passport data"
  ON public."Passport Data"
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
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

-- ============================================
-- PUBLICATIONS POLICIES
-- ============================================
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

-- ============================================
-- PUBLICATION_COMMENTS POLICIES
-- ============================================
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

-- ============================================
-- ASSESSMENT_ASSIGNMENTS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view assessment assignments"
  ON public.assessment_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create assignments"
  ON public.assessment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments"
  ON public.assessment_assignments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete assignments"
  ON public.assessment_assignments FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- ASSESSMENT_TAXA POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view assessment taxa"
  ON public.assessment_taxa FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add taxa to assessments"
  ON public.assessment_taxa FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can remove taxa from assessments"
  ON public.assessment_taxa FOR DELETE
  TO authenticated
  USING (true);
