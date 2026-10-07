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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/games"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="size-4" />
          Games
        </Link>
        <BalanceBadge balance={balance} />
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}
