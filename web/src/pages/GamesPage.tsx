import { motion } from 'framer-motion';
import { ArrowUpRight, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { GameCard } from '../components/games/GameCard';
import { GAMES } from '../games';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../lib/auth';
import { formatMoney } from '../lib/format';

export function GamesPage() {
  const { user } = useAuth();
  const { balance } = useWallet();

  const name = user?.firstName || user?.username || 'player';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-float"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/80">Welcome back,</p>
            <h1 className="truncate text-xl font-black capitalize tracking-tight">{name}</h1>
          </div>
          <Link
            to="/wallet"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/25"
          >
            <Wallet className="size-3.5" />
            Wallet
          </Link>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
              Balance
            </p>
            <p className="text-3xl font-black tracking-tight">{formatMoney(balance)}</p>
          </div>
          <Link
            to="/wallet"
            className="inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Add money
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </motion.div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <h2 className="shrink-0 text-xs font-bold uppercase tracking-widest text-ink-500">
          Choose a game
        </h2>
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3">
          {GAMES.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
