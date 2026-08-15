import { useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to find your team.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="arjun@college.edu"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Your password"
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
          {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Log In'}
        </Button>
        <div className="text-center">
          <button
            onClick={() => navigate('/reset-password')}
            className="text-sm text-slate-600 hover:text-teal-600 font-medium"
          >
            Forgot your password?
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <button onClick={() => navigate('/signup')} className="font-bold text-teal-600 hover:text-teal-700">
          Sign Up
        </button>
      </p>
    </AuthLayout>
  );
}
