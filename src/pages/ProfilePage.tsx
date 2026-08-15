import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Profile, Skill, Strength, Project, HackathonParticipation } from '@/lib/types';
import { Trophy, Medal, Award, FolderGit2, Github, Linkedin, Code, ExternalLink, GraduationCap, Calendar } from 'lucide-react';

interface ProfileData {
  profile: Profile;
  skills: Skill[];
  strengths: Strength[];
  projects: Project[];
  participations: HackathonParticipation[];
  stats: { hackathons: number; finalist: number; wins: number; projects: number };
  activity: { date: string; count: number }[];
}

export function ProfilePage({ userId }: { userId?: string }) {
  const { profile: currentUser, loading } = useAuth();
  const { navigate } = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const targetId = userId || currentUser?.id;

  useEffect(() => {
    if (!targetId) return;
    loadProfile(targetId);
  }, [targetId]);

  const loadProfile = async (id: string) => {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (!prof) { setNotFound(true); setPageLoading(false); return; }
    const profile = prof as Profile;

    // Check public visibility for non-owner
    if (userId && !profile.public_profile && userId !== currentUser?.id) {
      setNotFound(true); setPageLoading(false); return;
    }

    const [skillsRes, strengthsRes, projectsRes, partsRes] = await Promise.all([
      supabase.from('profile_skills').select('skill:skills(*)').eq('profile_id', id),
      supabase.from('profile_strengths').select('strength:strengths(*)').eq('profile_id', id),
      supabase.from('projects').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('hackathon_participations').select('*, hackathon:hackathons(*)').eq('user_id', id).eq('verification_status', 'verified').order('created_at', { ascending: false }),
    ]);

    const skills = ((skillsRes.data || []) as unknown as { skill: Skill }[]).map((s) => s.skill);
    const strengths = ((strengthsRes.data || []) as unknown as { strength: Strength }[]).map((s) => s.strength);
    const projects = (projectsRes.data || []) as Project[];
    const participations = (partsRes.data || []) as HackathonParticipation[];

    const stats = {
      hackathons: participations.length,
      finalist: participations.filter((p) => p.result === 'finalist' || p.result === 'winner').length,
      wins: participations.filter((p) => p.result === 'winner').length,
      projects: projects.length,
    };

    const activityMap = new Map<string, number>();
    participations.forEach((p) => {
      const date = p.created_at.split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });
    const activity = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }));

    setData({ profile, skills, strengths, projects, participations, stats, activity });
    setPageLoading(false);
  };

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Card className="max-w-2xl mx-auto mt-20"><EmptyState icon={<Trophy className="w-8 h-8" />} title="Profile not found" description="This profile may not exist or is not public." action={<Button onClick={() => navigate('/dashboard')}>Go Home</Button>} /></Card>
      </div>
    );
  }

  if (!data) return null;
  const { profile, skills, strengths, projects, participations, stats, activity } = data;
  const isOwn = !userId || userId === currentUser?.id;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar name={profile.full_name} photo={profile.profile_photo} size="xl" />
              <div className="flex-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.full_name}</h1>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {profile.college}</span>
                  <span>·</span>
                  <span>{profile.branch}</span>
                  {profile.year && <><span>·</span><span>{profile.year}</span></>}
                </div>
                {profile.bio && <p className="text-slate-600 mt-3">{profile.bio}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"><Github className="w-4 h-4" /> GitHub</a>}
                  {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"><Linkedin className="w-4 h-4" /> LinkedIn</a>}
                  {profile.leetcode_url && <a href={profile.leetcode_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"><Code className="w-4 h-4" /> LeetCode</a>}
                </div>
              </div>
              {isOwn && <Button variant="outline" onClick={() => navigate('/settings')}>Edit Profile</Button>}
            </div>
          </CardBody>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatBox icon={Trophy} label="Hackathons" value={stats.hackathons} color="from-teal-500 to-cyan-600" />
          <StatBox icon={Medal} label="Finalist" value={stats.finalist} color="from-amber-500 to-orange-600" />
          <StatBox icon={Award} label="Wins" value={stats.wins} color="from-emerald-500 to-teal-600" />
          <StatBox icon={FolderGit2} label="Projects" value={stats.projects} color="from-blue-500 to-indigo-600" />
        </div>

        {/* Skills & Strengths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardBody>
              <CardTitle className="mb-4">Skills</CardTitle>
              {skills.length === 0 ? <p className="text-sm text-slate-500">No skills added yet.</p> : (
                <div className="flex flex-wrap gap-2">{skills.map((s) => <Badge key={s.id} variant="teal">{s.name}</Badge>)}</div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle className="mb-4">Strengths</CardTitle>
              {strengths.length === 0 ? <p className="text-sm text-slate-500">No strengths added yet.</p> : (
                <div className="flex flex-wrap gap-2">{strengths.map((s) => <Badge key={s.id} variant="blue">{s.name}</Badge>)}</div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Activity */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">Hackathon Activity</CardTitle>
            {activity.length === 0 ? <p className="text-sm text-slate-500">No activity yet.</p> : <ActivityHeatmap data={activity} />}
          </CardBody>
        </Card>

        {/* Projects */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">Projects</CardTitle>
            {projects.length === 0 ? <EmptyState icon={<FolderGit2 className="w-8 h-8" />} title="No projects yet" description={isOwn ? "Add projects in onboarding or settings." : "This student hasn't added projects yet."} /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="rounded-xl border border-slate-200 p-4">
                    <h4 className="font-bold text-slate-900">{p.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{p.description}</p>
                    {p.technologies.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{p.technologies.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-teal-600 hover:text-teal-700"><ExternalLink className="w-3.5 h-3.5" /> View on GitHub</a>}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Hackathon History */}
        <Card>
          <CardBody>
            <CardTitle className="mb-4">Hackathon History</CardTitle>
            {participations.length === 0 ? <EmptyState icon={<Trophy className="w-8 h-8" />} title="No hackathon history yet" description={isOwn ? "Submit results from My Teams page." : "This student hasn't participated in hackathons yet."} /> : (
              <div className="space-y-3">
                {participations.map((p) => {
                  const hackathon = p.hackathon as unknown as { name: string; category: string };
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white"><Trophy className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">{hackathon?.name || 'Hackathon'}</p>
                        {p.project_name && <p className="text-xs text-slate-500">{p.project_name}</p>}
                      </div>
                      <Badge variant={p.result === 'winner' ? 'green' : p.result === 'finalist' ? 'amber' : 'default'}>{p.result}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Trophy; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', color)}><Icon className="w-5 h-5" /></div>
          <div><p className="text-2xl font-black text-slate-900">{value}</p><p className="text-xs text-slate-500 font-semibold">{label}</p></div>
        </div>
      </CardBody>
    </Card>
  );
}
