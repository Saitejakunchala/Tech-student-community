import { useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';

export function AdminLoginPage() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message || 'Sign-in failed.');
      setLoading(false);
      return;
    }

    // Verify admin role using the SECURITY DEFINER is_admin() function.
    // getSession() ensures the client's internal session state is fully propagated
    // before we make the RPC call that depends on auth.uid().
    await supabase.auth.getSession();
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');

    if (rpcError || !isAdmin) {
      setError('This account does not have administrator access.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate('/admin');
  };

  return (
    <AuthLayout title="Admin Login" subtitle="Secure access for TECH administrators.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="admin@tech.edu"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Admin password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Sign In as Admin'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Not an admin?{' '}
        <button onClick={() => navigate('/login')} className="font-bold text-teal-600 hover:text-teal-700">
          Student Login
        </button>
      </p>
    </AuthLayout>
  );
}
