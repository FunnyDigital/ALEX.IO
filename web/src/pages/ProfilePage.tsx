import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, LogOut, Pencil, Save, Trophy, User, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { InstallPrompt } from '../components/layout/InstallPrompt';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { StatCard } from '../components/ui/StatCard';
import { useToast } from '../hooks/useToast';
import { apiService, getErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatMoney } from '../lib/format';

export function ProfilePage() {
  const { user, mode, refreshProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bankName: '',
    accountNumber: '',
    bankCode: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      bankName: user.bankName || '',
      accountNumber: user.accountNumber || '',
      bankCode: user.bankCode || '',
    });
  }, [user]);

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    setBusy(true);
    try {
      await apiService.updateProfile(form);
      await refreshProfile();
      toast('Profile updated', 'success');
      setEditing(false);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const initials = (user?.username || user?.email || 'A').slice(0, 1).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-0 flex-1 flex-col gap-2"
    >
      <Card className="flex shrink-0 items-center gap-3 p-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-black text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-black text-ink-900">{user?.username || 'Player'}</h1>
          <p className="truncate text-xs text-ink-500">{user?.email}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-ink-500">
          {mode}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="shrink-0 rounded-xl p-2 text-rose-500 transition-colors hover:bg-rose-50"
        >
          <LogOut className="size-4" />
        </button>
      </Card>

      <div className="grid shrink-0 grid-cols-3 gap-2">
        <StatCard icon={Wallet} label="Balance" value={formatMoney(user?.wallet)} tone="brand" />
        <StatCard icon={User} label="Played" value={user?.gamesPlayed ?? 0} tone="sky" />
        <StatCard icon={Trophy} label="Wins" value={user?.wins ?? 0} tone="amber" />
      </div>

      <Card className="shrink-0 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <User className="size-4 text-ink-500" />
            Personal information
          </h2>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="First name"
            value={form.firstName}
            disabled={!editing}
            onChange={(event) => update('firstName')(event.target.value)}
            placeholder="—"
          />
          <Input
            label="Last name"
            value={form.lastName}
            disabled={!editing}
            onChange={(event) => update('lastName')(event.target.value)}
            placeholder="—"
          />
          <Input
            label="Username"
            value={form.username}
            disabled={!editing}
            onChange={(event) => update('username')(event.target.value)}
            placeholder="—"
          />
          <Input
            label="Phone number"
            value={form.phoneNumber}
            disabled={!editing}
            onChange={(event) => update('phoneNumber')(event.target.value)}
            placeholder="—"
          />
        </div>

        {editing && (
          <Button className="mt-3" size="sm" loading={busy} onClick={save}>
            <Save className="size-4" />
            Save changes
          </Button>
        )}
      </Card>

      <Card className="shrink-0 p-3.5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
          <CreditCard className="size-4 text-ink-500" />
          Withdrawal details
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2">
            <Input
              label="Bank name"
              value={form.bankName}
              disabled={!editing}
              onChange={(event) => update('bankName')(event.target.value)}
              placeholder="—"
            />
          </div>
          <Input
            label="Account number"
            value={form.accountNumber}
            disabled={!editing}
            maxLength={10}
            onChange={(event) => update('accountNumber')(event.target.value)}
            placeholder="—"
          />
          <Input
            label="Bank code"
            value={form.bankCode}
            disabled={!editing}
            onChange={(event) => update('bankCode')(event.target.value)}
            placeholder="—"
          />
        </div>
      </Card>

      <InstallPrompt className="shrink-0 lg:hidden" />
    </motion.div>
  );
}
