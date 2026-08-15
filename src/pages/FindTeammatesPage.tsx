import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullSpinner, Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { cn, debounce } from '@/lib/utils';
import { calculateMatchScore } from '@/lib/matching';
import type { Profile, Skill, StudentMatch, TeamRequirement } from '@/lib/types';
import { Search, Users, Trophy, FolderGit2, Send, User, MapPin, GraduationCap } from 'lucide-react';

export function FindTeammatesPage() {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [students, setStudents] = useState<StudentMatch[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentMatch | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    supabase.from('skills').select('*').order('name').then(({ data }) => {
      if (data) setAllSkills(data as Skill[]);
    });
  }, []);

  const debouncedSearch = useCallback(
    debounce((value: string) => setSearch(value), 300),
    [],
  );

  useEffect(() => {
    if (!profile) return;
    loadStudents();
  }, [profile, search, skillFilter, collegeFilter, yearFilter, experienceFilter]);

  const loadStudents = async () => {
    if (!profile) return;
    setPageLoading(true);

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_suspended', false)
      .neq('id', profile.id)
      .limit(50);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,college.ilike.%${search}%,branch.ilike.%${search}%`);
    }
    if (collegeFilter) query = query.eq('college', collegeFilter);
    if (yearFilter) query = query.eq('year', yearFilter);
    if (experienceFilter) query = query.eq('experience_level', experienceFilter);

    const { data: profiles } = await query;
    if (!profiles) { setPageLoading(false); return; }

    // Get user's skills for matching
    const { data: userSkillsData } = await supabase
      .from('profile_skills')
      .select('skill:skills(*)')
      .eq('profile_id', profile.id);
    const userSkills = ((userSkillsData || []) as unknown as { skill: Skill }[]).map((s) => s.skill);

    const { data: userStrengthsData } = await supabase
      .from('profile_strengths')
      .select('strength:strengths(*)')
      .eq('profile_id', profile.id);
    const userStrengths = ((userStrengthsData || []) as unknown as { strength: Skill }[]).map((s) => s.strength);

    // For each student, get their skills, strengths, projects, hackathons
    const matches: StudentMatch[] = [];
    for (const p of profiles as Profile[]) {
      const [skillsRes, strengthsRes, projectCountRes, hackathonCountRes] = await Promise.all([
        supabase.from('profile_skills').select('skill:skills(*)').eq('profile_id', p.id),
        supabase.from('profile_strengths').select('strength:strengths(*)').eq('profile_id', p.id),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
        supabase.from('hackathon_participations').select('*', { count: 'exact', head: true }).eq('user_id', p.id).eq('verification_status', 'verified'),
      ]);

      const studentSkills = ((skillsRes.data || []) as unknown as { skill: Skill }[]).map((s) => s.skill);
      const studentStrengths = ((strengthsRes.data || []) as unknown as { strength: Skill }[]).map((s) => s.strength);

      if (skillFilter && !studentSkills.some((s) => s.id === skillFilter)) continue;

      // Calculate match score: how well does this student complement the current user?
      const userSkillNames = userSkills.map((s) => s.name);
      const studentSkillNames = studentSkills.map((s) => s.name);
      const complementarySkills = studentSkills.filter((s) => !userSkillNames.includes(s.name));
      const sharedSkills = studentSkills.filter((s) => userSkillNames.includes(s.name));

      const matchBreakdown = calculateMatchScore(
        studentSkills,
        studentStrengths,
        p.experience_level,
        userSkillNames,
        profile.experience_level,
        '',
        [],
      );

      // Adjust: for teammate matching, complementary is more important
      const complementaryScore = Math.min(complementarySkills.length * 30, 100);
      const sharedScore = Math.min(sharedSkills.length * 20, 100);
      const experienceScore = Math.max(0, 100 - Math.abs(
        (p.experience_level === 'beginner' ? 1 : p.experience_level === 'intermediate' ? 2 : 3) -
        (profile.experience_level === 'beginner' ? 1 : profile.experience_level === 'intermediate' ? 2 : 3)
      ) * 40);
      const total = Math.round(complementaryScore * 0.4 + sharedScore * 0.3 + experienceScore * 0.3);

      matches.push({
        profile: p,
        skills: studentSkills,
        strengths: studentStrengths,
        projectCount: projectCountRes.count || 0,
        hackathonCount: hackathonCountRes.count || 0,
        matchScore: total,
        matchBreakdown: { ...matchBreakdown, total, requiredSkillsScore: sharedScore, complementaryScore },
      });
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);
    setStudents(matches);
    setPageLoading(false);
  };

  const handleSendRequest = async () => {
    if (!selectedStudent || !profile) return;
    setSending(true);
    setRequestError('');

    // Find or create a team for the current user to invite from
    // For now, create a join request directly to the student (requirement-based)
    // We'll create a simple notification-based request
    const { error } = await supabase.from('notifications').insert({
      recipient_id: selectedStudent.profile.id,
      type: 'team_invite',
      title: 'Team Invitation',
      message: `${profile.full_name} wants you to join their team. Message: ${requestMessage}`,
    });

    if (error) {
      setRequestError(error.message);
    } else {
      setRequestSuccess(true);
    }
    setSending(false);
  };

  if (loading) return <FullSpinner />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Find Teammates</h1>
          <p className="text-slate-600 mt-1">Discover students with complementary skills.</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by name, college, or branch..."
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
              <Select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
                <option value="">All Skills</option>
                {allSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Input placeholder="College" value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} />
              <Select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)}>
                <option value="">All Experience</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {pageLoading ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
        ) : students.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No teammates found"
              description="Try adjusting your filters or search."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <Card key={student.profile.id} hover>
                <CardBody>
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar name={student.profile.full_name} photo={student.profile.profile_photo} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{student.profile.full_name}</h3>
                      <p className="text-xs text-slate-500 truncate">{student.profile.college}</p>
                      <p className="text-xs text-slate-500 truncate">{student.profile.branch} · {student.profile.year}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn('text-xl font-black', student.matchScore >= 70 ? 'text-teal-600' : 'text-amber-600')}>
                        {student.matchScore}%
                      </div>
                      <div className="text-xs text-slate-400">Match</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {student.skills.slice(0, 4).map((s) => (
                      <Badge key={s.id} variant="teal">{s.name}</Badge>
                    ))}
                    {student.skills.length > 4 && <Badge>+{student.skills.length - 4}</Badge>}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {student.hackathonCount}</span>
                    <span className="flex items-center gap-1"><FolderGit2 className="w-3.5 h-3.5" /> {student.projectCount}</span>
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {student.profile.experience_level}</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/profile/${student.profile.id}`)}>
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => { setSelectedStudent(student); setRequestSuccess(false); setRequestMessage(''); setRequestError(''); }}>
                      <Send className="w-3.5 h-3.5" /> Request
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Request Modal */}
      <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Send Team Invitation">
        {requestSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Invitation Sent!</h3>
            <p className="text-sm text-slate-600 mb-6">Your team invitation has been sent to {selectedStudent?.profile.full_name}.</p>
            <Button onClick={() => setSelectedStudent(null)} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedStudent && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Avatar name={selectedStudent.profile.full_name} photo={selectedStudent.profile.profile_photo} size="md" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedStudent.profile.full_name}</p>
                  <p className="text-xs text-slate-500">{selectedStudent.profile.college}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-black text-teal-600">{selectedStudent.matchScore}%</div>
                  <div className="text-xs text-slate-400">Match</div>
                </div>
              </div>
            )}
            <Textarea
              label="Message"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi! I'm interested in teaming up. I have experience in..."
              rows={4}
            />
            {requestError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                {requestError}
              </div>
            )}
            <Button onClick={handleSendRequest} className="w-full" disabled={sending}>
              {sending ? <Spinner className="w-5 h-5 text-white" /> : <><Send className="w-4 h-4" /> Send Invitation</>}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
