import type { Skill, Profile, TeamRequirement, MatchBreakdown, ExperienceLevel } from './types';

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export function calculateMatchScore(
  userSkills: Skill[],
  userStrengths: Skill[],
  userExperience: ExperienceLevel,
  requiredSkills: string[],
  preferredExperience: ExperienceLevel,
  hackathonCategory: string,
  userHackathonCategories: string[] = [],
): MatchBreakdown {
  const reasons: string[] = [];
  const userSkillNames = userSkills.map((s) => s.name.toLowerCase());

  // 40% Required Skill Match
  const requiredMatches = requiredSkills.filter((rs) =>
    userSkillNames.includes(rs.toLowerCase()),
  );
  const requiredSkillScore =
    requiredSkills.length === 0
      ? 100
      : (requiredMatches.length / requiredSkills.length) * 100;
  if (requiredMatches.length > 0) {
    reasons.push(`${requiredMatches.length} required skill${requiredMatches.length > 1 ? 's' : ''} matched`);
  }

  // 25% Complementary Skill Match
  // Complementary: user has skills NOT in required but that round out a team (frontend, backend, design, etc.)
  const complementaryCategories = ['Frontend', 'Backend', 'Design', 'AI/ML', 'Data', 'DevOps'];
  const userComplementary = userSkills.filter(
    (s) =>
      !requiredSkills.some((rs) => rs.toLowerCase() === s.name.toLowerCase()) &&
      complementaryCategories.includes(s.category),
  );
  const complementaryScore = Math.min(userComplementary.length * 25, 100);
  if (userComplementary.length > 0) {
    reasons.push(`Strong complementary ${userComplementary[0].category.toLowerCase()} skill`);
  }

  // 20% Experience Match
  const userRank = EXPERIENCE_RANK[userExperience];
  const preferredRank = EXPERIENCE_RANK[preferredExperience];
  const experienceDiff = Math.abs(userRank - preferredRank);
  const experienceScore = Math.max(0, 100 - experienceDiff * 40);
  if (experienceDiff <= 1) {
    reasons.push('Similar experience level');
  }

  // 15% Interest/Category Match
  const interestScore =
    hackathonCategory && userHackathonCategories.length > 0
      ? userHackathonCategories.some((c) => c.toLowerCase() === hackathonCategory.toLowerCase())
        ? 100
        : 30
      : 50;
  if (
    hackathonCategory &&
    userHackathonCategories.some((c) => c.toLowerCase() === hackathonCategory.toLowerCase())
  ) {
    reasons.push('Similar hackathon interest');
  }

  const total = Math.round(
    requiredSkillScore * 0.4 + complementaryScore * 0.25 + experienceScore * 0.2 + interestScore * 0.15,
  );

  if (reasons.length === 0) {
    reasons.push('Profile available for team formation');
  }

  return {
    requiredSkillsScore: Math.round(requiredSkillScore),
    complementaryScore: Math.round(complementaryScore),
    experienceScore: Math.round(experienceScore),
    interestScore: Math.round(interestScore),
    total,
    reasons,
  };
}
