import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastProvider } from './hooks/useToast';
import { WalletProvider } from './hooks/useWallet';
import { AuthProvider } from './lib/auth';
import { AuthPage } from './pages/AuthPage';
import { CoinFlipPage } from './pages/CoinFlipPage';
import { DiceRollPage } from './pages/DiceRollPage';
import { FlappyBirdPage } from './pages/FlappyBirdPage';
import { GamesPage } from './pages/GamesPage';
import { ProfilePage } from './pages/ProfilePage';
import { TradeGamblePage } from './pages/TradeGamblePage';
import { WalletPage } from './pages/WalletPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WalletProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/games" replace />} />
                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/games/coin-flip" element={<CoinFlipPage />} />
                  <Route path="/games/dice-roll" element={<DiceRollPage />} />
                  <Route path="/games/trade-gamble" element={<TradeGamblePage />} />
                  <Route path="/games/flappy-bird" element={<FlappyBirdPage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WalletProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
