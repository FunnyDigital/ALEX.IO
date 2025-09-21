import React, { useEffect, useState, createContext } from 'react';
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
import { doc, getDoc } from 'firebase/firestore';
import './pages/GamesMobile.css';

export const BalanceContext = createContext({ balance: null, setBalance: () => {} });

function AppShell() {
  const [balance, setBalance] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchBalance = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setBalance(userDoc.data().wallet);
        }
      }
    };
    fetchBalance();
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
      <BalanceContext.Provider value={{ balance, setBalance }}>
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
      </BalanceContext.Provider>
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
