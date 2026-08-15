import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullSpinner, Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { cn, formatDate, daysUntil, debounce } from '@/lib/utils';
import type { Hackathon, TeamRequirement } from '@/lib/types';
import { Search, Trophy, Calendar, Users, ExternalLink } from 'lucide-react';

export function HackathonsPage() {
  const { loading } = useAuth();
  const { navigate } = useRouter();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filtered, setFiltered] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const debouncedSearch = useCallback(debounce((v: string) => setSearch(v), 300), []);

  useEffect(() => {
    supabase.from('hackathons').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setHackathons((data || []) as Hackathon[]);
      setFiltered((data || []) as Hackathon[]);
      setPageLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = hackathons;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(s) || h.category.toLowerCase().includes(s) || h.platform.toLowerCase().includes(s));
    }
    if (category) result = result.filter((h) => h.category === category);
    if (status) result = result.filter((h) => h.status === status);
    setFiltered(result);
  }, [hackathons, search, category, status]);

  const categories = [...new Set(hackathons.map((h) => h.category))].filter(Boolean);

  if (loading) return <FullSpinner />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hackathons</h1>
          <p className="text-slate-600 mt-1">Discover hackathons and find your team.</p>
        </div>

        <Card className="mb-6">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Input placeholder="Search hackathons..." onChange={(e) => debouncedSearch(e.target.value)} />
              </div>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {pageLoading ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Trophy className="w-8 h-8" />}
              title="No hackathons found"
              description={search || category || status ? "Try adjusting your filters." : "No hackathons have been published yet."}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((h) => {
              const days = daysUntil(h.registration_deadline);
              return (
                <Card key={h.id} hover className="cursor-pointer" onClick={() => navigate(`/hackathon/${h.id}`)}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{h.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{h.platform}</p>
                      </div>
                      <Badge variant={h.status === 'open' ? 'green' : 'slate'}>
                        {h.status === 'open' ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <Badge variant="blue" className="mb-3">{h.category}</Badge>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{h.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {h.required_skills.slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                      {h.required_skills.length > 3 && <Badge>+{h.required_skills.length - 3}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Max {h.max_team_size}</span>
                      <span className={cn('flex items-center gap-1 font-semibold', days !== null && days <= 7 && days >= 0 ? 'text-red-600' : '')}>
                        <Calendar className="w-3.5 h-3.5" />
                        {days !== null ? (days > 0 ? `${days}d left` : 'Closed') : 'TBD'}
                      </span>
                    </div>
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

export function HackathonDetailPage({ hackathonId }: { hackathonId: string }) {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [requirements, setRequirements] = useState<TeamRequirement[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; status: string; team_members: { user_id: string }[] }[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [requestResult, setRequestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('hackathons').select('*').eq('id', hackathonId).maybeSingle(),
      supabase.from('team_requirements').select('*, owner:profiles!team_requirements_owner_id_fkey(*)').eq('hackathon_id', hackathonId).eq('status', 'open'),
      supabase.from('teams').select('*, team_members(*)').eq('hackathon_id', hackathonId),
      supabase.from('profile_skills').select('skill:skills(name)').eq('profile_id', profile.id),
    ]).then(([hRes, reqRes, teamRes, skillRes]) => {
      setHackathon(hRes.data as Hackathon | null);
      setRequirements((reqRes.data || []) as TeamRequirement[]);
      setTeams((teamRes.data || []) as typeof teams);
      setUserSkills(((skillRes.data || []) as unknown as { skill: { name: string } }[]).map((s) => s.skill.name));
      setPageLoading(false);
    });
  }, [hackathonId, profile]);

  const handleSendRequest = async (req: TeamRequirement) => {
    if (!profile) return;
    setSending(true);
    setRequestResult(null);

    // Check for duplicate
    const { data: existing } = await supabase
      .from('join_requests')
      .select('id')
      .eq('sender_id', profile.id)
      .eq('requirement_id', req.id)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      setRequestResult({ success: false, message: 'You already have a pending request for this team.' });
      setSending(false);
      return;
    }

    const { error } = await supabase.from('join_requests').insert({
      sender_id: profile.id,
      requirement_id: req.id,
      message: requestMessage.trim(),
    });

    if (error) {
      setRequestResult({ success: false, message: error.message });
    } else {
      // Notify the requirement owner
      await supabase.rpc('create_notification', {
        p_recipient_id: req.owner_id,
        p_type: 'join_request',
        p_title: 'New Join Request',
        p_message: `${profile.full_name} wants to join your team.`,
        p_related_id: req.id,
      });
      setRequestResult({ success: true, message: 'Your request has been sent!' });
    }
    setSending(false);
  };

  if (loading || pageLoading) return <FullSpinner />;

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Card className="max-w-2xl mx-auto mt-20">
          <EmptyState icon={<Trophy className="w-8 h-8" />} title="Hackathon not found" description="This hackathon may have been removed." action={<Button onClick={() => navigate('/hackathons')}>Back to Hackathons</Button>} />
        </Card>
      </div>
    );
  }

  const matchScore = hackathon.required_skills.length === 0
    ? 50
    : Math.round((hackathon.required_skills.filter((rs) => userSkills.some((us) => us.toLowerCase() === rs.toLowerCase())).length / hackathon.required_skills.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/hackathons')} className="text-sm text-slate-500 hover:text-slate-700 font-medium mb-4">
          ← Back to Hackathons
        </button>

        {/* Header */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{hackathon.name}</h1>
                <p className="text-slate-500 mt-1">{hackathon.platform}</p>
              </div>
              <Badge variant={hackathon.status === 'open' ? 'green' : 'slate'}>{hackathon.status === 'open' ? 'Open' : 'Closed'}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="blue">{hackathon.category}</Badge>
              <Badge><Users className="w-3.5 h-3.5" /> Max {hackathon.max_team_size}</Badge>
              <Badge><Calendar className="w-3.5 h-3.5" /> Deadline: {formatDate(hackathon.registration_deadline)}</Badge>
            </div>
            <p className="text-slate-600">{hackathon.description}</p>
            {hackathon.url && (
              <a href={hackathon.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-teal-600 hover:text-teal-700">
                <ExternalLink className="w-4 h-4" /> Visit Hackathon
              </a>
            )}
          </CardBody>
        </Card>

        {/* Match Score */}
        <Card className="mb-6">
          <CardBody>
            <h2 className="font-black text-slate-900 text-lg mb-4">Why You Match</h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className={cn('text-4xl font-black', matchScore >= 70 ? 'text-teal-600' : matchScore >= 40 ? 'text-amber-600' : 'text-slate-400')}>{matchScore}%</div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Overall Match</div>
              </div>
              <div className="flex-1 space-y-2">
                <MatchBar label="Required Skills" score={matchScore} />
                <MatchBar label="Experience" score={Math.max(0, 100 - Math.abs((profile?.experience_level === 'beginner' ? 1 : profile?.experience_level === 'intermediate' ? 2 : 3) - 2) * 40)} />
                <MatchBar label="Interest" score={50} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100">
              {hackathon.required_skills.map((s) => {
                const matched = userSkills.some((us) => us.toLowerCase() === s.toLowerCase());
                return <Badge key={s} variant={matched ? 'teal' : 'default'}>{matched ? '✓' : ''} {s}</Badge>;
              })}
            </div>
          </CardBody>
        </Card>

        {/* Open Team Requirements */}
        <h2 className="text-xl font-black text-slate-900 mb-4">Open Team Requirements</h2>
        {requirements.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No open team requirements"
              description="Be the first to create a team requirement for this hackathon."
              action={<Button onClick={() => navigate('/ready-to-find')}>Create Requirement</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => {
              const owner = req.owner as unknown as { full_name: string; college: string; experience_level: string };
              const reqSkills = (req.required_skills || []).map((rs: { skill_id: string; importance: string; skill: { name: string } }) => rs.skill.name);
              const reqMatch = reqSkills.length === 0 ? 50 : Math.round((reqSkills.filter((rs: string) => userSkills.some((us: string) => us.toLowerCase() === rs.toLowerCase())).length / reqSkills.length) * 100);
              return (
                <Card key={req.id} hover>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{owner?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{owner?.college} · {owner?.experience_level}</p>
                      </div>
                      <div className="text-right">
                        <div className={cn('text-xl font-black', reqMatch >= 70 ? 'text-teal-600' : 'text-amber-600')}>{reqMatch}%</div>
                        <div className="text-xs text-slate-400">Match</div>
                      </div>
                    </div>
                    {req.idea_description && <p className="text-sm text-slate-600 mb-3">{req.idea_description}</p>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {reqSkills.map((s: string) => (
                        <Badge key={s} variant={userSkills.some((us) => us.toLowerCase() === s.toLowerCase()) ? 'teal' : 'default'}>{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Team {req.current_team_size}/{req.required_team_size} · Prefers {req.preferred_experience}</span>
                      <Button size="sm" onClick={() => { setSelectedReqId(req.id); setShowRequestModal(true); setRequestMessage(''); setRequestResult(null); }}>
                        Request to Join
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Modal open={showRequestModal} onClose={() => setShowRequestModal(false)} title="Join Team Request">
        {requestResult ? (
          <div className="text-center py-6">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4', requestResult.success ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600')}>
              {requestResult.success ? <Trophy className="w-8 h-8" /> : <span className="text-2xl">!</span>}
            </div>
            <p className="text-sm text-slate-600 mb-6">{requestResult.message}</p>
            <Button onClick={() => setShowRequestModal(false)} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea label="Message to team owner" value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Hi! I'm interested in joining your team..." rows={4} />
            <Button onClick={() => {
              const req = requirements.find((r) => r.id === selectedReqId);
              if (req) handleSendRequest(req);
            }} className="w-full" disabled={sending}>
              {sending ? <Spinner className="w-5 h-5 text-white" /> : 'Send Request'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MatchBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{score}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', score >= 70 ? 'bg-teal-500' : score >= 40 ? 'bg-amber-500' : 'bg-slate-400')} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
