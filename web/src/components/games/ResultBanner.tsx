import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper, RotateCcw } from 'lucide-react';

import { formatSigned } from '../../lib/format';

export interface ResultState {
  win: boolean;
  profit: number;
  detail?: string;
}

export function ResultBanner({ result, className }: { result: ResultState | null; className?: string }) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={`${result.win}-${result.profit}-${result.detail ?? ''}`}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`flex h-full items-center gap-3 rounded-2xl border px-3.5 py-2 ${
              result.win
                ? 'border-brand-200 bg-brand-50 text-brand-800'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                result.win ? 'bg-brand-100' : 'bg-rose-100'
              }`}
            >
              {result.win ? <PartyPopper className="size-4" /> : <RotateCcw className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">{result.win ? 'You won!' : 'You lost'}</p>
              <p className="truncate text-xs leading-tight opacity-80">
                {result.detail ? `${result.detail} · ` : ''}
                {formatSigned(result.profit)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
