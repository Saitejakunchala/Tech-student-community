import { type ReactNode } from 'react';
import { Link } from '@/context/RouterContext';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-cyan-700 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-xl">
              T
            </div>
            <span className="font-black text-2xl tracking-tight">TECH</span>
          </Link>
          <div>
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Find Your Team.<br />Build. Compete.
            </h2>
            <p className="mt-4 text-teal-100 text-lg max-w-md">
              Join thousands of engineering students building stronger hackathon teams with complementary skills.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-teal-100">
            <div>
              <p className="text-2xl font-black text-white">10K+</p>
              <p>Students</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">500+</p>
              <p>Hackathons</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">2K+</p>
              <p>Teams Formed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-xl">
                T
              </div>
              <span className="font-black text-2xl text-slate-900 tracking-tight">TECH</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
