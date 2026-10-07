import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { apiService } from '../lib/api';
import { useAuth } from '../lib/auth';

interface WalletContextValue {
  balance: number;
  setBalance: (balance: number) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalanceState] = useState(0);
  const [loading, setLoading] = useState(false);

  const setBalance = useCallback((value: number) => setBalanceState(value), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiService.getWallet();
      setBalanceState(Number(data.balance || 0));
    } catch {
      /* keep last known balance */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setBalanceState(0);
      return;
    }
    void refresh();
  }, [refresh, user?.id]);

  const value = useMemo(
    () => ({ balance, setBalance, refresh, loading }),
    [balance, setBalance, refresh, loading]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
}
