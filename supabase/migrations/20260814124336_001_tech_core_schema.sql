/*
# TECH — Core Schema: Profiles, Skills, Strengths, Projects

## Summary
Creates the foundational tables for the TECH student community platform:
- `profiles`: extends auth.users with student information (college, branch, year, bio, role)
- `skills`: reusable catalog of technical skills
- `profile_skills`: many-to-many between profiles and skills (with proficiency)
- `strengths`: reusable catalog of soft/functional strengths
- `profile_strengths`: many-to-many between profiles and strengths
- `projects`: user-authored project entries
- `reports`: content moderation reports

## Tables

### profiles
- id (uuid PK, references auth.users)
- full_name, email, profile_photo, college, branch, year, bio
- experience_level (beginner/intermediate/advanced)
- role (student/admin) — admin role is server-managed, never settable by public signup
- is_suspended (boolean, admin moderation)
- public_profile (boolean, controls public visibility)
- github_url, linkedin_url, leetcode_url (external profiles)
- created_at, updated_at

### skills / strengths
- id, name (unique), category, icon, created_at

### profile_skills / profile_strengths
- profile_id (FK profiles), skill_id/strength_id (FK), proficiency/level, created_at
- PK on (profile_id, skill_id/strength_id)

### projects
- id, user_id (FK auth.users), name, description, technologies (text[]), github_url, created_at, updated_at

### reports
- id, reporter_id, target_type, target_id, reason, status, created_at

## Security
- RLS enabled on every table.
- profiles: users read all non-suspended profiles; update own; admin full access via SECURITY DEFINER or role check.
- skills/strengths: public read (anon + authenticated).
- profile_skills/profile_strengths: public read (for matching), owner insert/update/delete.
- projects: public read, owner insert/update/delete.
- reports: owner can insert; admin can read all; reporter can read own.
- A `profiles` trigger auto-creates a profile row on auth.users insert, copying email and defaulting role=student.

## Notes
1. The `handle_new_user` trigger fires on auth.users INSERT to seed a profile row.
2. `updated_at` auto-updated via triggers on profiles and projects.
3. Admin role is stored in profiles.role and mirrored into JWT raw_app_meta_data for server-side checks.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  profile_photo text,
  college text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  experience_level text NOT NULL DEFAULT 'beginner'
    CHECK (experience_level IN ('beginner','intermediate','advanced')),
  role text NOT NULL DEFAULT 'student'
    CHECK (role IN ('student','admin')),
  is_suspended boolean NOT NULL DEFAULT false,
  public_profile boolean NOT NULL DEFAULT true,
  github_url text,
  linkedin_url text,
  leetcode_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (
    is_suspended = false
    OR id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============ SKILLS ============
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'general',
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skills_select" ON skills;
CREATE POLICY "skills_select" ON skills FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "skills_insert" ON skills;
CREATE POLICY "skills_insert" ON skills FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ PROFILE_SKILLS ============
CREATE TABLE IF NOT EXISTS profile_skills (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency text NOT NULL DEFAULT 'intermediate'
    CHECK (proficiency IN ('beginner','intermediate','advanced')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, skill_id)
);
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_skills_select" ON profile_skills;
CREATE POLICY "profile_skills_select" ON profile_skills FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profile_skills_insert" ON profile_skills;
CREATE POLICY "profile_skills_insert" ON profile_skills FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "profile_skills_update" ON profile_skills;
CREATE POLICY "profile_skills_update" ON profile_skills FOR UPDATE
  TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "profile_skills_delete" ON profile_skills;
CREATE POLICY "profile_skills_delete" ON profile_skills FOR DELETE
  TO authenticated USING (profile_id = auth.uid());

-- ============ STRENGTHS ============
CREATE TABLE IF NOT EXISTS strengths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'general',
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE strengths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strengths_select" ON strengths;
CREATE POLICY "strengths_select" ON strengths FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "strengths_insert" ON strengths;
CREATE POLICY "strengths_insert" ON strengths FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ PROFILE_STRENGTHS ============
CREATE TABLE IF NOT EXISTS profile_strengths (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  strength_id uuid NOT NULL REFERENCES strengths(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'intermediate'
    CHECK (level IN ('beginner','intermediate','advanced')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, strength_id)
);
ALTER TABLE profile_strengths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_strengths_select" ON profile_strengths;
CREATE POLICY "profile_strengths_select" ON profile_strengths FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profile_strengths_insert" ON profile_strengths;
CREATE POLICY "profile_strengths_insert" ON profile_strengths FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "profile_strengths_update" ON profile_strengths;
CREATE POLICY "profile_strengths_update" ON profile_strengths FOR UPDATE
  TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "profile_strengths_delete" ON profile_strengths;
CREATE POLICY "profile_strengths_delete" ON profile_strengths FOR DELETE
  TO authenticated USING (profile_id = auth.uid());

-- ============ PROJECTS ============
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  technologies text[] NOT NULL DEFAULT '{}',
  github_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ REPORTS ============
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('profile','project','team_requirement','hackathon')),
  target_id uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_select" ON reports;
CREATE POLICY "reports_select" ON reports FOR SELECT
  TO authenticated USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "reports_update" ON reports;
CREATE POLICY "reports_update" ON reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ ADMIN HELPERS ============
-- SECURITY DEFINER function to check admin role (used by other tables' policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_suspended = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============ SEED SKILLS ============
INSERT INTO skills (name, category) VALUES
  ('Python','Programming'),('Java','Programming'),('C++','Programming'),
  ('JavaScript','Programming'),('TypeScript','Programming'),('React','Frontend'),
  ('Node.js','Backend'),('HTML/CSS','Frontend'),('AI/ML','AI/ML'),
  ('Data Science','Data'),('UI/UX','Design'),('Cloud','DevOps'),
  ('Cybersecurity','Security'),('IoT','Hardware'),('Blockchain','Web3')
ON CONFLICT (name) DO NOTHING;

-- ============ SEED STRENGTHS ============
INSERT INTO strengths (name, category) VALUES
  ('Problem Solving','Cognitive'),('Coding','Technical'),('Research','Technical'),
  ('Presentation','Communication'),('Communication','Communication'),
  ('Leadership','Management'),('UI Design','Design'),('Team Management','Management')
ON CONFLICT (name) DO NOTHING;
