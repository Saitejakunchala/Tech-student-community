import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { TeamRequirement, Hackathon, JoinRequest } from '@/lib/types';
import { FileText, Users, Calendar, CheckCircle2, XCircle, Clock, Edit3, Eye } from 'lucide-react';

export function MyPostsPage() {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [requirements, setRequirements] = useState<TeamRequirement[]>([]);
  const [requestsMap, setRequestsMap] = useState<Record<string, JoinRequest[]>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [editingReq, setEditingReq] = useState<TeamRequirement | null>(null);
  const [editForm, setEditForm] = useState({ idea_description: '', required_team_size: 4, preferred_experience: 'intermediate', status: 'open' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!profile) return;
    const { data: reqs } = await supabase.from('team_requirements').select('*, hackathon:hackathons(*)').eq('owner_id', profile.id).order('created_at', { ascending: false });
    const reqList = (reqs || []) as TeamRequirement[];
    setRequirements(reqList);

    const map: Record<string, JoinRequest[]> = {};
    for (const req of reqList) {
      const { data: reqs2 } = await supabase.from('join_requests').select('*, sender:profiles!join_requests_sender_id_fkey(*)').eq('requirement_id', req.id).order('created_at', { ascending: false });
      map[req.id] = (reqs2 || []) as JoinRequest[];
    }
    setRequestsMap(map);
    setPageLoading(false);
  };

  useEffect(() => { if (profile) loadData(); }, [profile]);

  const handleAccept = async (reqId: string) => {
    setSaving(true);
    await supabase.rpc('accept_join_request', { p_request_id: reqId });
    setSaving(false);
    loadData();
  };

  const handleReject = async (reqId: string) => {
    setSaving(true);
    await supabase.rpc('reject_join_request', { p_request_id: reqId });
    setSaving(false);
    loadData();
  };

  const handleSaveEdit = async () => {
    if (!editingReq) return;
    setSaving(true);
    await supabase.from('team_requirements').update({
      idea_description: editForm.idea_description,
      required_team_size: editForm.required_team_size,
      preferred_experience: editForm.preferred_experience,
      status: editForm.status,
    }).eq('id', editingReq.id);
    setSaving(false);
    setEditingReq(null);
    loadData();
  };

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Posts</h1>
            <p className="text-slate-600 mt-1">Manage your team requirements and applications.</p>
          </div>
          <Button onClick={() => navigate('/ready-to-find')}>Create New</Button>
        </div>

        {requirements.length === 0 ? (
          <Card><EmptyState icon={<FileText className="w-8 h-8" />} title="No posts yet" description="Create a team requirement to find teammates." action={<Button onClick={() => navigate('/ready-to-find')}>Create Requirement</Button>} /></Card>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => {
              const hackathon = req.hackathon as unknown as Hackathon;
              const reqs = requestsMap[req.id] || [];
              const pendingCount = reqs.filter((r) => r.status === 'pending').length;
              return (
                <Card key={req.id}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{hackathon?.name || 'Hackathon'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Deadline: {formatDate(hackathon?.registration_deadline || null)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={req.status === 'open' ? 'green' : 'slate'}>{req.status}</Badge>
                        <Badge variant="blue"><Users className="w-3.5 h-3.5" /> {req.current_team_size}/{req.required_team_size}</Badge>
                        {pendingCount > 0 && <Badge variant="amber">{pendingCount} pending</Badge>}
                      </div>
                    </div>
                    {req.idea_description && <p className="text-sm text-slate-600 mb-3">{req.idea_description}</p>}
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/hackathon/${hackathon?.id}`)}><Eye className="w-3.5 h-3.5" /> View</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingReq(req); setEditForm({ idea_description: req.idea_description, required_team_size: req.required_team_size, preferred_experience: req.preferred_experience, status: req.status }); }}><Edit3 className="w-3.5 h-3.5" /> Edit</Button>
                      {req.status === 'open' && <Button size="sm" variant="ghost" onClick={async () => { await supabase.from('team_requirements').update({ status: 'closed' }).eq('id', req.id); loadData(); }}>Close</Button>}
                    </div>

                    {reqs.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-sm font-bold text-slate-700 mb-3">Applications ({reqs.length})</p>
                        <div className="space-y-2">
                          {reqs.map((r) => {
                            const sender = r.sender as unknown as { full_name: string; college: string; id: string };
                            return (
                              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                                <Avatar name={sender?.full_name || 'User'} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <button onClick={() => navigate(`/profile/${sender?.id}`)} className="font-semibold text-slate-900 text-sm hover:text-teal-600">{sender?.full_name}</button>
                                  {r.message && <p className="text-xs text-slate-500 truncate">{r.message}</p>}
                                </div>
                                <Badge variant={r.status === 'pending' ? 'amber' : r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : 'slate'}>
                                  {r.status === 'pending' ? <Clock className="w-3 h-3" /> : r.status === 'accepted' ? <CheckCircle2 className="w-3 h-3" /> : r.status === 'rejected' ? <XCircle className="w-3 h-3" /> : null}
                                  {r.status}
                                </Badge>
                                {r.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={() => handleAccept(r.id)} disabled={saving}>Accept</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} disabled={saving}>Reject</Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!editingReq} onClose={() => setEditingReq(null)} title="Edit Requirement">
        <div className="space-y-4">
          <Textarea label="Project Idea" value={editForm.idea_description} onChange={(e) => setEditForm({ ...editForm, idea_description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="block text-sm font-semibold text-slate-700">Team Size</span>
              <input type="number" min={2} max={10} value={editForm.required_team_size} onChange={(e) => setEditForm({ ...editForm, required_team_size: parseInt(e.target.value) || 2 })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </label>
            <label className="space-y-1.5">
              <span className="block text-sm font-semibold text-slate-700">Status</span>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="filled">Filled</option>
              </select>
            </label>
          </div>
          <Button onClick={handleSaveEdit} className="w-full" disabled={saving}>{saving ? <Spinner className="w-5 h-5 text-white" /> : 'Save Changes'}</Button>
        </div>
      </Modal>
    </div>
  );
}
