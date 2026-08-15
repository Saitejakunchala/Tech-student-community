import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { cn, formatDate } from '@/lib/utils';
import type { Profile, Hackathon, HackathonParticipation, Report } from '@/lib/types';
import { Users, Trophy, Target, FileText, Flag, CheckCircle2, XCircle, Shield, BarChart3, Plus, Edit3, Ban, Check, AlertTriangle } from 'lucide-react';

type Tab = 'overview' | 'users' | 'hackathons' | 'verification' | 'reports';

export function AdminPage() {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (!cancelled) {
        setIsAuthorized(!!isAdmin);
        setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [loading, profile]);

  if (loading || !authChecked) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Card className="max-w-2xl mx-auto mt-20">
          <EmptyState icon={<Shield className="w-8 h-8" />} title="Access Denied" description="You need administrator privileges to access this page." action={<Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>} />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-slate-600 mb-6">Manage users, hackathons, and verify achievements.</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {([
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'hackathons', label: 'Hackathons', icon: Trophy },
            { id: 'verification', label: 'Verification', icon: CheckCircle2 },
            { id: 'reports', label: 'Reports', icon: Flag },
          ] as { id: Tab; label: string; icon: typeof Users }[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap',
                tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'hackathons' && <HackathonsTab />}
        {tab === 'verification' && <VerificationTab />}
        {tab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, totalHackathons: 0, totalTeams: 0, openReqs: 0, pendingVerifications: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('is_suspended', false),
      supabase.from('hackathons').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('team_requirements').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('hackathon_participations').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ]).then(([s1, s2, s3, s4, s5, s6, s7]) => {
      setStats({
        totalStudents: s1.count || 0, activeStudents: s2.count || 0, totalHackathons: s3.count || 0,
        totalTeams: s4.count || 0, openReqs: s5.count || 0, pendingVerifications: s6.count || 0, reports: s7.count || 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  const cards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-teal-500 to-cyan-600' },
    { label: 'Active Students', value: stats.activeStudents, icon: Users, color: 'from-emerald-500 to-teal-600' },
    { label: 'Total Hackathons', value: stats.totalHackathons, icon: Trophy, color: 'from-amber-500 to-orange-600' },
    { label: 'Total Teams', value: stats.totalTeams, icon: Target, color: 'from-blue-500 to-indigo-600' },
    { label: 'Open Requirements', value: stats.openReqs, icon: FileText, color: 'from-purple-500 to-pink-600' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: CheckCircle2, color: 'from-red-500 to-rose-600' },
    { label: 'Reports', value: stats.reports, icon: Flag, color: 'from-slate-600 to-slate-800' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', c.color)}><c.icon className="w-5 h-5" /></div>
              <div><p className="text-2xl font-black text-slate-900">{c.value}</p><p className="text-xs text-slate-500 font-semibold">{c.label}</p></div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const { navigate } = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setUsers((data || []) as Profile[]);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) => !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.college.toLowerCase().includes(search.toLowerCase()));

  const toggleSuspend = async (user: Profile) => {
    await supabase.from('profiles').update({ is_suspended: !user.is_suspended }).eq('id', user.id);
    setUsers(users.map((u) => u.id === user.id ? { ...u, is_suspended: !u.is_suspended } : u));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <Card>
      <CardBody>
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />
        {filtered.length === 0 ? <EmptyState icon={<Users className="w-8 h-8" />} title="No users found" /> : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Avatar name={u.full_name} photo={u.profile_photo} size="sm" />
                <div className="flex-1 min-w-0">
                  <button onClick={() => navigate(`/profile/${u.id}`)} className="font-semibold text-slate-900 text-sm hover:text-teal-600">{u.full_name}</button>
                  <p className="text-xs text-slate-500 truncate">{u.email} · {u.college}</p>
                </div>
                {u.is_suspended && <Badge variant="red">Suspended</Badge>}
                <Button size="sm" variant={u.is_suspended ? 'success' : 'outline'} onClick={() => toggleSuspend(u)}>
                  {u.is_suspended ? <><Check className="w-3.5 h-3.5" /> Reactivate</> : <><Ban className="w-3.5 h-3.5" /> Suspend</>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function HackathonsTab() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Hackathon | null>(null);
  const [form, setForm] = useState({ name: '', platform: '', url: '', category: 'General', description: '', registration_deadline: '', start_date: '', end_date: '', max_team_size: 4, required_skills: '', status: 'open' });
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    supabase.from('hackathons').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setHackathons((data || []) as Hackathon[]);
      setLoading(false);
    });
  };
  useEffect(loadData, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', platform: '', url: '', category: 'General', description: '', registration_deadline: '', start_date: '', end_date: '', max_team_size: 4, required_skills: '', status: 'open' });
    setShowModal(true);
  };

  const openEdit = (h: Hackathon) => {
    setEditing(h);
    setForm({
      name: h.name, platform: h.platform, url: h.url || '', category: h.category, description: h.description,
      registration_deadline: h.registration_deadline || '', start_date: h.start_date || '', end_date: h.end_date || '',
      max_team_size: h.max_team_size, required_skills: h.required_skills.join(', '), status: h.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name.trim(), platform: form.platform.trim(), url: form.url.trim() || null,
      category: form.category, description: form.description.trim(),
      registration_deadline: form.registration_deadline || null, start_date: form.start_date || null,
      end_date: form.end_date || null, max_team_size: form.max_team_size,
      required_skills: form.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
      status: form.status,
    };
    if (editing) {
      await supabase.from('hackathons').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('hackathons').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  };

  const toggleStatus = async (h: Hackathon) => {
    await supabase.from('hackathons').update({ status: h.status === 'open' ? 'closed' : 'open' }).eq('id', h.id);
    loadData();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4"><Button onClick={openCreate}><Plus className="w-4 h-4" /> Create Hackathon</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hackathons.map((h) => (
          <Card key={h.id}>
            <CardBody>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 truncate">{h.name}</h3>
                <Badge variant={h.status === 'open' ? 'green' : 'slate'}>{h.status}</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">{h.platform} · {h.category}</p>
              <p className="text-xs text-slate-500 mb-3">Deadline: {formatDate(h.registration_deadline)}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(h)}><Edit3 className="w-3.5 h-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(h)}>{h.status === 'open' ? 'Close' : 'Reopen'}</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Hackathon' : 'Create Hackathon'} size="lg">
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <Input label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Reg. Deadline" type="date" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} />
            <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max Team Size" type="number" min={2} max={10} value={form.max_team_size} onChange={(e) => setForm({ ...form, max_team_size: parseInt(e.target.value) || 4 })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <Input label="Required Skills (comma-separated)" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} placeholder="Python, React, AI/ML" />
          <Button onClick={handleSave} className="w-full" disabled={saving || !form.name.trim()}>{saving ? <Spinner className="w-5 h-5 text-white" /> : 'Save'}</Button>
        </div>
      </Modal>
    </div>
  );
}

function VerificationTab() {
  const [pending, setPending] = useState<HackathonParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const loadData = () => {
    supabase.from('hackathon_participations').select('*, hackathon:hackathons(*)').eq('verification_status', 'pending').order('created_at', { ascending: false }).then(({ data }) => {
      setPending((data || []) as HackathonParticipation[]);
      setLoading(false);
    });
  };
  useEffect(loadData, []);

  const handleVerify = async (id: string) => {
    setActing(id);
    await supabase.from('hackathon_participations').update({ verification_status: 'verified' }).eq('id', id);
    setActing(null);
    loadData();
  };

  const handleReject = async (id: string) => {
    setActing(id);
    await supabase.from('hackathon_participations').update({ verification_status: 'rejected' }).eq('id', id);
    setActing(null);
    loadData();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <Card>
      <CardBody>
        <CardTitle className="mb-4">Pending Achievement Verifications</CardTitle>
        {pending.length === 0 ? <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="No pending verifications" description="All achievements have been reviewed." /> : (
          <div className="space-y-3">
            {pending.map((p) => {
              const hackathon = p.hackathon as unknown as { name: string };
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{hackathon?.name || 'Hackathon'}</p>
                      <Badge variant="amber" className="mt-1">{p.result}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => handleVerify(p.id)} disabled={!!acting}><CheckCircle2 className="w-3.5 h-3.5" /> Verify</Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(p.id)} disabled={!!acting}><XCircle className="w-3.5 h-3.5" /> Reject</Button>
                    </div>
                  </div>
                  {p.project_name && <p className="text-sm font-semibold text-slate-700">{p.project_name}</p>}
                  {p.project_description && <p className="text-sm text-slate-600">{p.project_description}</p>}
                  {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:text-teal-700 font-semibold">View on GitHub</a>}
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(full_name)').eq('status', 'open').order('created_at', { ascending: false }).then(({ data }) => {
      setReports((data || []) as Report[]);
      setLoading(false);
    });
  }, []);

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    await supabase.from('reports').update({ status }).eq('id', id);
    setReports(reports.filter((r) => r.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <Card>
      <CardBody>
        <CardTitle className="mb-4">Content Reports</CardTitle>
        {reports.length === 0 ? <EmptyState icon={<Flag className="w-8 h-8" />} title="No open reports" description="All reports have been resolved." /> : (
          <div className="space-y-3">
            {reports.map((r) => {
              const reporter = r.reporter as unknown as { full_name: string };
              return (
                <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <Badge variant="blue">{r.target_type}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => handleResolve(r.id, 'resolved')}><Check className="w-3.5 h-3.5" /> Resolve</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleResolve(r.id, 'dismissed')}>Dismiss</Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{r.reason}</p>
                  <p className="text-xs text-slate-400 mt-1">Reported by {reporter?.full_name || 'Unknown'}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
