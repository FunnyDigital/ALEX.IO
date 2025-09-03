import React, { useState } from 'react';
import { Box, Typography, Button, Paper, TextField, LinearProgress, Snackbar, Alert, Divider } from '@mui/material';
import axios from 'axios';
import { auth } from '../firebase';

import CoinHeadsSVG from '../assets/coin-heads';
import CoinTailsSVG from '../assets/coin-tails';
import coinImg from '../assets/bitcoin.png'; // Use the bitcoin image for the coin flip
import './CoinFlipMobile.css';

function CoinFlip() {
  const [bet, setBet] = useState('');
  const [choice, setChoice] = useState('heads');
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Add coin flip animation state
  const [flipping, setFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState(null);

  // Coin image component
  const CoinImage = (
    <img
      src={coinImg}
      alt="Coin"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        borderRadius: '50%',
        boxShadow: result === 'heads' ? '0 0 24px #facc15' : '0 0 24px #22c55e',
      }}
    />
  );

  // Coin flip animation handler
  const handleFlip = async () => {
    setFlipping(true);
    setFlipResult(null);
    // Simulate flip animation
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      setFlipResult(result);
      setFlipping(false);
      // Start spinning, request API
      handlePlay(result);
    }, 1200);
  };

  const handlePlay = async (flipResult) => {
    setError('');
    setLoading(true);
    setSpinning(true);
    let apiResult = null;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      // Start spinning, request API
      const res = await axios.post('https://api-v2ckmk5jla-uc.a.run.app/api/games/coin-flip', { bet: Number(bet), choice }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      apiResult = res.data.result;
      setWallet(res.data.wallet);
      setHistory(prev => [
        {
          time: new Date().toLocaleTimeString(),
          choice,
          result: res.data.result,
          win: choice === res.data.result,
          wallet: res.data.wallet,
        },
        ...prev.slice(0, 9)
      ]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error');
    }
    setLoading(false);
    // Keep spinning for at least 1.2s after API result, then show result
    setTimeout(() => {
      setResult(apiResult);
      setSpinning(false);
      setShowSnackbar(true);
    }, 1200);
  };

  return (
    <div className="coinflip-mobile-bg min-h-screen flex items-center justify-center px-2 py-4">
      <div className="coinflip-mobile-card w-full max-w-[400px] rounded-2xl shadow-2xl border-4 border-[#23243a] bg-[#23243a] p-4 mx-auto">
        <div className="app-header text-yellow-400 text-center text-2xl font-bold mb-4">Coin Flip</div>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mb: 2 }}>
            {/* Coin animation */}
            <Box
              className={`coinflip-coin${spinning ? ' flipping' : ''} ${result ? result : ''}`}
              sx={{
                width: { xs: 100, sm: 120 },
                height: { xs: 100, sm: 120 },
                position: 'relative',
                mb: 1,
                transition: 'transform 1.2s cubic-bezier(.68,-0.55,.27,1.55)',
                transform: spinning ? 'rotateY(720deg) scale(1.1)' : result === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)',
                mx: 'auto',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#23243a',
              }}
            >
              {CoinImage}
            </Box>
          </Box>
          <TextField label="Bet Amount" type="number" value={bet} onChange={e => setBet(e.target.value)} fullWidth sx={{ mb: 2 }} InputProps={{ style: { color: '#ffd700', fontWeight: 600, background: '#23243a', borderRadius: 8 } }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button variant={choice === 'heads' ? 'contained' : 'outlined'} sx={{ bgcolor: choice === 'heads' ? '#ffd700' : '#23243a', color: choice === 'heads' ? '#23243a' : '#ffd700', fontWeight: 700, borderRadius: 8 }} onClick={() => setChoice('heads')}>Heads</Button>
            <Button variant={choice === 'tails' ? 'contained' : 'outlined'} sx={{ bgcolor: choice === 'tails' ? '#ffd700' : '#23243a', color: choice === 'tails' ? '#23243a' : '#ffd700', fontWeight: 700, borderRadius: 8 }} onClick={() => setChoice('tails')}>Tails</Button>
          </Box>
          <Button fullWidth variant="contained" size="large" sx={{ mb: 2, fontWeight: 600, bgcolor: '#ffd700', color: '#23243a', borderRadius: 8 }} onClick={handleFlip} disabled={loading || spinning || !bet}>Play</Button>
          {loading && (
            <div className="app-progress-bar" style={{ width: '100%', marginBottom: '16px' }}>
              <div className="app-progress-bar-inner" style={{ width: '100%' }}></div>
            </div>
          )}
          {result && !loading && (
            <Typography sx={{ mt: 1, fontSize: 18, fontWeight: 700, color: choice === result ? '#ffd700' : '#ff4d4f', textShadow: '0 2px 8px #23243a' }}>
              {choice === result ? 'You Win!' : 'You Lose!'} Result: {result.charAt(0).toUpperCase() + result.slice(1)}
            </Typography>
          )}
          {wallet !== null && <Typography sx={{ mt: 1, color: '#ffd700', fontWeight: 600 }}>Wallet: ${wallet}</Typography>}
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2, bgcolor: '#23243a', color: '#ffd700', fontWeight: 600 }}>{error}</Alert>}
        </Box>
        <Divider sx={{ my: 2, bgcolor: '#ffd700', height: 2, borderRadius: 2 }} />
        <div className="app-section-title text-white text-center mt-4 mb-2">History</div>
        <Box sx={{ maxHeight: 120, overflowY: 'auto', mb: 1 }}>
          {history.length === 0 && <Typography color="#888">No flips yet.</Typography>}
          {history.map((h, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, px: 1, borderRadius: 2, bgcolor: h.win ? '#23243a' : '#181a2a', mb: 0.5, boxShadow: h.win ? '0 2px 8px #ffd700' : '0 2px 8px #ff4d4f' }}>
              <Typography sx={{ fontWeight: 500, color: '#ffd700' }}>{h.time}</Typography>
              <Typography sx={{ color: '#ffd700' }}>{h.choice.charAt(0).toUpperCase() + h.choice.slice(1)}</Typography>
              <Typography sx={{ color: '#ffd700' }}>{h.result.charAt(0).toUpperCase() + h.result.slice(1)}</Typography>
              <Typography sx={{ color: h.win ? '#ffd700' : '#ff4d4f', fontWeight: 700 }}>{h.win ? 'Win' : 'Lose'}</Typography>
              <Typography sx={{ fontSize: 13, color: '#ffd700' }}>Wallet: ${h.wallet}</Typography>
            </Box>
          ))}
        </Box>
        <Snackbar open={showSnackbar} autoHideDuration={2000} onClose={() => setShowSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity={choice === result ? 'success' : 'error'} sx={{ width: '100%' }}>
            {choice === result ? 'Congratulations! You won the flip.' : 'Sorry, you lost the flip.'}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

export default CoinFlip;
