import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { cn, formatDate, daysUntil, debounce } from '@/lib/utils';
import type { Hackathon, Skill, TeamRequirement, ExperienceLevel } from '@/lib/types';
import { Search, Users, Calendar, Trophy, CheckCircle2, Filter, X } from 'lucide-react';

export function ReadyToFindPage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState({
    hackathon_id: '',
    idea_description: '',
    required_team_size: 4,
    current_team_size: 1,
    preferred_experience: 'intermediate' as ExperienceLevel,
    required_skills: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.from('hackathons').select('*').eq('status', 'open').order('name').then(({ data }) => {
      setHackathons((data || []) as Hackathon[]);
    });
    supabase.from('skills').select('*').order('name').then(({ data }) => {
      if (data) setAllSkills(data as Skill[]);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    if (!form.hackathon_id) { setError('Please select a hackathon.'); return; }
    if (form.required_team_size < 2) { setError('Team size must be at least 2.'); return; }
    if (form.current_team_size > form.required_team_size) { setError('Current team cannot exceed required size.'); return; }

    setLoading(true);
    const { data, error: insErr } = await supabase.from('team_requirements').insert({
      owner_id: profile.id,
      hackathon_id: form.hackathon_id,
      idea_description: form.idea_description.trim(),
      required_team_size: form.required_team_size,
      current_team_size: form.current_team_size,
      preferred_experience: form.preferred_experience,
    }).select().single();

    if (insErr) { setError(insErr.message); setLoading(false); return; }

    if (form.required_skills.length > 0) {
      const skillRows = form.required_skills.map((skill_id) => ({ requirement_id: data.id, skill_id }));
      await supabase.from('team_requirement_skills').insert(skillRows);
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Your team requirement is now live!</h1>
          <p className="text-slate-600 mb-8">Students can now discover your requirement and send join requests.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/my-posts')}>View My Posts</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Create Team Requirement</h1>
        <p className="text-slate-600 mb-6">You found a hackathon and need teammates. Publish your requirement.</p>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select label="Hackathon" value={form.hackathon_id} onChange={(e) => setForm({ ...form, hackathon_id: e.target.value })} required>
                <option value="">Select a hackathon</option>
                {hackathons.map((h) => <option key={h.id} value={h.id}>{h.name} — {h.platform}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Required Team Size" type="number" min={2} max={10} value={form.required_team_size} onChange={(e) => setForm({ ...form, required_team_size: parseInt(e.target.value) || 2 })} />
                <Input label="Current Team Members" type="number" min={1} max={10} value={form.current_team_size} onChange={(e) => setForm({ ...form, current_team_size: parseInt(e.target.value) || 1 })} />
              </div>
              <Select label="Preferred Experience" value={form.preferred_experience} onChange={(e) => setForm({ ...form, preferred_experience: e.target.value as ExperienceLevel })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Required Skills</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allSkills.map((s) => {
                    const selected = form.required_skills.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => setForm({ ...form, required_skills: selected ? form.required_skills.filter((id) => id !== s.id) : [...form.required_skills, s.id] })}
                        className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all', selected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-700 hover:border-slate-300')}>
                        {selected && <CheckCircle2 className="w-4 h-4" />}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Textarea label="Project Idea" value={form.idea_description} onChange={(e) => setForm({ ...form, idea_description: e.target.value })} placeholder="Describe your project idea or what you want to build..." />
              {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Publish Requirement'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function ReadyToGetInPage() {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [requirements, setRequirements] = useState<TeamRequirement[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('team_requirements').select('*, hackathon:hackathons(*), owner:profiles!team_requirements_owner_id_fkey(*)').eq('status', 'open').neq('owner_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('skills').select('*').order('name'),
      supabase.from('profile_skills').select('skill:skills(name)').eq('profile_id', profile.id),
    ]).then(([reqRes, skillRes, userSkillRes]) => {
      setRequirements((reqRes.data || []) as TeamRequirement[]);
      setAllSkills((skillRes.data || []) as Skill[]);
      setUserSkills(((userSkillRes.data || []) as unknown as { skill: { name: string } }[]).map((s) => s.skill.name));
      setPageLoading(false);
    });
  }, [profile]);

  const debouncedSearch = debounce((v: string) => setSearch(v), 300);

  const filtered = requirements.filter((req) => {
    const hackathon = req.hackathon as unknown as Hackathon;
    if (search) {
      const s = search.toLowerCase();
      if (!hackathon?.name.toLowerCase().includes(s) && !req.idea_description.toLowerCase().includes(s)) return false;
    }
    if (skillFilter) {
      const reqSkills = (req.required_skills || []).map((rs) => rs.skill_id);
      if (!reqSkills.includes(skillFilter)) return false;
    }
    if (expFilter && req.preferred_experience !== expFilter) return false;
    return true;
  });

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Find a Team</h1>
        <p className="text-slate-600 mb-6">Browse open team requirements and find your match.</p>

        <Card className="mb-6">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2"><Input placeholder="Search hackathons or skills..." onChange={(e) => debouncedSearch(e.target.value)} /></div>
              <Select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
                <option value="">All Skills</option>
                {allSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Select value={expFilter} onChange={(e) => setExpFilter(e.target.value)}>
                <option value="">All Experience</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {filtered.length === 0 ? (
          <Card><EmptyState icon={<Users className="w-8 h-8" />} title="No open team requirements found" description="Try adjusting your filters or create your own requirement." action={<Button onClick={() => navigate('/ready-to-find')}>Create Requirement</Button>} /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((req) => {
              const hackathon = req.hackathon as unknown as Hackathon;
              const owner = req.owner as unknown as { full_name: string; college: string };
              const reqSkills = (req.required_skills || []).map((rs) => rs.skill.name);
              const matchScore = reqSkills.length === 0 ? 50 : Math.round((reqSkills.filter((rs) => userSkills.some((us) => us.toLowerCase() === rs.toLowerCase())).length / reqSkills.length) * 100);
              const days = daysUntil(hackathon?.registration_deadline || null);
              return (
                <Card key={req.id} hover className="cursor-pointer" onClick={() => navigate(`/hackathon/${hackathon?.id}`)}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{hackathon?.name || 'Hackathon'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">by {owner?.full_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn('text-lg font-black', matchScore >= 70 ? 'text-teal-600' : 'text-amber-600')}>{matchScore}%</div>
                        <div className="text-xs text-slate-400">Match</div>
                      </div>
                    </div>
                    {req.idea_description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{req.idea_description}</p>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {reqSkills.slice(0, 3).map((s) => <Badge key={s} variant={userSkills.some((us) => us.toLowerCase() === s.toLowerCase()) ? 'teal' : 'default'}>{s}</Badge>)}
                      {reqSkills.length > 3 && <Badge>+{reqSkills.length - 3}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {req.current_team_size}/{req.required_team_size}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {days !== null ? (days > 0 ? `${days}d left` : 'Closed') : 'TBD'}</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3">View Details</Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
