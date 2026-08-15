/*
# TECH — Core Schema Part 2: Hackathons, Teams, Requirements, Requests, Notifications, Participations

## Summary
Creates the collaboration and activity tables:
- `hackathons`, `teams`, `team_members`, `team_requirements`, `team_requirement_skills`,
  `join_requests`, `notifications`, `hackathon_participations`
- SECURITY DEFINER functions: accept_join_request, reject_join_request, create_notification

## Security
- RLS on all tables with ownership/membership-based policies.
- Admin access via is_admin() helper.
*/

-- ============ HACKATHONS ============
CREATE TABLE IF NOT EXISTS hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text NOT NULL DEFAULT '',
  url text,
  category text NOT NULL DEFAULT 'General',
  description text NOT NULL DEFAULT '',
  registration_deadline date,
  start_date date,
  end_date date,
  max_team_size int NOT NULL DEFAULT 4,
  required_skills text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS hackathons_updated_at ON hackathons;
CREATE TRIGGER hackathons_updated_at BEFORE UPDATE ON hackathons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP POLICY IF EXISTS "hackathons_select" ON hackathons;
CREATE POLICY "hackathons_select" ON hackathons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "hackathons_insert" ON hackathons;
CREATE POLICY "hackathons_insert" ON hackathons FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "hackathons_update" ON hackathons;
CREATE POLICY "hackathons_update" ON hackathons FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "hackathons_delete" ON hackathons;
CREATE POLICY "hackathons_delete" ON hackathons FOR DELETE
  TO authenticated USING (is_admin());

-- ============ TEAMS ============
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name text NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'recruiting' CHECK (status IN ('recruiting','full','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS teams_updated_at ON teams;
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP POLICY IF EXISTS "teams_select" ON teams;
CREATE POLICY "teams_select" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "teams_insert" ON teams;
CREATE POLICY "teams_insert" ON teams FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "teams_update" ON teams;
CREATE POLICY "teams_update" ON teams FOR UPDATE
  TO authenticated USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "teams_delete" ON teams;
CREATE POLICY "teams_delete" ON teams FOR DELETE
  TO authenticated USING (owner_id = auth.uid() OR is_admin());

-- ============ TEAM_MEMBERS ============
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert" ON team_members FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
    OR is_admin()
  );

-- ============ TEAM_REQUIREMENTS ============
CREATE TABLE IF NOT EXISTS team_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  idea_description text NOT NULL DEFAULT '',
  required_team_size int NOT NULL DEFAULT 4,
  current_team_size int NOT NULL DEFAULT 1,
  preferred_experience text NOT NULL DEFAULT 'beginner'
    CHECK (preferred_experience IN ('beginner','intermediate','advanced')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','filled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE team_requirements ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS team_requirements_updated_at ON team_requirements;
CREATE TRIGGER team_requirements_updated_at BEFORE UPDATE ON team_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP POLICY IF EXISTS "team_requirements_select" ON team_requirements;
CREATE POLICY "team_requirements_select" ON team_requirements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "team_requirements_insert" ON team_requirements;
CREATE POLICY "team_requirements_insert" ON team_requirements FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "team_requirements_update" ON team_requirements;
CREATE POLICY "team_requirements_update" ON team_requirements FOR UPDATE
  TO authenticated USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "team_requirements_delete" ON team_requirements;
CREATE POLICY "team_requirements_delete" ON team_requirements FOR DELETE
  TO authenticated USING (owner_id = auth.uid() OR is_admin());

-- ============ TEAM_REQUIREMENT_SKILLS ============
CREATE TABLE IF NOT EXISTS team_requirement_skills (
  requirement_id uuid NOT NULL REFERENCES team_requirements(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance text NOT NULL DEFAULT 'required' CHECK (importance IN ('required','preferred')),
  PRIMARY KEY (requirement_id, skill_id)
);
ALTER TABLE team_requirement_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_requirement_skills_select" ON team_requirement_skills;
CREATE POLICY "team_requirement_skills_select" ON team_requirement_skills FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "team_requirement_skills_insert" ON team_requirement_skills;
CREATE POLICY "team_requirement_skills_insert" ON team_requirement_skills FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM team_requirements tr WHERE tr.id = requirement_id AND tr.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "team_requirement_skills_delete" ON team_requirement_skills;
CREATE POLICY "team_requirement_skills_delete" ON team_requirement_skills FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM team_requirements tr WHERE tr.id = requirement_id AND tr.owner_id = auth.uid())
  );

-- ============ JOIN_REQUESTS ============
CREATE TABLE IF NOT EXISTS join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES team_requirements(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (team_id IS NOT NULL OR requirement_id IS NOT NULL)
);
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS join_requests_updated_at ON join_requests;
CREATE TRIGGER join_requests_updated_at BEFORE UPDATE ON join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP POLICY IF EXISTS "join_requests_select" ON join_requests;
CREATE POLICY "join_requests_select" ON join_requests FOR SELECT
  TO authenticated USING (
    sender_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_requirements tr WHERE tr.id = requirement_id AND tr.owner_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "join_requests_insert" ON join_requests;
CREATE POLICY "join_requests_insert" ON join_requests FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "join_requests_update" ON join_requests;
CREATE POLICY "join_requests_update" ON join_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_requirements tr WHERE tr.id = requirement_id AND tr.owner_id = auth.uid())
    OR sender_id = auth.uid()
    OR is_admin()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_requirements tr WHERE tr.id = requirement_id AND tr.owner_id = auth.uid())
    OR sender_id = auth.uid()
    OR is_admin()
  );

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  TO authenticated USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  TO authenticated WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  TO authenticated USING (recipient_id = auth.uid());

CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (recipient_id, type, title, message, related_id)
  VALUES (p_recipient_id, p_type, p_title, p_message, p_related_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ HACKATHON_PARTICIPATIONS ============
CREATE TABLE IF NOT EXISTS hackathon_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  project_name text NOT NULL DEFAULT '',
  project_description text NOT NULL DEFAULT '',
  github_url text,
  result text NOT NULL DEFAULT 'participated' CHECK (result IN ('participated','shortlisted','finalist','winner')),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hackathon_participations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS hackathon_participations_updated_at ON hackathon_participations;
CREATE TRIGGER hackathon_participations_updated_at BEFORE UPDATE ON hackathon_participations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP POLICY IF EXISTS "participations_select" ON hackathon_participations;
CREATE POLICY "participations_select" ON hackathon_participations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "participations_insert" ON hackathon_participations;
CREATE POLICY "participations_insert" ON hackathon_participations FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "participations_update" ON hackathon_participations;
CREATE POLICY "participations_update" ON hackathon_participations FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "participations_delete" ON hackathon_participations;
CREATE POLICY "participations_delete" ON hackathon_participations FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

-- ============ ACCEPT JOIN REQUEST (SECURITY DEFINER) ============
CREATE OR REPLACE FUNCTION accept_join_request(p_request_id uuid)
RETURNS void AS $$
DECLARE
  v_request join_requests%ROWTYPE;
  v_team teams%ROWTYPE;
  v_member_count int;
BEGIN
  SELECT * INTO v_request FROM join_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;

  IF v_request.team_id IS NOT NULL THEN
    SELECT * INTO v_team FROM teams WHERE id = v_request.team_id;
    IF v_team.owner_id != auth.uid() AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized to accept this request';
    END IF;

    SELECT count(*) INTO v_member_count FROM team_members WHERE team_id = v_team.id;
    IF v_member_count >= v_team.max_team_size THEN
      RAISE EXCEPTION 'Team is full';
    END IF;

    INSERT INTO team_members (team_id, user_id, role)
    VALUES (v_team.id, v_request.sender_id, 'member')
    ON CONFLICT (team_id, user_id) DO NOTHING;

    UPDATE join_requests SET status = 'accepted', updated_at = now() WHERE id = p_request_id;

    PERFORM create_notification(
      v_request.sender_id,
      'request_accepted',
      'Request Accepted',
      'Your request to join "' || v_team.name || '" was accepted.',
      v_team.id
    );

    IF v_member_count + 1 >= v_team.max_team_size THEN
      UPDATE teams SET status = 'full', updated_at = now() WHERE id = v_team.id;
    END IF;
  ELSIF v_request.requirement_id IS NOT NULL THEN
    PERFORM 1 FROM team_requirements tr WHERE tr.id = v_request.requirement_id AND tr.owner_id = auth.uid();
    IF NOT FOUND AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized to accept this request';
    END IF;

    UPDATE join_requests SET status = 'accepted', updated_at = now() WHERE id = p_request_id;

    PERFORM create_notification(
      v_request.sender_id,
      'request_accepted',
      'Request Accepted',
      'Your request was accepted.',
      v_request.requirement_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ REJECT JOIN REQUEST (SECURITY DEFINER) ============
CREATE OR REPLACE FUNCTION reject_join_request(p_request_id uuid)
RETURNS void AS $$
DECLARE
  v_request join_requests%ROWTYPE;
  v_team_owner uuid;
  v_req_owner uuid;
BEGIN
  SELECT * INTO v_request FROM join_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;

  IF v_request.team_id IS NOT NULL THEN
    SELECT owner_id INTO v_team_owner FROM teams WHERE id = v_request.team_id;
    IF v_team_owner != auth.uid() AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  ELSIF v_request.requirement_id IS NOT NULL THEN
    SELECT owner_id INTO v_req_owner FROM team_requirements WHERE id = v_request.requirement_id;
    IF v_req_owner != auth.uid() AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  UPDATE join_requests SET status = 'rejected', updated_at = now() WHERE id = p_request_id;

  PERFORM create_notification(
    v_request.sender_id,
    'request_rejected',
    'Request Rejected',
    'Your request was declined.',
    v_request.team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_join_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_join_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON profile_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_skill ON profile_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_profile_strengths_profile ON profile_strengths(profile_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_hackathons_status ON hackathons(status);
CREATE INDEX IF NOT EXISTS idx_hackathons_category ON hackathons(category);
CREATE INDEX IF NOT EXISTS idx_teams_hackathon ON teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_requirements_owner ON team_requirements(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_requirements_hackathon ON team_requirements(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_team_requirements_status ON team_requirements(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_team ON join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requirement ON join_requests(requirement_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_sender ON join_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_participations_user ON hackathon_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_hackathon ON hackathon_participations(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_participations_verification ON hackathon_participations(verification_status);
