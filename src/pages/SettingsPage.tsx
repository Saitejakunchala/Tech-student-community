import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import type { Skill, Strength, Project, ExperienceLevel } from '@/lib/types';
import { Upload, Plus, X, Check, Trash2, Github, Linkedin, Code } from 'lucide-react';

export function SettingsPage() {
  const { profile, refreshProfile, loading } = useAuth();
  const { navigate } = useRouter();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [allStrengths, setAllStrengths] = useState<Strength[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userStrengths, setUserStrengths] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', technologies: '', github_url: '' });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [form, setForm] = useState({
    full_name: '', college: '', branch: '', year: '', bio: '', experience_level: 'beginner' as ExperienceLevel,
    public_profile: true, github_url: '', linkedin_url: '', leetcode_url: '',
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name, college: profile.college, branch: profile.branch, year: profile.year,
      bio: profile.bio, experience_level: profile.experience_level, public_profile: profile.public_profile,
      github_url: profile.github_url || '', linkedin_url: profile.linkedin_url || '', leetcode_url: profile.leetcode_url || '',
    });
    Promise.all([
      supabase.from('skills').select('*').order('name'),
      supabase.from('strengths').select('*').order('name'),
      supabase.from('profile_skills').select('skill_id').eq('profile_id', profile.id),
      supabase.from('profile_strengths').select('strength_id').eq('profile_id', profile.id),
      supabase.from('projects').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
    ]).then(([skRes, stRes, usRes, ustRes, projRes]) => {
      setAllSkills(skRes.data as Skill[] || []);
      setAllStrengths(stRes.data as Strength[] || []);
      setUserSkills((usRes.data || []).map((s) => (s as { skill_id: string }).skill_id));
      setUserStrengths((ustRes.data || []).map((s) => (s as { strength_id: string }).strength_id));
      setProjects((projRes.data || []) as Project[]);
    });
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setSaving(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ profile_photo: urlData.publicUrl }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: form.full_name.trim(), college: form.college.trim(), branch: form.branch.trim(),
      year: form.year.trim(), bio: form.bio.trim(), experience_level: form.experience_level,
      public_profile: form.public_profile, github_url: form.github_url.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null, leetcode_url: form.leetcode_url.trim() || null,
    }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSavedMsg('Profile saved!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const saveSkills = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profile_skills').delete().eq('profile_id', profile.id);
    if (userSkills.length > 0) {
      await supabase.from('profile_skills').insert(userSkills.map((skill_id) => ({ profile_id: profile.id, skill_id })));
    }
    setSaving(false);
    setSavedMsg('Skills saved!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const saveStrengths = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profile_strengths').delete().eq('profile_id', profile.id);
    if (userStrengths.length > 0) {
      await supabase.from('profile_strengths').insert(userStrengths.map((strength_id) => ({ profile_id: profile.id, strength_id })));
    }
    setSaving(false);
    setSavedMsg('Strengths saved!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const addProject = async () => {
    if (!profile || !newProject.name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('projects').insert({
      user_id: profile.id, name: newProject.name.trim(), description: newProject.description.trim(),
      technologies: newProject.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      github_url: newProject.github_url.trim() || null,
    }).select().single();
    if (data) setProjects([data as Project, ...projects]);
    setNewProject({ name: '', description: '', technologies: '', github_url: '' });
    setSaving(false);
  };

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Settings</h1>
        {savedMsg && <div className="mb-4 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-700 font-medium flex items-center gap-2"><Check className="w-4 h-4" /> {savedMsg}</div>}

        {/* Basic Info */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">Basic Information</CardTitle>
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={profile.full_name} photo={profile.profile_photo} size="lg" />
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Upload className="w-4 h-4" /> Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <div className="space-y-3">
              <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="College" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
                <Input label="Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                <Select label="Experience Level" value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value as ExperienceLevel })}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.public_profile} onChange={(e) => setForm({ ...form, public_profile: e.target.checked })} className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500" />
                <span className="text-sm font-semibold text-slate-700">Public profile (others can view your profile)</span>
              </label>
              <Button onClick={saveProfile} disabled={saving}>{saving ? <Spinner className="w-5 h-5 text-white" /> : 'Save Profile'}</Button>
            </div>
          </CardBody>
        </Card>

        {/* Skills */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">Skills</CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {allSkills.map((s) => {
                const selected = userSkills.includes(s.id);
                return (
                  <button key={s.id} onClick={() => setUserSkills(selected ? userSkills.filter((id) => id !== s.id) : [...userSkills, s.id])}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${selected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                    {selected && <Check className="w-4 h-4" />}{s.name}
                  </button>
                );
              })}
            </div>
            <Button size="sm" onClick={saveSkills} disabled={saving}>Save Skills</Button>
          </CardBody>
        </Card>

        {/* Strengths */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">Strengths</CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {allStrengths.map((s) => {
                const selected = userStrengths.includes(s.id);
                return (
                  <button key={s.id} onClick={() => setUserStrengths(selected ? userStrengths.filter((id) => id !== s.id) : [...userStrengths, s.id])}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${selected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                    {selected && <Check className="w-4 h-4" />}{s.name}
                  </button>
                );
              })}
            </div>
            <Button size="sm" onClick={saveStrengths} disabled={saving}>Save Strengths</Button>
          </CardBody>
        </Card>

        {/* External Links */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">External Profiles</CardTitle>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><Github className="w-5 h-5 text-slate-700 shrink-0" /><Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/username" /></div>
              <div className="flex items-center gap-3"><Linkedin className="w-5 h-5 text-blue-600 shrink-0" /><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" /></div>
              <div className="flex items-center gap-3"><Code className="w-5 h-5 text-amber-600 shrink-0" /><Input value={form.leetcode_url} onChange={(e) => setForm({ ...form, leetcode_url: e.target.value })} placeholder="https://leetcode.com/username" /></div>
            </div>
            <Button size="sm" className="mt-4" onClick={saveProfile} disabled={saving}>Save Links</Button>
          </CardBody>
        </Card>

        {/* Projects */}
        <Card>
          <CardBody>
            <CardTitle className="mb-4">Projects</CardTitle>
            {projects.length > 0 && (
              <div className="space-y-2 mb-4">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                      {p.technologies.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{p.technologies.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
                    </div>
                    <button onClick={() => deleteProject(p.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <Input label="Project Name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder="Project name" />
              <Textarea label="Description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} placeholder="What does it do?" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Technologies" value={newProject.technologies} onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })} placeholder="Python, React" />
                <Input label="GitHub URL" value={newProject.github_url} onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })} placeholder="https://github.com/..." />
              </div>
              <Button size="sm" onClick={addProject} disabled={saving}><Plus className="w-4 h-4" /> Add Project</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
