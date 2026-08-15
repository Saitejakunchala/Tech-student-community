import { Link, useRouter } from '@/context/RouterContext';
import { PublicNav } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowRight, Users, Trophy, Target, Zap, BarChart3, GitBranch,
  Search, UserPlus, Rocket, Code2, Brain, Palette, Server, Shield,
  CheckCircle2, Sparkles,
} from 'lucide-react';

export function LandingPage() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="teal" className="mb-6 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4" />
              Built for engineering students
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight text-balance leading-tight">
              Find Your Team.
              <span className="block mt-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Build. Compete.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed text-balance">
              TECH connects engineering students with teammates whose skills complement their own —
              so they can build stronger teams and participate in more hackathons.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="group">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/hackathons')}>
                Explore Hackathons
              </Button>
            </div>
          </div>

          {/* Product Preview */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card hover className="animate-slideIn" >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name="Arjun Sharma" size="md" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Arjun Sharma</p>
                      <p className="text-xs text-slate-500">IIT Delhi · CSE</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <Badge variant="teal">Python</Badge>
                    <Badge variant="blue">AI/ML</Badge>
                    <Badge variant="amber">React</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Match</span>
                    <span className="text-2xl font-black text-teal-600">92%</span>
                  </div>
                </div>
              </Card>

              <Card hover className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Smart India Hackathon</p>
                      <p className="text-xs text-slate-500">AI/ML · 4 members</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Registration closes in 12 days</p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <Avatar name="A" size="xs" className="ring-2 ring-white" />
                      <Avatar name="B" size="xs" className="ring-2 ring-white" />
                      <Avatar name="C" size="xs" className="ring-2 ring-white" />
                    </div>
                    <span className="text-xs text-slate-500">3/4 filled</span>
                  </div>
                </div>
              </Card>

              <Card hover className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Match Breakdown</span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Required Skills</span>
                        <span className="font-bold text-slate-900">88%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Complementary</span>
                        <span className="font-bold text-slate-900">75%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Experience</span>
                        <span className="font-bold text-slate-900">90%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '90%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="teal" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              From solo to team in four steps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              TECH guides you through building a profile, finding the right people, and competing together.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: UserPlus, title: 'Build Your Tech Profile', desc: 'Add your skills, strengths, projects, and achievements to showcase what you bring to a team.', color: 'from-teal-500 to-cyan-600' },
              { icon: Target, title: 'Find or Create a Team', desc: 'Choose Ready-to-Find if you have a hackathon, or Ready-to-Get-In to join an existing team.', color: 'from-blue-500 to-indigo-600' },
              { icon: Search, title: 'Find the Right Teammates', desc: 'Discover students with complementary skills using our transparent matching algorithm.', color: 'from-amber-500 to-orange-600' },
              { icon: Rocket, title: 'Build & Compete', desc: 'Form your team, participate in hackathons, submit results, and build your track record.', color: 'from-emerald-500 to-teal-600' },
            ].map((step, i) => (
              <Card key={i} hover className="relative">
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-4`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-black text-slate-300 mb-1">STEP {i + 1}</div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Two Modes */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="blue" className="mb-4">Two Core Modes</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Wherever you are in the journey
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card hover className="overflow-hidden">
              <div className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white mb-5">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">READY-TO-FIND</h3>
                <p className="text-slate-600 mb-6">
                  "I already found a hackathon and need teammates."
                  Publish your team requirement and let students discover you.
                </p>
                <Button onClick={() => navigate('/signup')} className="w-full">
                  Find Teammates <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
            <Card hover className="overflow-hidden">
              <div className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-5">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">READY-TO-GET-IN</h3>
                <p className="text-slate-600 mb-6">
                  "I want to join a hackathon team."
                  Browse open team requirements and find the perfect match.
                </p>
                <Button variant="outline" onClick={() => navigate('/signup')} className="w-full">
                  Find a Team <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why TECH */}
      <section id="why-tech" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="amber" className="mb-4">Why TECH</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything you need to form winning teams
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Skill-Based Matching', desc: 'Our transparent algorithm matches you with teammates based on real skills and requirements — not guesswork.' },
              { icon: UserPlus, title: 'Student Tech Profiles', desc: 'Build a professional profile with skills, strengths, projects, and verified hackathon history.' },
              { icon: Trophy, title: 'Hackathon Discovery', desc: 'Browse hackathons across categories, with deadlines, team sizes, and required skills at a glance.' },
              { icon: GitBranch, title: 'Complementary Teams', desc: 'Find teammates whose strengths fill your gaps — frontend meets backend, design meets engineering.' },
              { icon: BarChart3, title: 'Contribution Tracking', desc: 'Every hackathon, result, and achievement builds your track record with visual analytics.' },
              { icon: Shield, title: 'Verified Results', desc: 'Results are admin-verified, so profiles reflect real, confirmed achievements.' },
            ].map((feature, i) => (
              <Card key={i} hover>
                <div className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-teal-600 to-cyan-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-balance">
            Ready to find your team?
          </h2>
          <p className="mt-4 text-lg text-teal-50">
            Join TECH today and connect with engineering students who complement your skills.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate('/signup')} className="bg-white text-teal-700 hover:bg-teal-50">
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/login')} className="text-white hover:bg-white/10">
              Log In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export function Footer() {
  const { navigate } = useRouter();
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg">
                T
              </div>
              <span className="font-black text-xl text-white tracking-tight">TECH</span>
            </Link>
            <p className="text-sm">Find Your Team. Build. Compete.</p>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/hackathons" className="hover:text-white transition-colors">Hackathons</Link></li>
              <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">Get Started</button></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-slate-800 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} TECH. Built for engineering students.</p>
        </div>
      </div>
    </footer>
  );
}
