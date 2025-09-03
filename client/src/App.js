import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// ...existing code...
import './App.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import CoinFlip from './pages/CoinFlip';
import DiceRoll from './pages/DiceRoll';
import TradeGamble from './pages/TradeGamble';
import FlappyBirdGame from './pages/FlappyBirdGame';
import Wallet from './pages/Wallet';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/coin-flip" element={<CoinFlip />} />
        <Route path="/games/dice-roll" element={<DiceRoll />} />
        <Route path="/games/trade-gamble" element={<TradeGamble />} />
  <Route path="/games/flappy-bird" element={<FlappyBirdGame />} />
  <Route path="/wallet" element={<Wallet />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
