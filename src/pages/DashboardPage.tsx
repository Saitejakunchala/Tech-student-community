import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullSpinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { getGreeting, formatDate, daysUntil, cn } from '@/lib/utils';
import type { TeamRequirement, Hackathon } from '@/lib/types';
import { Trophy, Award, Medal, FolderGit2, Zap, Users, ArrowRight, Calendar, Target, TrendingUp } from 'lucide-react';

interface Stats {
  hackathonsParticipated: number;
  finalist: number;
  wins: number;
  projects: number;
}

interface ActivityData {
  date: string;
  count: number;
}

export function DashboardPage() {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [stats, setStats] = useState<Stats>({ hackathonsParticipated: 0, finalist: 0, wins: 0, projects: 0 });
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [recommendations, setRecommendations] = useState<TeamRequirement[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      setPageLoading(false);
      return;
    }
    loadData();
  }, [profile, loading]);

  const loadData = async () => {
    if (!profile) return;
    setError(false);
    setPageLoading(true);
    try {
      const [statsRes, activityRes, recsRes, skillsRes] = await Promise.all([
        supabase
          .from('hackathon_participations')
          .select('result, verification_status')
          .eq('user_id', profile.id)
          .eq('verification_status', 'verified'),
        supabase
          .from('hackathon_participations')
          .select('created_at')
          .eq('user_id', profile.id)
          .eq('verification_status', 'verified'),
        supabase
          .from('team_requirements')
          .select('*, hackathon:hackathons(*), owner:profiles!team_requirements_owner_id_fkey(*)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('profile_skills')
          .select('skill:skills(name)')
          .eq('profile_id', profile.id),
      ]);

      // Stats
      const participations = statsRes.data || [];
      setStats({
        hackathonsParticipated: participations.length,
        finalist: participations.filter((p) => p.result === 'finalist' || p.result === 'winner').length,
        wins: participations.filter((p) => p.result === 'winner').length,
        projects: 0,
      });

      // Projects count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);
      setStats((s) => ({ ...s, projects: projectCount || 0 }));

      // Activity
      const activityMap = new Map<string, number>();
      (activityRes.data || []).forEach((p) => {
        const date = p.created_at.split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });
      setActivity(Array.from(activityMap.entries()).map(([date, count]) => ({ date, count })));

      // Recommendations
      setRecommendations((recsRes.data || []) as TeamRequirement[]);

      // User skills
      const skillNames = (skillsRes.data || []).map((s) => (s.skill as unknown as { name: string }).name);
      setUserSkills(skillNames);
    } catch {
      setError(true);
    } finally {
      setPageLoading(false);
    }
  };

  if (loading || pageLoading) return <FullSpinner label="Loading your dashboard..." />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardBody className="text-center py-12">
              <h2 className="text-xl font-black text-slate-900 mb-2">Profile not found</h2>
              <p className="text-slate-600 mb-6">We couldn't find your profile. Please complete onboarding to continue.</p>
              <Button onClick={() => navigate('/onboarding')}>Complete Your Profile</Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardBody className="text-center py-12">
              <h2 className="text-xl font-black text-slate-900 mb-2">Unable to load dashboard data</h2>
              <p className="text-slate-600 mb-6">Something went wrong while loading your dashboard. Please try again.</p>
              <Button onClick={loadData}>Retry</Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-slate-600 mt-1">Ready to build something great?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Trophy} label="Hackathons" value={stats.hackathonsParticipated} color="from-teal-500 to-cyan-600" />
          <StatCard icon={Medal} label="Finalist" value={stats.finalist} color="from-amber-500 to-orange-600" />
          <StatCard icon={Award} label="Wins" value={stats.wins} color="from-emerald-500 to-teal-600" />
          <StatCard icon={FolderGit2} label="Projects" value={stats.projects} color="from-blue-500 to-indigo-600" />
        </div>

        {/* Two Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card hover className="cursor-pointer" onClick={() => navigate('/ready-to-find')}>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">READY-TO-FIND</h3>
                  <p className="text-sm text-slate-600 mt-1">I already found a hackathon and need teammates.</p>
                  <Button size="sm" className="mt-3">
                    Find Teammates <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card hover className="cursor-pointer" onClick={() => navigate('/ready-to-get-in')}>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">READY-TO-GET-IN</h3>
                  <p className="text-sm text-slate-600 mt-1">I want to join a hackathon team.</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Find a Team <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Activity + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity */}
          <Card className="lg:col-span-2">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle>Hackathon Activity</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Your participation over the year</p>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              {activity.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="w-8 h-8" />}
                  title="No activity yet"
                  description="Participate in hackathons to see your activity here."
                />
              ) : (
                <ActivityHeatmap data={activity} />
              )}
            </CardBody>
          </Card>

          {/* Quick links */}
          <Card>
            <CardBody>
              <CardTitle className="mb-4">Quick Actions</CardTitle>
              <div className="space-y-2">
                <QuickLink icon={Users} label="Find Teammates" onClick={() => navigate('/find-teammates')} />
                <QuickLink icon={Trophy} label="Browse Hackathons" onClick={() => navigate('/hackathons')} />
                <QuickLink icon={Target} label="My Posts" onClick={() => navigate('/my-posts')} />
                <QuickLink icon={FolderGit2} label="My Team" onClick={() => navigate('/my-team')} />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recommended Opportunities */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900">Recommended Opportunities</h2>
            <button onClick={() => navigate('/hackathons')} className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              View all
            </button>
          </div>
          {recommendations.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Target className="w-8 h-8" />}
                title="No open team requirements found"
                description="Be the first to create a team requirement."
                action={<Button onClick={() => navigate('/ready-to-find')}>Create Requirement</Button>}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((req) => (
                <RecommendationCard key={req.id} req={req} userSkills={userSkills} userExperience={profile?.experience_level || 'beginner'} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Trophy; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 font-semibold">{label}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: typeof Trophy; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
    </button>
  );
}

function RecommendationCard({ req, userSkills, userExperience }: { req: TeamRequirement; userSkills: string[]; userExperience: string }) {
  const { navigate } = useRouter();
  const hackathon = req.hackathon as unknown as Hackathon;
  const deadline = daysUntil(hackathon?.registration_deadline || null);
  const requiredSkills = (req.required_skills || []).map((rs) => rs.skill.name);
  const matchedSkills = requiredSkills.filter((rs) => userSkills.some((us) => us.toLowerCase() === rs.toLowerCase()));
  const matchScore = requiredSkills.length === 0 ? 50 : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return (
    <Card hover className="cursor-pointer" onClick={() => navigate(`/hackathon/${hackathon?.id}`)}>
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{hackathon?.name || 'Hackathon'}</h3>
            <p className="text-xs text-slate-500">{hackathon?.category}</p>
          </div>
          <div className="text-right">
            <div className={cn('text-lg font-black', matchScore >= 70 ? 'text-teal-600' : matchScore >= 40 ? 'text-amber-600' : 'text-slate-400')}>
              {matchScore}%
            </div>
            <div className="text-xs text-slate-400">Match</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {requiredSkills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant={userSkills.some((us) => us.toLowerCase() === skill.toLowerCase()) ? 'teal' : 'default'}>
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {req.current_team_size}/{req.required_team_size}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {deadline !== null ? `${deadline}d left` : 'TBD'}</span>
        </div>
      </CardBody>
    </Card>
  );
}
