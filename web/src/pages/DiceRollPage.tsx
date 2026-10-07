import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { BetControls } from '../components/games/BetControls';
import { GamePage } from '../components/games/GamePage';
import { RecentStrip } from '../components/games/RecentStrip';
import type { HistoryEntry } from '../components/games/RecentStrip';
import { ResultBanner } from '../components/games/ResultBanner';
import type { ResultState } from '../components/games/ResultBanner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import { apiService, getErrorMessage } from '../lib/api';
import { classNames, formatMoney } from '../lib/format';

const PIP_POSITIONS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  const active = new Set(PIP_POSITIONS[value] || []);
  return (
    <motion.div
      animate={rolling ? { rotate: [0, -12, 12, 0] } : { rotate: 0 }}
      transition={{ duration: rolling ? 0.45 : 0.2, repeat: rolling ? Infinity : 0 }}
      className="grid size-[clamp(72px,17vh,128px)] grid-cols-3 grid-rows-3 gap-1.5 rounded-3xl border-2 border-ink-100 bg-white p-3 shadow-card"
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className={classNames(
            'rounded-full',
            active.has(index + 1) ? 'bg-ink-900' : 'bg-transparent'
          )}
        />
      ))}
    </motion.div>
  );
}

export function DiceRollPage() {
  const { balance, setBalance } = useWallet();
  const { toast } = useToast();

  const [guess, setGuess] = useState(1);
  const [bet, setBet] = useState('100');
  const [value, setValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }, []);

  const roll = async () => {
    const amount = Number(bet);
    if (!amount || amount <= 0) return toast('Enter a valid bet', 'error');
    if (amount > balance) return toast('Insufficient balance', 'error');

    setResult(null);
    setRolling(true);
    intervalRef.current = window.setInterval(() => {
      setValue(1 + Math.floor(Math.random() * 6));
    }, 80);

    const settle = () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };

    try {
      const [{ data }] = await Promise.all([
        apiService.diceRoll(amount, guess),
        new Promise((resolve) => setTimeout(resolve, 1400)),
      ]);
      settle();
      setValue(Number(data.result));
      setResult({ win: data.win, profit: data.profit, detail: `Rolled a ${data.result}` });
      setBalance(data.wallet);
      setHistory((entries) =>
        [
          {
            id: Date.now(),
            label: `Guessed ${guess} · ${formatMoney(amount)}`,
            win: data.win,
            profit: data.profit,
          },
          ...entries,
        ].slice(0, 6)
      );
    } catch (error) {
      settle();
      toast(getErrorMessage(error), 'error');
    } finally {
      setRolling(false);
    }
  };

  return (
    <GamePage title="Dice Roll" subtitle="Guess the exact roll — win up to 5.88x." balance={balance}>
      <Card className="flex min-h-0 flex-1 items-center justify-center p-4">
        <Die value={value} rolling={rolling} />
      </Card>

      <div className="grid shrink-0 grid-cols-6 gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((number) => (
          <button
            key={number}
            type="button"
            disabled={rolling}
            onClick={() => setGuess(number)}
            className={classNames(
              'h-11 rounded-xl border-2 text-base font-black transition-colors disabled:opacity-60',
              guess === number
                ? 'border-rose-400 bg-rose-50 text-rose-600'
                : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
            )}
          >
            {number}
          </button>
        ))}
      </div>

      <BetControls bet={bet} onChange={setBet} balance={balance} disabled={rolling} />

      <Button size="lg" fullWidth loading={rolling} onClick={roll}>
        {rolling ? 'Rolling…' : `Roll for ${guess}`}
      </Button>

      <ResultBanner result={result} className="h-14 shrink-0" />

      <RecentStrip entries={history} />
    </GamePage>
  );
}
