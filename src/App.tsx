import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { PageLoader } from '@/components/ui/Spinner';
import { LandingPage } from '@/pages/LandingPage';
import { SignupPage } from '@/pages/SignupPage';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FindTeammatesPage } from '@/pages/FindTeammatesPage';
import { HackathonsPage, HackathonDetailPage } from '@/pages/HackathonsPage';
import { ReadyToFindPage, ReadyToGetInPage } from '@/pages/ReadyPages';
import { MyPostsPage } from '@/pages/MyPostsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { MyTeamPage } from '@/pages/MyTeamPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { AboutPage, PrivacyPage, TermsPage, ContactPage } from '@/pages/StaticPages';

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/admin/login', '/reset-password', '/about', '/privacy', '/terms', '/contact'];
const PROTECTED_ROUTES = ['/dashboard', '/find-teammates', '/hackathons', '/ready-to-find', '/ready-to-get-in', '/my-posts', '/my-team', '/notifications', '/settings', '/onboarding'];

function Routes() {
  const { path, navigate } = useRouter();
  const { session, profile, loading } = useAuth();

  if (loading) return <PageLoader />;

  // Public profile view: /profile/:id
  const profileMatch = path.match(/^\/profile\/(.+)$/);
  if (profileMatch) {
    const userId = profileMatch[1];
    // If it's the current user's own profile, require auth; otherwise allow public view
    return <ProfilePage userId={userId} />;
  }

  // /profile without ID = own profile (requires auth)
  if (path === '/profile') {
    if (!session) { navigate('/login'); return <PageLoader />; }
    return <ProfilePage />;
  }

  // Hackathon detail: /hackathon/:id
  const hackathonMatch = path.match(/^\/hackathon\/(.+)$/);
  if (hackathonMatch) {
    if (!session) { navigate('/login'); return <PageLoader />; }
    return <HackathonDetailPage hackathonId={hackathonMatch[1]} />;
  }

  // Admin route
  if (path === '/admin') {
    if (loading) return <PageLoader />;
    if (!session) { navigate('/admin/login'); return <PageLoader />; }
    return <AdminPage />;
  }

  // Public routes
  if (PUBLIC_ROUTES.includes(path)) {
    if (path === '/' && session && profile) {
      return <DashboardPage />;
    }
    switch (path) {
      case '/': return <LandingPage />;
      case '/login': return <LoginPage />;
      case '/signup': return <SignupPage />;
      case '/admin/login': return <AdminLoginPage />;
      case '/reset-password': return <ResetPasswordPage />;
      case '/about': return <AboutPage />;
      case '/privacy': return <PrivacyPage />;
      case '/terms': return <TermsPage />;
      case '/contact': return <ContactPage />;
    }
  }

  // Protected routes
  if (PROTECTED_ROUTES.includes(path)) {
    if (!session) { navigate('/login'); return <PageLoader />; }
    switch (path) {
      case '/dashboard': return <DashboardPage />;
      case '/find-teammates': return <FindTeammatesPage />;
      case '/hackathons': return <HackathonsPage />;
      case '/ready-to-find': return <ReadyToFindPage />;
      case '/ready-to-get-in': return <ReadyToGetInPage />;
      case '/my-posts': return <MyPostsPage />;
      case '/my-team': return <MyTeamPage />;
      case '/notifications': return <NotificationsPage />;
      case '/settings': return <SettingsPage />;
      case '/onboarding': return <OnboardingPage />;
    }
  }

  // Fallback
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <Routes />
      </RouterProvider>
    </AuthProvider>
  );
}
