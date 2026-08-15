import { useState } from 'react';
import { Link, useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Menu, X, Bell, LogOut, LayoutDashboard, Users, Trophy, FileText, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/find-teammates', label: 'Find Teammates', icon: Users },
  { path: '/hackathons', label: 'Hackathons', icon: Trophy },
  { path: '/my-posts', label: 'My Posts', icon: FileText },
  { path: '/my-team', label: 'My Team', icon: Users },
  { path: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const { path, navigate } = useRouter();
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const isActive = (p: string) => path === p || path.startsWith(p + '/');

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg">
                  T
                </div>
                <span className="font-black text-xl text-slate-900 tracking-tight">TECH</span>
              </Link>
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                      isActive(item.path)
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/notifications"
                className={cn(
                  'p-2 rounded-lg transition-colors relative',
                  isActive('/notifications') ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <Bell className="w-5 h-5" />
              </Link>
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={cn(
                    'hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                    isActive('/admin') ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50',
                  )}
                >
                  Admin
                </Link>
              )}
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <Avatar name={profile?.full_name || 'User'} photo={profile?.profile_photo} size="xs" />
                  <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                    {profile?.full_name?.split(' ')[0] || 'User'}
                  </span>
                </button>
                {userMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-scaleIn">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/settings" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <nav className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-slideDown">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  isActive(item.path) ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-600 hover:bg-amber-50">
                <LayoutDashboard className="w-4 h-4" /> Admin
              </Link>
            )}
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </nav>
        )}
      </header>
    </>
  );
}

export function PublicNav() {
  const { path, navigate } = useRouter();
  const { session, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg">
              T
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">TECH</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/#/how-it-works')} className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </button>
            <Link to="/hackathons" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Hackathons
            </Link>
            <a href="#why-tech" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Why TECH
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Button size="sm" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
                {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
                <Button size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
              </>
            )}
            <button className="md:hidden p-2 rounded-lg text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          <button onClick={() => { navigate('/#/how-it-works'); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
            How It Works
          </button>
          <Link to="/hackathons" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
            Hackathons
          </Link>
          <a href="#why-tech" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
            Why TECH
          </a>
        </nav>
      )}
    </header>
  );
}
