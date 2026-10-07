import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

import { BetControls } from '../components/games/BetControls';
import { GamePage } from '../components/games/GamePage';
import { HistoryList } from '../components/games/HistoryList';
import type { HistoryEntry } from '../components/games/HistoryList';
import { ResultBanner } from '../components/games/ResultBanner';
import type { ResultState } from '../components/games/ResultBanner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import { apiService, getErrorMessage } from '../lib/api';
import { classNames, formatMoney } from '../lib/format';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CHOICES = [
  { key: 'heads' as const, label: 'Heads' },
  { key: 'tails' as const, label: 'Tails' },
];

export function CoinFlipPage() {
  const { balance, setBalance } = useWallet();
  const { toast } = useToast();

  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [bet, setBet] = useState('100');
  const [face, setFace] = useState<'heads' | 'tails' | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const flip = async () => {
    const amount = Number(bet);
    if (!amount || amount <= 0) return toast('Enter a valid bet', 'error');
    if (amount > balance) return toast('Insufficient balance', 'error');

    setResult(null);
    setFace(null);
    setSpinning(true);
    setSpinToken((token) => token + 1);

    try {
      const { data } = await apiService.coinFlip(amount, choice);
      await delay(1000);
      setFace(data.result);
      setResult({ win: data.win, profit: data.profit, detail: `Landed on ${data.result}` });
      setBalance(data.wallet);
      setHistory((entries) =>
        [
          {
            id: Date.now(),
            label: `${choice} · ${formatMoney(amount)}`,
            win: data.win,
            profit: data.profit,
          },
          ...entries,
        ].slice(0, 5)
      );
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSpinning(false);
    }
  };

  return (
    <GamePage title="Coin Flip" subtitle="Call the toss — win 1.96x your bet." balance={balance}>
      <Card className="flex flex-col items-center gap-6 p-6">
        <motion.div
          key={spinToken}
          animate={spinning ? { rotateY: [0, 1080] } : { rotateY: 0 }}
          transition={{ duration: spinning ? 1 : 0.3, ease: 'easeInOut' }}
          className="flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-float"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {face ? (
            <span className="text-3xl font-black uppercase">{face === 'heads' ? 'H' : 'T'}</span>
          ) : (
            <Coins className="size-12" />
          )}
        </motion.div>

        <div className="grid w-full grid-cols-2 gap-3">
          {CHOICES.map((option) => (
            <button
              key={option.key}
              type="button"
              disabled={spinning}
              onClick={() => setChoice(option.key)}
              className={classNames(
                'rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60',
                choice === option.key
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <BetControls bet={bet} onChange={setBet} balance={balance} disabled={spinning} />

        <Button size="lg" fullWidth loading={spinning} onClick={flip}>
          {spinning ? 'Flipping…' : 'Flip coin'}
        </Button>

        <div className="w-full">
          <ResultBanner result={result} />
        </div>
      </Card>

      <HistoryList entries={history} />
    </GamePage>
  );
}
