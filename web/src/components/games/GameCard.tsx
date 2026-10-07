import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface GameMeta {
  slug: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  tint: string;
  iconBg: string;
}

export function GameCard({ game, index }: { game: GameMeta; index: number }) {
  const Icon = game.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        to={`/games/${game.slug}`}
        className={`group flex h-full flex-col justify-between rounded-3xl border border-ink-100 ${game.tint} p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5`}
      >
        <div className="flex items-start justify-between">
          <span className={`flex size-12 items-center justify-center rounded-2xl ${game.iconBg}`}>
            <Icon className="size-6" />
          </span>
          <ArrowRight className="size-5 text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-500" />
        </div>
        <div className="mt-5">
          <h3 className="text-base font-bold text-ink-900">{game.name}</h3>
          <p className="mt-0.5 text-sm text-ink-500">{game.tagline}</p>
        </div>
      </Link>
    </motion.div>
  );
}
