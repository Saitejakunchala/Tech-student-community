import { useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { validateUrl } from '@/lib/utils';

export function SignupPage() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    college: '',
    branch: '',
    year: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!form.full_name.trim() || !form.college.trim() || !form.branch.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.full_name.trim(),
          college: form.college.trim(),
          branch: form.branch.trim(),
          year: form.year,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      navigate('/onboarding');
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join TECH and find your hackathon team.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="full_name"
          placeholder="Arjun Sharma"
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="arjun@college.edu"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="College"
            name="college"
            placeholder="IIT Delhi"
            required
            value={form.college}
            onChange={(e) => setForm({ ...form, college: e.target.value })}
          />
          <Input
            label="Branch"
            name="branch"
            placeholder="Computer Science"
            required
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
          />
        </div>
        <Input
          label="Year"
          name="year"
          placeholder="2nd Year"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Create Account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button onClick={() => navigate('/login')} className="font-bold text-teal-600 hover:text-teal-700">
          Log In
        </button>
      </p>
    </AuthLayout>
  );
}
