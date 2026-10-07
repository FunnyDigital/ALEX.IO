import { NavLink } from 'react-router-dom';

import { classNames } from '../../lib/format';
import { BalanceBadge } from '../ui/BalanceBadge';
import { InstallPrompt } from './InstallPrompt';
import { Logo } from './Logo';
import { NAV_ITEMS } from './nav';

export function DesktopNav({ balance }: { balance: number }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-ink-100 bg-white/70 px-5 py-6 lg:flex">
      <Logo />
      <BalanceBadge balance={balance} className="w-full justify-center" />
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-500 hover:bg-slate-100 hover:text-ink-900'
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <InstallPrompt className="mt-auto" />
    </aside>
  );
}
