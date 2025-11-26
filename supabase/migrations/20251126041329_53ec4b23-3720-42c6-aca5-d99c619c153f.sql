-- Create profiles table with interview credits
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  credits INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create job_roles table
CREATE TABLE public.job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for job_roles (public read access)
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job roles"
  ON public.job_roles FOR SELECT
  USING (true);

-- Create custom_job_descriptions table
CREATE TABLE public.custom_job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.custom_job_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job descriptions"
  ON public.custom_job_descriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job descriptions"
  ON public.custom_job_descriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job descriptions"
  ON public.custom_job_descriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job descriptions"
  ON public.custom_job_descriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_role_id UUID REFERENCES public.job_roles(id) ON DELETE SET NULL,
  custom_job_id UUID REFERENCES public.custom_job_descriptions(id) ON DELETE SET NULL,
  resume_score INTEGER,
  resume_feedback TEXT,
  interview_score INTEGER,
  interview_feedback TEXT,
  transcript TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'resume_uploaded', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview sessions"
  ON public.interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview sessions"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions"
  ON public.interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default job roles
INSERT INTO public.job_roles (title, description, category, requirements, skills, icon) VALUES
('Frontend Developer', 'Build responsive and interactive user interfaces using modern frameworks and best practices.', 'Engineering', ARRAY['3+ years experience with React/Vue/Angular', 'Strong HTML, CSS, JavaScript skills', 'Experience with state management', 'Knowledge of web accessibility'], ARRAY['React', 'TypeScript', 'CSS', 'JavaScript', 'Responsive Design'], '💻'),
('Backend Developer', 'Design and implement scalable server-side applications and APIs.', 'Engineering', ARRAY['3+ years backend development experience', 'Proficiency in Node.js/Python/Java', 'Database design expertise', 'RESTful API development'], ARRAY['Node.js', 'Python', 'SQL', 'APIs', 'System Design'], '⚙️'),
('Full Stack Developer', 'Work on both frontend and backend to deliver complete solutions.', 'Engineering', ARRAY['Experience with full stack development', 'Frontend and backend proficiency', 'Database management', 'DevOps knowledge'], ARRAY['React', 'Node.js', 'Databases', 'APIs', 'Cloud Services'], '🚀'),
('DevOps Engineer', 'Build and maintain CI/CD pipelines and infrastructure automation.', 'Engineering', ARRAY['Experience with CI/CD tools', 'Cloud platform expertise (AWS/Azure/GCP)', 'Container orchestration', 'Infrastructure as Code'], ARRAY['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins'], '🔧'),
('Product Manager', 'Define product strategy and work with cross-functional teams to deliver value.', 'Product', ARRAY['3+ years product management experience', 'Strong analytical skills', 'Excellent communication', 'User research experience'], ARRAY['Product Strategy', 'Roadmapping', 'User Research', 'Data Analysis', 'Stakeholder Management'], '📊'),
('UX/UI Designer', 'Create intuitive and beautiful user experiences through research and design.', 'Design', ARRAY['Portfolio demonstrating UX/UI work', 'Proficiency in design tools', 'User research experience', 'Understanding of design systems'], ARRAY['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Interaction Design'], '🎨');

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Storage policies for resumes
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );