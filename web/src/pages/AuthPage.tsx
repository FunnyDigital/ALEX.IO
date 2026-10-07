import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LogoMark } from '../components/layout/Logo';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';

const HIGHLIGHTS = [
  { icon: Sparkles, text: 'Four instant-play games' },
  { icon: TrendingUp, text: 'Live wallet & instant payouts' },
  { icon: ShieldCheck, text: 'Secure, private, self-hosted' },
];

export function AuthPage() {
  const { user, login, register, mode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/games', { replace: true });
  }, [user, navigate]);

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email.trim(), form.password);
      } else {
        await register(form.username.trim(), form.email.trim(), form.password);
      }
      toast(isLogin ? 'Welcome back!' : 'Account created — ₦1,000 added', 'success');
      navigate('/games', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid h-dvh w-full max-w-5xl items-center gap-10 overflow-y-auto px-5 py-10 lg:grid-cols-2 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="hidden lg:block"
      >
        <LogoMark className="size-12" />
        <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-ink-900">
          Play, wager and win — <span className="text-brand-500">right in your browser.</span>
        </h1>
        <p className="mt-4 max-w-md text-ink-500">
          ALEX.IO is a fast, responsive gaming platform. Install it to your home screen and play like
          a native app.
        </p>
        <ul className="mt-8 space-y-3">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm font-medium text-ink-700">
              <span className="flex size-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <LogoMark className="size-11" />
            <h1 className="mt-4 text-2xl font-black tracking-tight text-ink-900">ALEX.IO</h1>
          </div>

          <h2 className="text-xl font-bold text-ink-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {isLogin ? 'Sign in to continue playing.' : 'Join in seconds and get ₦1,000 to start.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {!isLogin && (
              <Input
                label="Username"
                value={form.username}
                onChange={(event) => update('username')(event.target.value)}
                placeholder="yourname"
                autoComplete="username"
              />
            )}
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(event) => update('email')(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(event) => update('password')(event.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              error={error || undefined}
            />
            <Button type="submit" size="lg" fullWidth loading={loading}>
              {isLogin ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-500">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin((value) => !value);
                setError('');
              }}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {mode === 'demo' && (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-ink-500">
              Demo mode — data is stored locally on your server. Any email with a 6+ character
              password works.
            </p>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
