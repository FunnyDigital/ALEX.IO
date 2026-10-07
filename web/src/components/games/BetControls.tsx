import { Input } from '../ui/Input';

const QUICK_AMOUNTS = [100, 500, 1000];

export function BetControls({
  bet,
  onChange,
  balance,
  disabled,
}: {
  bet: string;
  onChange: (value: string) => void;
  balance: number;
  disabled?: boolean;
}) {
  const setAmount = (amount: number) => onChange(String(Math.min(amount, Math.max(balance, 0))));

  return (
    <div className="space-y-2">
      <Input
        label="Bet amount"
        prefix="₦"
        inputMode="numeric"
        type="number"
        min={1}
        step={10}
        value={bet}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter amount"
      />
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={disabled}
            onClick={() => setAmount(amount)}
            className="rounded-full border border-ink-100 bg-white px-3 py-1 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
          >
            ₦{amount.toLocaleString()}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(String(Math.floor(balance)))}
          className="rounded-full border border-ink-100 bg-white px-3 py-1 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
        >
          Max
        </button>
      </div>
    </div>
  );
}
