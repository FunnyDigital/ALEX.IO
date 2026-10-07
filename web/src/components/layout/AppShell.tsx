import { Outlet } from 'react-router-dom';

import { useWallet } from '../../hooks/useWallet';
import { BalanceBadge } from '../ui/BalanceBadge';
import { DesktopNav } from './DesktopNav';
import { Logo } from './Logo';
import { MobileTabBar } from './MobileTabBar';

export function AppShell() {
  const { balance } = useWallet();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <DesktopNav balance={balance} />
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/80 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Logo />
            <BalanceBadge balance={balance} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
