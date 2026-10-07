import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { apiService, setTokenProvider } from './api';
import {
  firebaseIdToken,
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignOut,
  isFirebaseEnabled,
  onFirebaseAuthChanged,
} from './firebase';
import { getToken, setToken } from './token';
import type { Profile } from './types';

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  mode: 'demo' | 'firebase';
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: Profile | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mode: 'demo' | 'firebase' = isFirebaseEnabled ? 'firebase' : 'demo';

  const setUser = useCallback((next: Profile | null) => setUserState(next), []);

  const refreshProfile = useCallback(async () => {
    const { data } = await apiService.getProfile();
    setUserState(data);
  }, []);

  useEffect(() => {
    let unsubscribed = false;

    if (mode === 'firebase') {
      setTokenProvider(firebaseIdToken);
      let cleanup: (() => void) | undefined;
      onFirebaseAuthChanged(async (firebaseUser) => {
        if (unsubscribed) return;
        if (!firebaseUser) {
          setUserState(null);
          setLoading(false);
          return;
        }
        try {
          const { data } = await apiService.getProfile();
          if (!unsubscribed) setUserState(data);
        } catch {
          if (!unsubscribed) setUserState(null);
        } finally {
          if (!unsubscribed) setLoading(false);
        }
      }).then((unsubscribe) => {
        cleanup = unsubscribe;
      });
      return () => {
        unsubscribed = true;
        cleanup?.();
      };
    }

    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await apiService.getProfile();
        if (!unsubscribed) setUserState(data);
      } catch {
        setToken(null);
      } finally {
        if (!unsubscribed) setLoading(false);
      }
    })();

    return () => {
      unsubscribed = true;
    };
  }, [mode]);

  const login = useCallback(async (email: string, password: string) => {
    if (mode === 'firebase') {
      await firebaseSignIn(email, password);
      return;
    }
    const { data } = await apiService.login({ email, password });
    setToken(data.token);
    setUserState(data.user);
  }, [mode]);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      if (mode === 'firebase') {
        await firebaseSignUp(email, password);
        return;
      }
      const { data } = await apiService.register({ username, email, password });
      setToken(data.token);
      setUserState(data.user);
    },
    [mode]
  );

  const logout = useCallback(async () => {
    if (mode === 'firebase') {
      await firebaseSignOut();
    }
    setToken(null);
    setUserState(null);
  }, [mode]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, mode, login, register, logout, refreshProfile, setUser }),
    [user, loading, mode, login, register, logout, refreshProfile, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
