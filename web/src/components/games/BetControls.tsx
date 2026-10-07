import { classNames } from '../../lib/format';

const QUICK_AMOUNTS = [100, 500];

export function BetControls({
  bet,
  onChange,
  balance,
  disabled,
  className,
}: {
  bet: string;
  onChange: (value: string) => void;
  balance: number;
  disabled?: boolean;
  className?: string;
}) {
  const setAmount = (amount: number) => onChange(String(Math.min(amount, Math.max(balance, 0))));

  return (
    <div className={classNames('flex shrink-0 items-center gap-1.5', className)}>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-500">
          ₦
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={10}
          value={bet}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Bet"
          aria-label="Bet amount"
          className="h-11 w-full rounded-xl border border-ink-100 bg-white pl-7 pr-3 text-sm font-semibold text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        />
      </div>
      {QUICK_AMOUNTS.map((amount) => (
        <button
          key={amount}
          type="button"
          disabled={disabled}
          onClick={() => setAmount(amount)}
          className="h-11 shrink-0 rounded-xl border border-ink-100 bg-white px-2.5 text-xs font-bold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
        >
          {amount}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(String(Math.floor(balance)))}
        className="h-11 shrink-0 rounded-xl border border-ink-100 bg-white px-2.5 text-xs font-bold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
      >
        Max
      </button>
    </div>
  );
}
