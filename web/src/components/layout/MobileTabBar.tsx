import { NavLink } from 'react-router-dom';

import { classNames } from '../../lib/format';
import { NAV_ITEMS } from './nav';

export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-safe pt-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              classNames(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-colors',
                isActive ? 'text-brand-600' : 'text-ink-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={classNames(
                    'flex size-9 items-center justify-center rounded-xl transition-colors',
                    isActive ? 'bg-brand-50' : 'bg-transparent'
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
