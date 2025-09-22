
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Games from './pages/Games';
import CoinFlip from './pages/CoinFlip';
import DiceRoll from './pages/DiceRoll';
import TradeGamble from './pages/TradeGamble';
import FlappyBirdGame from './pages/FlappyBirdGame';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Header from './components/Header';
import Footer from './components/Footer';
import { auth, db } from './firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

function AppShell() {
  const [balance, setBalance] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubscribe = null;
    const attach = () => {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(db, 'users', user.uid);
        unsubscribe = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setBalance(typeof data.wallet === 'number' ? data.wallet : 0);
          }
        });
      }
    };
    const remove = () => { if (typeof unsubscribe === 'function') unsubscribe(); };
    const off = auth.onAuthStateChanged(() => {
      remove();
      attach();
    });
    attach();
    return () => { remove(); off(); };
  }, [location]);

  const handleDeposit = () => {
    navigate('/wallet');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--primary-bg)',
      color: 'var(--text-primary)'
    }}>
      <Header balance={balance !== null ? balance.toLocaleString() : '...'} onDeposit={handleDeposit} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/coin-flip" element={<CoinFlip />} />
          <Route path="/games/dice-roll" element={<DiceRoll />} />
          <Route path="/games/trade-gamble" element={<TradeGamble />} />
          <Route path="/games/flappy-bird" element={<FlappyBirdGame />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
