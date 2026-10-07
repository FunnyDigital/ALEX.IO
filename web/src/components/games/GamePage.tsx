import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { BalanceBadge } from '../ui/BalanceBadge';

export function GamePage({
  title,
  subtitle,
  balance,
  children,
}: {
  title: string;
  subtitle?: string;
  balance: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex min-h-0 flex-1 flex-col gap-2.5"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            to="/games"
            className="flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900"
            aria-label="Back to games"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="truncate text-lg font-black tracking-tight text-ink-900">{title}</h1>
        </div>
        <BalanceBadge balance={balance} />
      </div>

      {subtitle && <p className="shrink-0 text-xs text-ink-500">{subtitle}</p>}

      <div className="flex min-h-0 flex-1 flex-col gap-3">{children}</div>
    </motion.div>
  );
}
