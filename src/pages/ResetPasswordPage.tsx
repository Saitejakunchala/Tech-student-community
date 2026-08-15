import { useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Mail } from 'lucide-react';

export function ResetPasswordPage() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link.">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-slate-600 mb-6">
            We've sent a password reset link to <strong className="text-slate-900">{email}</strong>.
            Check your inbox and follow the link to reset your password.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Back to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
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
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner className="w-5 h-5 text-white" /> : <><Mail className="w-4 h-4" /> Send Reset Link</>}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered your password?{' '}
        <button onClick={() => navigate('/login')} className="font-bold text-teal-600 hover:text-teal-700">
          Log In
        </button>
      </p>
    </AuthLayout>
  );
}
