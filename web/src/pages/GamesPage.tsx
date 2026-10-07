import { motion } from 'framer-motion';
import { ArrowUpRight, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { GameCard } from '../components/games/GameCard';
import { InstallPrompt } from '../components/layout/InstallPrompt';
import { GAMES } from '../games';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../lib/auth';
import { formatMoney } from '../lib/format';

export function GamesPage() {
  const { user } = useAuth();
  const { balance } = useWallet();

  const name = user?.firstName || user?.username || 'player';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-float"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">Welcome back,</p>
            <h1 className="text-2xl font-black tracking-tight capitalize">{name}</h1>
          </div>
          <Link
            to="/wallet"
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/25"
          >
            <Wallet className="size-3.5" />
            Wallet
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Balance</p>
          <p className="mt-1 text-4xl font-black tracking-tight">{formatMoney(balance)}</p>
        </div>
        <Link
          to="/wallet"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          Add money
          <ArrowUpRight className="size-4" />
        </Link>
      </motion.div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-500">
          Choose a game
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {GAMES.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </div>
      </div>

      <InstallPrompt className="lg:hidden" />
    </div>
  );
}
