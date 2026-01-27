-- ============================================
-- DAYMARK APP SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- PROFILES (Extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,

  -- Skills from profile store
  skills_languages TEXT[] DEFAULT '{}',
  skills_frameworks TEXT[] DEFAULT '{}',
  skills_tools TEXT[] DEFAULT '{}',
  skills_role_types TEXT[] DEFAULT '{}',
  skills_other_keywords TEXT[] DEFAULT '{}',

  -- Resume tracking
  resume_file_name TEXT,
  resume_uploaded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER SETTINGS
-- ============================================
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  jobs_per_day INTEGER DEFAULT 5,
  working_hours_start TEXT DEFAULT '09:00',
  working_hours_end TEXT DEFAULT '17:00',
  auto_shift_enabled BOOLEAN DEFAULT TRUE,
  shift_buffer INTEGER DEFAULT 15,

  -- Job search preferences
  enabled_job_sources TEXT[] DEFAULT ARRAY['simplify-jobs'],
  job_search_query TEXT DEFAULT 'software engineer intern',
  job_search_location TEXT DEFAULT 'USA',
  job_search_employment_type TEXT DEFAULT 'INTERN',
  job_search_remote BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- JOBS (Shared - discovered from external APIs)
-- ============================================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- External identifier for deduplication
  external_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('simplify-jobs', 'jsearch', 'remotive', 'adzuna')),

  -- Job details
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  application_url TEXT NOT NULL,
  date_posted DATE,

  -- Flags
  sponsorship BOOLEAN,
  no_sponsorship BOOLEAN DEFAULT FALSE,
  us_only BOOLEAN DEFAULT FALSE,
  is_sub_entry BOOLEAN DEFAULT FALSE,
  remote BOOLEAN DEFAULT FALSE,

  -- Additional metadata
  salary TEXT,
  description TEXT,
  employment_type TEXT,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique constraint to prevent duplicates
  UNIQUE(source, external_id)
);

-- Indexes for job searches
CREATE INDEX idx_jobs_company ON public.jobs USING gin(company gin_trgm_ops);
CREATE INDEX idx_jobs_role ON public.jobs USING gin(role gin_trgm_ops);
CREATE INDEX idx_jobs_source ON public.jobs(source);
CREATE INDEX idx_jobs_fetched_at ON public.jobs(fetched_at DESC);

-- ============================================
-- USER JOBS (User-specific job data)
-- ============================================
CREATE TABLE public.user_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,

  -- Computed match score (cached)
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  matched_keywords TEXT[] DEFAULT '{}',

  -- User interaction state
  is_seen BOOLEAN DEFAULT FALSE,
  seen_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_user_jobs_user ON public.user_jobs(user_id);
CREATE INDEX idx_user_jobs_match_score ON public.user_jobs(user_id, match_score DESC);

-- ============================================
-- DAILY ASSIGNMENTS
-- ============================================
CREATE TABLE public.daily_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE TABLE public.daily_assignment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.daily_assignments(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,

  -- Status within the daily assignment
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'skipped')),
  skip_reason TEXT,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,

  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assignment_id, job_id)
);

CREATE INDEX idx_daily_assignments_user_date ON public.daily_assignments(user_id, date DESC);
CREATE INDEX idx_daily_assignment_jobs_assignment ON public.daily_assignment_jobs(assignment_id);

-- ============================================
-- APPLICATIONS (Tracked Applications)
-- ============================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,

  -- Application status tracking
  status TEXT NOT NULL DEFAULT 'applied' CHECK (
    status IN ('applied', 'interview', 'offer', 'rejected', 'ghosted', 'withdrawn', 'not_applied')
  ),

  -- Denormalized for quick access
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  application_url TEXT NOT NULL,
  match_score INTEGER,

  -- User tracking
  notes TEXT,
  interview_date DATE,

  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_applications_user ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(user_id, status);
CREATE INDEX idx_applications_date ON public.applications(user_id, applied_at DESC);

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration INTEGER NOT NULL,

  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening')),
  category TEXT NOT NULL CHECK (
    category IN ('job-application', 'work', 'personal', 'health', 'learning', 'other')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in-progress', 'completed', 'skipped')
  ),

  was_auto_shifted BOOLEAN DEFAULT FALSE,
  original_start_time TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_date ON public.tasks(user_id, date);
CREATE INDEX idx_tasks_status ON public.tasks(user_id, status);

-- ============================================
-- FITNESS GOALS
-- ============================================
CREATE TABLE public.fitness_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  target INTEGER NOT NULL,
  unit TEXT NOT NULL,
  icon TEXT,

  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fitness_goals_user ON public.fitness_goals(user_id);

-- ============================================
-- DAILY FITNESS PROGRESS
-- ============================================
CREATE TABLE public.daily_fitness_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.fitness_goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  completed BOOLEAN DEFAULT FALSE,
  value INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, goal_id, date)
);

CREATE INDEX idx_daily_fitness_progress_user_date ON public.daily_fitness_progress(user_id, date);

-- ============================================
-- CALENDAR BUSY SLOTS (Cache)
-- ============================================
CREATE TABLE public.calendar_busy_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,

  google_event_id TEXT,

  cached_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date, slot_start, slot_end)
);

CREATE INDEX idx_calendar_busy_slots_user_date ON public.calendar_busy_slots(user_id, date);

-- ============================================
-- GOOGLE CALENDAR AUTH
-- ============================================
CREATE TABLE public.google_calendar_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  google_email TEXT,
  google_picture TEXT,

  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_assignment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_fitness_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_busy_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_auth ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs: all authenticated users can read jobs (shared resource)
CREATE POLICY "Authenticated users can view jobs" ON public.jobs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (true);

-- User Jobs
CREATE POLICY "Users can manage own user_jobs" ON public.user_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Daily Assignments
CREATE POLICY "Users can manage own assignments" ON public.daily_assignments
  FOR ALL USING (auth.uid() = user_id);

-- Daily Assignment Jobs
CREATE POLICY "Users can manage own assignment jobs" ON public.daily_assignment_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.daily_assignments da
      WHERE da.id = assignment_id AND da.user_id = auth.uid()
    )
  );

-- Applications
CREATE POLICY "Users can manage own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Fitness Goals
CREATE POLICY "Users can manage own fitness goals" ON public.fitness_goals
  FOR ALL USING (auth.uid() = user_id);

-- Daily Fitness Progress
CREATE POLICY "Users can manage own fitness progress" ON public.daily_fitness_progress
  FOR ALL USING (auth.uid() = user_id);

-- Calendar Busy Slots
CREATE POLICY "Users can manage own calendar slots" ON public.calendar_busy_slots
  FOR ALL USING (auth.uid() = user_id);

-- Google Calendar Auth
CREATE POLICY "Users can manage own google auth" ON public.google_calendar_auth
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_jobs_updated_at
  BEFORE UPDATE ON public.user_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_assignments_updated_at
  BEFORE UPDATE ON public.daily_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fitness_goals_updated_at
  BEFORE UPDATE ON public.fitness_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_fitness_progress_updated_at
  BEFORE UPDATE ON public.daily_fitness_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_auth_updated_at
  BEFORE UPDATE ON public.google_calendar_auth
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile and settings on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  -- Create default fitness goals
  INSERT INTO public.fitness_goals (user_id, name, target, unit, is_default, display_order)
  VALUES
    (NEW.id, 'Push-ups', 100, 'reps', true, 0),
    (NEW.id, 'Sit-ups', 100, 'reps', true, 1),
    (NEW.id, 'Run', 10, 'km', true, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to upsert jobs (for job fetching)
CREATE OR REPLACE FUNCTION upsert_job(
  p_external_id TEXT,
  p_source TEXT,
  p_company TEXT,
  p_role TEXT,
  p_location TEXT,
  p_application_url TEXT,
  p_date_posted DATE DEFAULT NULL,
  p_sponsorship BOOLEAN DEFAULT NULL,
  p_no_sponsorship BOOLEAN DEFAULT FALSE,
  p_us_only BOOLEAN DEFAULT FALSE,
  p_is_sub_entry BOOLEAN DEFAULT FALSE,
  p_remote BOOLEAN DEFAULT FALSE,
  p_salary TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_employment_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO public.jobs (
    external_id, source, company, role, location, application_url,
    date_posted, sponsorship, no_sponsorship, us_only, is_sub_entry,
    remote, salary, description, employment_type, fetched_at
  )
  VALUES (
    p_external_id, p_source, p_company, p_role, p_location, p_application_url,
    p_date_posted, p_sponsorship, p_no_sponsorship, p_us_only, p_is_sub_entry,
    p_remote, p_salary, p_description, p_employment_type, NOW()
  )
  ON CONFLICT (source, external_id) DO UPDATE SET
    company = EXCLUDED.company,
    role = EXCLUDED.role,
    location = EXCLUDED.location,
    application_url = EXCLUDED.application_url,
    date_posted = COALESCE(EXCLUDED.date_posted, public.jobs.date_posted),
    sponsorship = COALESCE(EXCLUDED.sponsorship, public.jobs.sponsorship),
    no_sponsorship = EXCLUDED.no_sponsorship,
    us_only = EXCLUDED.us_only,
    is_sub_entry = EXCLUDED.is_sub_entry,
    remote = EXCLUDED.remote,
    salary = COALESCE(EXCLUDED.salary, public.jobs.salary),
    description = COALESCE(EXCLUDED.description, public.jobs.description),
    employment_type = COALESCE(EXCLUDED.employment_type, public.jobs.employment_type),
    fetched_at = NOW()
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
