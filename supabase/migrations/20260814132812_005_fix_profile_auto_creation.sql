/*
# Fix: Harden handle_new_user trigger and add search_path to SECURITY DEFINER functions

## Summary
1. Adds `set search_path = public` to all SECURITY DEFINER functions (fixes security advisor warnings).
2. Re-affirms the on_auth_user_created trigger for auto-creating profiles on signup.
3. Backfills any existing auth.users that are missing a profile row (idempotent).

## Security
- Functions with explicit search_path prevent search_path injection attacks.
- Profile auto-creation only inserts id, email, full_name, and role='student' — no password data.
- The insert policy "profiles_insert" allows authenticated users to insert their own row (id = auth.uid()).
*/

-- Harden handle_new_user with search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Harden other SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_suspended = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, type, title, message, related_id)
  VALUES (p_recipient_id, p_type, p_title, p_message, p_related_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION accept_join_request(p_request_id uuid)
RETURNS void AS $$
DECLARE
  v_request join_requests%ROWTYPE;
  v_team teams%ROWTYPE;
  v_hackathon hackathons%ROWTYPE;
  v_member_count int;
BEGIN
  SELECT * INTO v_request FROM public.join_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;

  IF v_request.team_id IS NOT NULL THEN
    SELECT * INTO v_team FROM public.teams WHERE id = v_request.team_id;
    IF v_team.owner_id != auth.uid() AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized to accept this request';
    END IF;

    SELECT * INTO v_hackathon FROM public.hackathons WHERE id = v_team.hackathon_id;
    SELECT count(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team.id;
    IF v_member_count >= v_hackathon.max_team_size THEN
      RAISE EXCEPTION 'Team is full';
    END IF;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_team.id, v_request.sender_id, 'member')
    ON CONFLICT (team_id, user_id) DO NOTHING;

    UPDATE public.join_requests SET status = 'accepted', updated_at = now() WHERE id = p_request_id;

    PERFORM create_notification(
      v_request.sender_id,
      'request_accepted',
      'Request Accepted',
      'Your request to join "' || v_team.name || '" was accepted.',
      v_team.id
    );

    IF v_member_count + 1 >= v_hackathon.max_team_size THEN
      UPDATE public.teams SET status = 'full', updated_at = now() WHERE id = v_team.id;
    END IF;
  ELSIF v_request.requirement_id IS NOT NULL THEN
    PERFORM 1 FROM public.team_requirements tr WHERE tr.id = v_request.requirement_id AND tr.owner_id = auth.uid();
    IF NOT FOUND AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized to accept this request';
    END IF;

    UPDATE public.join_requests SET status = 'accepted', updated_at = now() WHERE id = p_request_id;

    PERFORM create_notification(
      v_request.sender_id,
      'request_accepted',
      'Request Accepted',
      'Your request was accepted.',
      v_request.requirement_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION reject_join_request(p_request_id uuid)
RETURNS void AS $$
DECLARE
  v_request join_requests%ROWTYPE;
  v_team_owner uuid;
  v_req_owner uuid;
BEGIN
  SELECT * INTO v_request FROM public.join_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending';
  END IF;

  IF v_request.team_id IS NOT NULL THEN
    SELECT owner_id INTO v_team_owner FROM public.teams WHERE id = v_request.team_id;
    IF v_team_owner != auth.uid() AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  ELSIF v_request.requirement_id IS NOT NULL THEN
    SELECT owner_id INTO v_req_owner FROM public.team_requirements WHERE id = v_request.requirement_id;
    IF v_req_owner != auth.uid() AND NOT is_admin() THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  UPDATE public.join_requests SET status = 'rejected', updated_at = now() WHERE id = p_request_id;

  PERFORM create_notification(
    v_request.sender_id,
    'request_rejected',
    'Request Rejected',
    'Your request was declined.',
    v_request.team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill any missing profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', ''), 'student'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
