import { Bird, Coins, Dices, LineChart } from 'lucide-react';

import type { GameMeta } from './components/games/GameCard';

export const GAMES: GameMeta[] = [
  {
    slug: 'coin-flip',
    name: 'Coin Flip',
    tagline: 'Call heads or tails — 1.96x payout',
    icon: Coins,
    tint: 'bg-amber-50/70',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    slug: 'dice-roll',
    name: 'Dice Roll',
    tagline: 'Predict the roll — up to 5.88x',
    icon: Dices,
    tint: 'bg-rose-50/70',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    slug: 'trade-gamble',
    name: 'Trade Gamble',
    tagline: 'Go long or short the market',
    icon: LineChart,
    tint: 'bg-sky-50/70',
    iconBg: 'bg-sky-100 text-sky-600',
  },
  {
    slug: 'flappy-bird',
    name: 'Flappy Flight',
    tagline: 'Survive the target time to win',
    icon: Bird,
    tint: 'bg-brand-50/70',
    iconBg: 'bg-brand-100 text-brand-600',
  },
];
