import { Outlet } from 'react-router-dom';

import { useWallet } from '../../hooks/useWallet';
import { BalanceBadge } from '../ui/BalanceBadge';
import { DesktopNav } from './DesktopNav';
import { Logo } from './Logo';
import { MobileTabBar } from './MobileTabBar';

export function AppShell() {
  const { balance } = useWallet();

  return (
    <div className="h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <DesktopNav balance={balance} />
      <div className="flex h-dvh flex-col overflow-hidden">
        <header className="shrink-0 border-b border-ink-100 bg-white/80 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <Logo />
            <BalanceBadge balance={balance} />
          </div>
        </header>
        <main className="no-scrollbar mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3 lg:px-8 lg:pb-6 lg:pt-6">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
