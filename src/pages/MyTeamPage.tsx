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
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import type { Team, TeamMember, Hackathon, ParticipationResult } from '@/lib/types';
import { Users, Trophy, Plus, UserMinus, Crown, Target } from 'lucide-react';

export function MyTeamPage() {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [teams, setTeams] = useState<(Team & { hackathon?: Hackathon; team_members?: (TeamMember & { profile?: { id: string; full_name: string; college: string; profile_photo: string | null } })[] })[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [resultForm, setResultForm] = useState({ project_name: '', project_description: '', github_url: '', result: 'participated' as ParticipationResult });
  const [saving, setSaving] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const loadData = async () => {
    if (!profile) return;
    const { data: memberTeams } = await supabase.from('team_members').select('team_id').eq('user_id', profile.id);
    const teamIds = (memberTeams || []).map((m) => m.team_id);
    if (teamIds.length === 0) { setTeams([]); setPageLoading(false); return; }

    const { data: teamsData } = await supabase.from('teams').select('*, hackathon:hackathons(*)').in('id', teamIds);
    const teamsList = (teamsData || []) as (Team & { hackathon?: Hackathon })[];

    const teamsWithMembers = [];
    for (const team of teamsList) {
      const { data: members } = await supabase.from('team_members').select('*, profile:profiles!team_members_user_id_fkey(id, full_name, college, profile_photo)').eq('team_id', team.id);
      teamsWithMembers.push({ ...team, team_members: (members || []) as unknown as (TeamMember & { profile?: { id: string; full_name: string; college: string; profile_photo: string | null } })[] });
    }
    setTeams(teamsWithMembers);
    setPageLoading(false);
  };

  useEffect(() => { if (profile) loadData(); }, [profile]);

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId);
    loadData();
  };

  const handleSubmitResult = async () => {
    if (!profile || !selectedTeam) return;
    const team = teams.find((t) => t.id === selectedTeam);
    if (!team) return;
    setSaving(true);
    setResultMsg('');
    const { error } = await supabase.from('hackathon_participations').insert({
      user_id: profile.id,
      team_id: selectedTeam,
      hackathon_id: team.hackathon_id,
      project_name: resultForm.project_name.trim(),
      project_description: resultForm.project_description.trim(),
      github_url: resultForm.github_url.trim() || null,
      result: resultForm.result,
    });
    if (error) {
      setResultMsg(error.message);
    } else {
      setResultMsg('Result submitted! It will appear on your profile once verified by an admin.');
      setResultForm({ project_name: '', project_description: '', github_url: '', result: 'participated' });
    }
    setSaving(false);
  };

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">My Teams</h1>
        <p className="text-slate-600 mb-6">Manage your hackathon teams and submit results.</p>

        {teams.length === 0 ? (
          <Card><EmptyState icon={<Users className="w-8 h-8" />} title="No teams yet" description="Join or create a team to get started." action={<Button onClick={() => navigate('/ready-to-get-in')}>Find a Team</Button>} /></Card>
        ) : (
          <div className="space-y-6">
            {teams.map((team) => {
              const hackathon = team.hackathon as unknown as Hackathon;
              const isOwner = team.owner_id === profile?.id;
              return (
                <Card key={team.id}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-black text-slate-900 text-lg">{team.name}</h3>
                        <p className="text-sm text-slate-500">{hackathon?.name} · {hackathon?.category}</p>
                      </div>
                      <Badge variant={team.status === 'recruiting' ? 'green' : team.status === 'full' ? 'amber' : 'slate'}>{team.status}</Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-700 mb-2">Members ({team.team_members?.length || 0}/{hackathon?.max_team_size || 4})</p>
                      <div className="space-y-2">
                        {team.team_members?.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                            <Avatar name={m.profile?.full_name || 'User'} photo={m.profile?.profile_photo} size="sm" />
                            <button onClick={() => navigate(`/profile/${m.profile?.id}`)} className="font-semibold text-slate-900 text-sm hover:text-teal-600">{m.profile?.full_name}</button>
                            <span className="text-xs text-slate-500">{m.profile?.college}</span>
                            {m.role === 'owner' && <Badge variant="amber"><Crown className="w-3 h-3" /> Owner</Badge>}
                            {isOwner && m.role !== 'owner' && (
                              <Button size="sm" variant="ghost" className="ml-auto text-red-600 hover:bg-red-50" onClick={() => handleRemoveMember(m.id)}><UserMinus className="w-3.5 h-3.5" /> Remove</Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <Button size="sm" onClick={() => { setSelectedTeam(team.id); setShowResultModal(true); setResultMsg(''); }}>
                        <Trophy className="w-3.5 h-3.5" /> Submit Result
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showResultModal} onClose={() => setShowResultModal(false)} title="Submit Hackathon Result">
        {resultMsg ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-4"><Trophy className="w-8 h-8" /></div>
            <p className="text-sm text-slate-600 mb-6">{resultMsg}</p>
            <Button onClick={() => setShowResultModal(false)} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Project Name" value={resultForm.project_name} onChange={(e) => setResultForm({ ...resultForm, project_name: e.target.value })} placeholder="AI-Powered Chatbot" />
            <Textarea label="Project Description" value={resultForm.project_description} onChange={(e) => setResultForm({ ...resultForm, project_description: e.target.value })} placeholder="What did you build?" />
            <Input label="GitHub URL" value={resultForm.github_url} onChange={(e) => setResultForm({ ...resultForm, github_url: e.target.value })} placeholder="https://github.com/..." />
            <Select label="Result" value={resultForm.result} onChange={(e) => setResultForm({ ...resultForm, result: e.target.value as ParticipationResult })}>
              <option value="participated">Participated</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="finalist">Finalist</option>
              <option value="winner">Winner</option>
            </Select>
            <p className="text-xs text-slate-500">Your result will be pending verification. Only verified results appear in official statistics.</p>
            <Button onClick={handleSubmitResult} className="w-full" disabled={saving}>{saving ? <Spinner className="w-5 h-5 text-white" /> : 'Submit Result'}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
