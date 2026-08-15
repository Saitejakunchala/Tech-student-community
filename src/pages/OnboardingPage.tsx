import { useState, useEffect } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Skill, Strength, ExperienceLevel } from '@/lib/types';
import { Check, ArrowRight, ArrowLeft, Upload, Plus, X, Github, Linkedin, Code } from 'lucide-react';

const STEPS = ['Basic Info', 'Skills', 'Strengths', 'Experience', 'External Profiles'];

export function OnboardingPage() {
  const { navigate } = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [strengths, setStrengths] = useState<Strength[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [projects, setProjects] = useState<{ name: string; description: string; technologies: string; github_url: string }[]>([]);
  const [basicForm, setBasicForm] = useState({
    full_name: '',
    college: '',
    branch: '',
    year: '',
    bio: '',
    experience_level: 'beginner' as ExperienceLevel,
    profile_photo: '',
  });
  const [links, setLinks] = useState({ github_url: '', linkedin_url: '', leetcode_url: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setBasicForm({
        full_name: profile.full_name || '',
        college: profile.college || '',
        branch: profile.branch || '',
        year: profile.year || '',
        bio: profile.bio || '',
        experience_level: profile.experience_level || 'beginner',
        profile_photo: profile.profile_photo || '',
      });
      setLinks({
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        leetcode_url: profile.leetcode_url || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    Promise.all([
      supabase.from('skills').select('*').order('name'),
      supabase.from('strengths').select('*').order('name'),
    ]).then(([skillRes, strengthRes]) => {
      if (skillRes.data) setSkills(skillRes.data as Skill[]);
      if (strengthRes.data) setStrengths(strengthRes.data as Strength[]);
    });
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setLoading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setError(upErr.message);
      setLoading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setBasicForm({ ...basicForm, profile_photo: urlData.publicUrl });
    setLoading(false);
  };

  const saveBasicInfo = async (): Promise<boolean> => {
    if (!profile) return false;
    setError('');
    if (!basicForm.full_name.trim() || !basicForm.college.trim() || !basicForm.branch.trim()) {
      setError('Please fill in your name, college, and branch.');
      return false;
    }
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: basicForm.full_name.trim(),
        college: basicForm.college.trim(),
        branch: basicForm.branch.trim(),
        year: basicForm.year.trim(),
        bio: basicForm.bio.trim(),
        experience_level: basicForm.experience_level,
        profile_photo: basicForm.profile_photo || null,
      })
      .eq('id', profile.id);
    if (updateErr) {
      setError(updateErr.message);
      return false;
    }
    await refreshProfile();
    return true;
  };

  const saveSkills = async () => {
    if (!profile) return true;
    if (selectedSkills.length === 0) {
      setError('Select at least one skill.');
      return false;
    }
    const rows = selectedSkills.map((skill_id) => ({ profile_id: profile.id, skill_id }));
    const { error: delErr } = await supabase.from('profile_skills').delete().eq('profile_id', profile.id);
    if (delErr) { setError(delErr.message); return false; }
    const { error: insErr } = await supabase.from('profile_skills').insert(rows);
    if (insErr) { setError(insErr.message); return false; }
    return true;
  };

  const saveStrengths = async () => {
    if (!profile) return true;
    if (selectedStrengths.length === 0) {
      setError('Select at least one strength.');
      return false;
    }
    const rows = selectedStrengths.map((strength_id) => ({ profile_id: profile.id, strength_id }));
    const { error: delErr } = await supabase.from('profile_strengths').delete().eq('profile_id', profile.id);
    if (delErr) { setError(delErr.message); return false; }
    const { error: insErr } = await supabase.from('profile_strengths').insert(rows);
    if (insErr) { setError(insErr.message); return false; }
    return true;
  };

  const saveProjects = async () => {
    if (!profile) return true;
    const validProjects = projects.filter((p) => p.name.trim());
    for (const proj of validProjects) {
      const { error: projErr } = await supabase.from('projects').insert({
        user_id: profile.id,
        name: proj.name.trim(),
        description: proj.description.trim(),
        technologies: proj.technologies.split(',').map((t) => t.trim()).filter(Boolean),
        github_url: proj.github_url.trim() || null,
      });
      if (projErr) { setError(projErr.message); return false; }
    }
    return true;
  };

  const saveLinks = async () => {
    if (!profile) return true;
    const { error: linkErr } = await supabase
      .from('profiles')
      .update({
        github_url: links.github_url.trim() || null,
        linkedin_url: links.linkedin_url.trim() || null,
        leetcode_url: links.leetcode_url.trim() || null,
      })
      .eq('id', profile.id);
    if (linkErr) { setError(linkErr.message); return false; }
    await refreshProfile();
    return true;
  };

  const handleNext = async () => {
    setError('');
    setLoading(true);
    let ok = true;
    if (step === 0) ok = await saveBasicInfo();
    else if (step === 1) ok = await saveSkills();
    else if (step === 2) ok = await saveStrengths();
    else if (step === 3) ok = await saveProjects();
    setLoading(false);
    if (ok) {
      if (step < STEPS.length - 1) setStep(step + 1);
      else navigate('/dashboard');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    const ok = await saveLinks();
    setLoading(false);
    if (ok) navigate('/dashboard');
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black">T</div>
            <span className="font-black text-lg text-slate-900">TECH</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
            Skip for now
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Build Your Tech Profile</h1>
        <p className="text-slate-600 mt-1">Let's set up your profile so teammates can find you.</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-8 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div className={cn(
                'flex-1 h-2 rounded-full transition-colors',
                i <= step ? 'bg-teal-500' : 'bg-slate-200',
              )} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-bold text-teal-600">Step {step + 1} of {STEPS.length}</span>
          <span className="text-sm font-semibold text-slate-600">{STEPS[step]}</span>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={basicForm.full_name || 'User'} photo={basicForm.profile_photo} size="xl" />
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
              <Input label="Full Name" value={basicForm.full_name} onChange={(e) => setBasicForm({ ...basicForm, full_name: e.target.value })} placeholder="Arjun Sharma" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="College" value={basicForm.college} onChange={(e) => setBasicForm({ ...basicForm, college: e.target.value })} placeholder="IIT Delhi" />
                <Input label="Branch" value={basicForm.branch} onChange={(e) => setBasicForm({ ...basicForm, branch: e.target.value })} placeholder="Computer Science" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Year" value={basicForm.year} onChange={(e) => setBasicForm({ ...basicForm, year: e.target.value })} placeholder="2nd Year" />
                <Select label="Experience Level" value={basicForm.experience_level} onChange={(e) => setBasicForm({ ...basicForm, experience_level: e.target.value as ExperienceLevel })}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <Textarea label="Bio" value={basicForm.bio} onChange={(e) => setBasicForm({ ...basicForm, bio: e.target.value })} placeholder="Tell teammates about yourself..." />
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-slate-600 mb-4">Select your skills. These help teammates find you.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {skills.map((skill) => {
                  const selected = selectedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => {
                        setSelectedSkills(selected ? selectedSkills.filter((s) => s !== skill.id) : [...selectedSkills, skill.id]);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                        selected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-700 hover:border-slate-300',
                      )}
                    >
                      {selected && <Check className="w-4 h-4" />}
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-slate-600 mb-4">Select your strengths. What do you bring to a team?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {strengths.map((strength) => {
                  const selected = selectedStrengths.includes(strength.id);
                  return (
                    <button
                      key={strength.id}
                      onClick={() => {
                        setSelectedStrengths(selected ? selectedStrengths.filter((s) => s !== strength.id) : [...selectedStrengths, strength.id]);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                        selected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-700 hover:border-slate-300',
                      )}
                    >
                      {selected && <Check className="w-4 h-4" />}
                      {strength.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Add your projects, hackathons, or achievements.</p>
              {projects.map((proj, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3 relative">
                  <button onClick={() => setProjects(projects.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                  <Input label="Project Name" value={proj.name} onChange={(e) => { const p = [...projects]; p[i].name = e.target.value; setProjects(p); }} placeholder="AI-Powered Chatbot" />
                  <Textarea label="Description" value={proj.description} onChange={(e) => { const p = [...projects]; p[i].description = e.target.value; setProjects(p); }} placeholder="What does it do?" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Technologies (comma-separated)" value={proj.technologies} onChange={(e) => { const p = [...projects]; p[i].technologies = e.target.value; setProjects(p); }} placeholder="Python, React" />
                    <Input label="GitHub URL" value={proj.github_url} onChange={(e) => { const p = [...projects]; p[i].github_url = e.target.value; setProjects(p); }} placeholder="https://github.com/..." />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => setProjects([...projects, { name: '', description: '', technologies: '', github_url: '' }])}>
                <Plus className="w-4 h-4" /> Add Project
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Add your external profiles (optional).</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                    <Github className="w-5 h-5" />
                  </div>
                  <Input label="" value={links.github_url} onChange={(e) => setLinks({ ...links, github_url: e.target.value })} placeholder="https://github.com/username" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <Input label="" value={links.linkedin_url} onChange={(e) => setLinks({ ...links, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0">
                    <Code className="w-5 h-5" />
                  </div>
                  <Input label="" value={links.leetcode_url} onChange={(e) => setLinks({ ...links, leetcode_url: e.target.value })} placeholder="https://leetcode.com/username" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')} disabled={loading}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={loading}>
              {loading ? <Spinner className="w-5 h-5 text-white" /> : <>Next <ArrowRight className="w-4 h-4" /></>}
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading}>
              {loading ? <Spinner className="w-5 h-5 text-white" /> : <>Finish <Check className="w-4 h-4" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
