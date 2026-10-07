import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Gamepad2,
  Loader2,
  Receipt,
  Wallet as WalletIcon,
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import { apiService, getErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { classNames, formatDate, formatMoney, formatSigned } from '../lib/format';
import { isPaystackEnabled, payWithPaystack } from '../lib/paystack';
import type { Transaction } from '../lib/types';

type Tab = 'deposit' | 'withdraw' | 'payout';

const TABS: { key: Tab; label: string }[] = [
  { key: 'deposit', label: 'Add money' },
  { key: 'withdraw', label: 'Withdraw' },
  { key: 'payout', label: 'Bank payout' },
];

const TX_META: Record<Transaction['type'], { icon: typeof Receipt; label: string }> = {
  deposit: { icon: ArrowDownLeft, label: 'Deposit' },
  withdraw: { icon: ArrowUpRight, label: 'Withdrawal' },
  payout: { icon: Banknote, label: 'Bank payout' },
  game: { icon: Gamepad2, label: 'Game' },
};

export function WalletPage() {
  const { user } = useAuth();
  const { balance, setBalance, refresh } = useWallet();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('deposit');
  const [amount, setAmount] = useState('1000');
  const [bank, setBank] = useState({ bankName: '', accountNumber: '', bankCode: '' });
  const [busy, setBusy] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const { data } = await apiService.getTransactions();
      setTransactions(data.transactions || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const afterChange = async (message: string, wallet: number) => {
    setBalance(wallet);
    toast(message, 'success');
    await loadTransactions();
  };

  const deposit = async () => {
    const value = Number(amount);
    if (!value || value < 100) return toast('Minimum deposit is ₦100', 'error');
    setBusy(true);
    try {
      if (isPaystackEnabled && user?.email) {
        await payWithPaystack({
          email: user.email,
          amount: value,
          onSuccess: async (reference) => {
            const { data } = await apiService.deposit(reference, value);
            await afterChange('Deposit successful', data.wallet);
            setBusy(false);
          },
          onClose: () => setBusy(false),
        });
      } else {
        const { data } = await apiService.deposit(`demo_${Date.now()}`, value);
        await afterChange('Deposit successful (demo)', data.wallet);
        setBusy(false);
      }
    } catch (error) {
      toast(getErrorMessage(error), 'error');
      setBusy(false);
    }
  };

  const withdraw = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return toast('Enter a valid amount', 'error');
    setBusy(true);
    try {
      const { data } = await apiService.withdraw(value);
      await afterChange('Withdrawal complete', data.wallet);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const payout = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return toast('Enter a valid amount', 'error');
    if (!bank.accountNumber || !bank.bankCode) return toast('Add your bank details', 'error');
    setBusy(true);
    try {
      const { data } = await apiService.payout(value, bank.accountNumber, bank.bankCode);
      await afterChange('Payout sent', data.wallet);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const submit = tab === 'deposit' ? deposit : tab === 'withdraw' ? withdraw : payout;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-ink-700 p-6 text-white shadow-card"
      >
        <div className="flex items-center gap-2 text-white/70">
          <WalletIcon className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Available balance</span>
        </div>
        <p className="mt-3 text-4xl font-black tracking-tight">{formatMoney(balance)}</p>
        <button
          onClick={() => void refresh()}
          className="mt-4 text-xs font-semibold text-white/70 underline-offset-4 hover:underline"
        >
          Refresh balance
        </button>
      </motion.div>

      <Card className="p-5">
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key);
                setAmount(item.key === 'deposit' ? '1000' : '');
              }}
              className={classNames(
                'rounded-xl py-2 text-sm font-semibold transition-colors',
                tab === item.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Input
            label="Amount"
            prefix="₦"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
          />

          {tab === 'payout' && (
            <div className="space-y-3">
              <Input
                label="Bank name"
                value={bank.bankName}
                onChange={(event) => setBank({ ...bank, bankName: event.target.value })}
                placeholder="e.g. GTBank"
              />
              <Input
                label="Account number"
                inputMode="numeric"
                maxLength={10}
                value={bank.accountNumber}
                onChange={(event) => setBank({ ...bank, accountNumber: event.target.value })}
                placeholder="0123456789"
              />
              <Input
                label="Bank code"
                inputMode="numeric"
                value={bank.bankCode}
                onChange={(event) => setBank({ ...bank, bankCode: event.target.value })}
                placeholder="e.g. 058"
              />
            </div>
          )}

          <Button size="lg" fullWidth loading={busy} onClick={submit}>
            {tab === 'deposit'
              ? isPaystackEnabled
                ? 'Pay with card'
                : 'Add money (demo)'
              : tab === 'withdraw'
                ? 'Withdraw'
                : 'Send payout'}
          </Button>

          {tab === 'deposit' && !isPaystackEnabled && (
            <p className="text-center text-xs text-ink-500">
              Demo mode credits your wallet instantly. Add a Paystack public key to accept real
              cards.
            </p>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
          <Receipt className="size-4 text-ink-500" />
          <h2 className="text-sm font-bold text-ink-900">Transactions</h2>
          {loadingTx && <Loader2 className="size-3.5 animate-spin text-ink-300" />}
        </div>
        {transactions.length === 0 && !loadingTx ? (
          <EmptyState icon={Receipt} title="No transactions yet" description="Your activity will show up here." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {transactions.map((tx) => {
              const meta = TX_META[tx.type] || TX_META.game;
              const Icon = meta.icon;
              const isGame = tx.type === 'game';
              const value = isGame ? Number(tx.profit || 0) : Number(tx.amount || 0);
              const positive = value >= 0;
              return (
                <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-ink-500">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {isGame ? tx.game?.replace('-', ' ') || 'Game' : meta.label}
                    </p>
                    <p className="text-xs text-ink-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span
                    className={classNames(
                      'text-sm font-bold',
                      positive ? 'text-brand-600' : 'text-rose-500'
                    )}
                  >
                    {isGame ? formatSigned(value) : `${positive ? '+' : '-'}${formatMoney(Math.abs(value))}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
