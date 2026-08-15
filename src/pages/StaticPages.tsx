import { Link } from '@/context/RouterContext';
import { Footer } from '@/pages/LandingPage';
import { Button } from '@/components/ui/Button';
import { useRouter } from '@/context/RouterContext';
import { ArrowLeft } from 'lucide-react';

export function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black">T</div>
            <span className="font-black text-xl text-slate-900">TECH</span>
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-12 flex-1">
        <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-700 font-medium mb-6 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-6">{title}</h1>
        <div className="prose prose-slate max-w-none">{children}</div>
      </div>
      <Footer />
    </div>
  );
}

export function AboutPage() {
  return (
    <StaticPage title="About TECH">
      <p className="text-slate-600 leading-relaxed mb-4">
        TECH is a student-focused technology community platform built to help engineering students
        discover suitable teammates for hackathons and technical competitions.
      </p>
      <p className="text-slate-600 leading-relaxed mb-4">
        We believe that great teams are built on complementary skills. TECH helps you find teammates
        whose strengths fill your gaps — so you can build stronger teams and compete with confidence.
      </p>
      <p className="text-slate-600 leading-relaxed">
        This is a placeholder page. Full content will be added soon.
      </p>
    </StaticPage>
  );
}

export function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <p className="text-slate-600 leading-relaxed mb-4">
        This is a placeholder privacy policy. The final version will describe how TECH collects, uses,
        and protects user data in accordance with applicable privacy laws.
      </p>
      <p className="text-slate-600 leading-relaxed">
        For now, rest assured that your data is stored securely and is never shared with third parties.
      </p>
    </StaticPage>
  );
}

export function TermsPage() {
  return (
    <StaticPage title="Terms of Service">
      <p className="text-slate-600 leading-relaxed mb-4">
        This is a placeholder terms of service. The final version will outline the terms and conditions
        for using the TECH platform.
      </p>
      <p className="text-slate-600 leading-relaxed">
        By using TECH, you agree to use the platform responsibly and respectfully.
      </p>
    </StaticPage>
  );
}

export function ContactPage() {
  return (
    <StaticPage title="Contact Us">
      <p className="text-slate-600 leading-relaxed mb-4">
        Have questions or feedback? We'd love to hear from you.
      </p>
      <p className="text-slate-600 leading-relaxed">
        Email: <a href="mailto:hello@tech.community" className="text-teal-600 font-semibold">hello@tech.community</a>
      </p>
    </StaticPage>
  );
}
