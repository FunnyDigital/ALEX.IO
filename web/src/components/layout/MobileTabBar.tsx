import { NavLink } from 'react-router-dom';

import { classNames } from '../../lib/format';
import { NAV_ITEMS } from './nav';

export function MobileTabBar() {
  return (
    <nav className="pb-safe shrink-0 border-t border-ink-100 bg-white/95 pt-1 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              classNames(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold transition-colors',
                isActive ? 'text-brand-600' : 'text-ink-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={classNames(
                    'flex size-8 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-brand-50' : 'bg-transparent'
                  )}
                >
                  <Icon className="size-[18px]" />
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
