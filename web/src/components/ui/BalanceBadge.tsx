import { Wallet } from 'lucide-react';

import { classNames, formatMoney } from '../../lib/format';

export function BalanceBadge({ balance, className }: { balance: number; className?: string }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3.5 py-1.5 text-sm font-bold text-ink-900 shadow-sm',
        className
      )}
    >
      <Wallet className="size-4 text-brand-500" />
      {formatMoney(balance)}
    </span>
  );
}
