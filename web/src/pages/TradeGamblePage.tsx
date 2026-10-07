import { useEffect, useRef, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

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

const DURATIONS = [1, 2, 5, 10];

function buildSeries(win: boolean, direction: 'up' | 'down') {
  const trend = (direction === 'up' ? 1 : -1) * (win ? 1 : -1);
  const points: number[] = [];
  let price = 100;
  for (let index = 0; index < 40; index += 1) {
    price += trend * 0.7 + (Math.random() - 0.5) * 1.6;
    points.push(price);
  }
  return points;
}

function toPath(points: number[], width: number, height: number) {
  if (points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  return points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function TradeGamblePage() {
  const { balance, setBalance } = useWallet();
  const { toast } = useToast();

  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [duration, setDuration] = useState(5);
  const [bet, setBet] = useState('100');
  const [points, setPoints] = useState<number[]>(() => buildSeries(true, 'up'));
  const [trading, setTrading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );

  const start = async () => {
    const amount = Number(bet);
    if (!amount || amount <= 0) return toast('Enter a valid bet', 'error');
    if (amount > balance) return toast('Insufficient balance', 'error');

    setResult(null);
    setTrading(true);
    setPoints([]);

    const series = buildSeries(Math.random() > 0.5, direction);
    series.forEach((_, index) => {
      const id = window.setTimeout(() => {
        setPoints(series.slice(0, index + 1));
      }, index * 55);
      timers.current.push(id);
    });

    try {
      const [{ data }] = await Promise.all([
        apiService.tradeGamble(amount, direction, duration),
        new Promise((resolve) => setTimeout(resolve, series.length * 55)),
      ]);
      setPoints(buildSeries(data.win, direction));
      setResult({
        win: data.win,
        profit: data.profit,
        detail: `${direction === 'up' ? 'Long' : 'Short'} · ${duration}s`,
      });
      setBalance(data.wallet);
      setHistory((entries) =>
        [
          {
            id: Date.now(),
            label: `${direction === 'up' ? 'Long' : 'Short'} · ${formatMoney(amount)}`,
            win: data.win,
            profit: data.profit,
          },
          ...entries,
        ].slice(0, 6)
      );
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setTrading(false);
    }
  };

  const stroke = trading
    ? 'stroke-sky-400'
    : result?.win
      ? 'stroke-brand-500'
      : result
        ? 'stroke-rose-400'
        : 'stroke-sky-300';

  return (
    <GamePage
      title="Trade Gamble"
      subtitle="Pick a direction — win 1.90x if the market agrees."
      balance={balance}
    >
      <Card className="flex min-h-0 flex-1 flex-col p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
            ALEX/USD
          </span>
          <span className="text-[11px] font-semibold text-ink-500">
            {trading ? 'Live…' : result ? (result.win ? 'Closed +' : 'Closed −') : 'Idle'}
          </span>
        </div>
        <div className="mt-1 min-h-0 flex-1">
          <svg viewBox="0 0 300 100" className="h-full w-full" preserveAspectRatio="none">
            <path
              d={toPath(points, 300, 100)}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={stroke}
            />
          </svg>
        </div>
      </Card>

      <div className="grid shrink-0 grid-cols-2 gap-2">
        {(['up', 'down'] as const).map((option) => {
          const Icon = option === 'up' ? TrendingUp : TrendingDown;
          return (
            <button
              key={option}
              type="button"
              disabled={trading}
              onClick={() => setDirection(option)}
              className={classNames(
                'flex h-11 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold capitalize transition-colors disabled:opacity-60',
                direction === option
                  ? option === 'up'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-rose-400 bg-rose-50 text-rose-600'
                  : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
              )}
            >
              <Icon className="size-4" />
              {option}
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 gap-1.5">
        {DURATIONS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            disabled={trading}
            onClick={() => setDuration(seconds)}
            className={classNames(
              'h-10 flex-1 rounded-xl border text-sm font-bold transition-colors disabled:opacity-60',
              duration === seconds
                ? 'border-sky-400 bg-sky-50 text-sky-600'
                : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
            )}
          >
            {seconds}s
          </button>
        ))}
      </div>

      <BetControls bet={bet} onChange={setBet} balance={balance} disabled={trading} />

      <Button size="lg" fullWidth loading={trading} onClick={start}>
        {trading ? 'Trading…' : `Go ${direction === 'up' ? 'long' : 'short'}`}
      </Button>

      <ResultBanner result={result} className="h-14 shrink-0" />

      <RecentStrip entries={history} />
    </GamePage>
  );
}
