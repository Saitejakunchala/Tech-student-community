export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type UserRole = 'student' | 'admin';
export type TeamStatus = 'recruiting' | 'full' | 'completed';
export type RequirementStatus = 'open' | 'closed' | 'filled';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type ParticipationResult = 'participated' | 'shortlisted' | 'finalist' | 'winner';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type HackathonStatus = 'open' | 'closed';
export type ReportTargetType = 'profile' | 'project' | 'team_requirement' | 'hackathon';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  profile_photo: string | null;
  college: string;
  branch: string;
  year: string;
  bio: string;
  experience_level: ExperienceLevel;
  role: UserRole;
  is_suspended: boolean;
  public_profile: boolean;
  github_url: string | null;
  linkedin_url: string | null;
  leetcode_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string | null;
}

export interface Strength {
  id: string;
  name: string;
  category: string;
  icon: string | null;
}

export interface ProfileSkill {
  profile_id: string;
  skill_id: string;
  proficiency: ExperienceLevel;
  skill?: Skill;
}

export interface ProfileStrength {
  profile_id: string;
  strength_id: string;
  level: ExperienceLevel;
  strength?: Strength;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  technologies: string[];
  github_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hackathon {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  category: string;
  description: string;
  registration_deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  max_team_size: number;
  required_skills: string[];
  created_by: string | null;
  status: HackathonStatus;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  hackathon_id: string;
  name: string;
  owner_id: string;
  status: TeamStatus;
  created_at: string;
  updated_at: string;
  hackathon?: Hackathon;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface TeamRequirement {
  id: string;
  owner_id: string;
  hackathon_id: string;
  idea_description: string;
  required_team_size: number;
  current_team_size: number;
  preferred_experience: ExperienceLevel;
  status: RequirementStatus;
  created_at: string;
  updated_at: string;
  hackathon?: Hackathon;
  owner?: Profile;
  required_skills?: { skill_id: string; importance: string; skill: Skill }[];
}

export interface JoinRequest {
  id: string;
  team_id: string | null;
  requirement_id: string | null;
  sender_id: string;
  message: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  team?: Team;
  requirement?: TeamRequirement;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface HackathonParticipation {
  id: string;
  user_id: string;
  team_id: string | null;
  hackathon_id: string;
  project_name: string;
  project_description: string;
  github_url: string | null;
  result: ParticipationResult;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  hackathon?: Hackathon;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reporter?: Profile;
}

export interface MatchBreakdown {
  requiredSkillsScore: number;
  complementaryScore: number;
  experienceScore: number;
  interestScore: number;
  total: number;
  reasons: string[];
}

export interface StudentMatch {
  profile: Profile;
  skills: Skill[];
  strengths: Strength[];
  projectCount: number;
  hackathonCount: number;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
}

export interface RequirementMatch {
  requirement: TeamRequirement;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
}
