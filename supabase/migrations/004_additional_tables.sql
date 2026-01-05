-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_zone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table (working sets)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_users table (project membership with roles)
CREATE TABLE IF NOT EXISTS public.project_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('assessor', 'co-assessor', 'reviewer')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create assessment_taxa table (links assessments to taxonomy)
-- Note: References "Threat Assessments" and "Taxa" tables
CREATE TABLE IF NOT EXISTS public.assessment_taxa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  taxa_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, taxa_id),
  FOREIGN KEY (assessment_id) REFERENCES public."Threat Assessments"(id) ON DELETE CASCADE,
  FOREIGN KEY (taxa_id) REFERENCES public."Taxa"(id) ON DELETE CASCADE
);

-- Create assessment_assignments table (multiple users per assessment)
CREATE TABLE IF NOT EXISTS public.assessment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT CHECK (permission IN ('edit', 'read_only')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, user_id),
  FOREIGN KEY (assessment_id) REFERENCES public."Threat Assessments"(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON public.project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON public.project_users(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_taxa_assessment_id ON public.assessment_taxa(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_taxa_taxa_id ON public.assessment_taxa(taxa_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_assessment_id ON public.assessment_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_user_id ON public.assessment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, time_zone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'time_zone', 'UTC')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_taxa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Assessors can update projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = projects.id AND role = 'assessor'
    )
  );

CREATE POLICY "Assessors can delete projects"
  ON public.projects FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = projects.id AND role = 'assessor'
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

CREATE POLICY "Assessors can add users to projects"
  ON public.project_users FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.project_users 
      WHERE project_id = project_users.project_id AND role = 'assessor'
    )
  );

CREATE POLICY "Assessors can update user roles"
  ON public.project_users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users pu
      WHERE pu.project_id = project_users.project_id AND pu.role = 'assessor'
    )
  );

CREATE POLICY "Assessors can remove users"
  ON public.project_users FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_users pu
      WHERE pu.project_id = project_users.project_id AND pu.role = 'assessor'
    )
  );

-- Assessment taxa policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view assessment taxa"
  ON public.assessment_taxa FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create assessment taxa"
  ON public.assessment_taxa FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Assessment assignments policies
CREATE POLICY "Authenticated users can view assessment assignments"
  ON public.assessment_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create assessment assignments"
  ON public.assessment_assignments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
