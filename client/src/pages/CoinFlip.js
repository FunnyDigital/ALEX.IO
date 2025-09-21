import React, { useState } from 'react';
import { Box, Typography, Button, TextField, LinearProgress, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import { auth } from '../firebase';
import coinImg from '../assets/bitcoin.png';

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
      }}
    />
  );

  const handleFlip = async () => {
    if (!bet || isNaN(bet) || bet <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    setSpinning(true);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Simulate coin flip
      setTimeout(() => {
        const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
        handlePlay(coinResult);
      }, 1000);
    } catch (err) {
      setError('Failed to flip coin');
      setLoading(false);
      setSpinning(false);
    }
  };

  const handlePlay = async (apiResult) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const token = await user.getIdToken();
      const res = await axios.post(`/api/games/coinflip`, { 
        bet: parseFloat(bet), 
        choice 
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data.success) {
        setWallet(res.data.wallet);
        setHistory([
          { 
            time: new Date().toLocaleTimeString(), 
            choice, 
            result: apiResult, 
            win: choice === apiResult, 
            wallet: res.data.wallet 
          }, 
          ...history.slice(0, 4)
        ]);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error');
    }

    setLoading(false);
    // Keep spinning for at least 1.2s, then show result
    setTimeout(() => {
      setResult(apiResult);
      setSpinning(false);
      setShowSnackbar(true);
    }, 1200);
  };

  return (
    <div className="gaming-page">
      <div className="gaming-container">
        <div className="gaming-card" style={{
          width: '100%',
          maxWidth: 400,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20
        }}>
          <div style={{
            color: 'var(--text-gold)',
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 700,
            margin: 0
          }}>
            Coin Flip Challenge
          </div>
          
          {/* Coin animation */}
          <Box
            sx={{
              width: { xs: 100, sm: 120 },
              height: { xs: 100, sm: 120 },
              position: 'relative',
              mb: 2,
              transition: 'transform 1.2s cubic-bezier(.68,-0.55,.27,1.55)',
              transform: spinning ? 'rotateY(720deg) scale(1.1)' : result === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)',
              mx: 'auto',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--accent-bg)',
              border: '2px solid var(--border-primary)',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            {CoinImage}
          </Box>
          
          <TextField 
            label="Bet Amount" 
            type="number" 
            value={bet} 
            onChange={e => setBet(e.target.value)} 
            fullWidth 
            InputProps={{ 
              style: { 
                color: 'var(--text-primary)', 
                fontWeight: 600, 
                background: 'var(--accent-bg)', 
                borderRadius: 8 
              } 
            }}
            InputLabelProps={{
              style: { 
                color: 'var(--text-secondary)'
              }
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'var(--border-secondary)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--border-primary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--border-primary)',
                },
              },
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2, width: '100%' }}>
            <Button 
              variant={choice === 'heads' ? 'contained' : 'outlined'} 
              sx={{ 
                flex: 1,
                bgcolor: choice === 'heads' ? 'var(--gold-primary)' : 'transparent', 
                color: choice === 'heads' ? 'var(--primary-bg)' : 'var(--text-gold)', 
                fontWeight: 700, 
                borderRadius: 2,
                border: choice === 'heads' ? 'none' : '2px solid var(--border-primary)',
                '&:hover': {
                  bgcolor: choice === 'heads' ? 'var(--gold-secondary)' : 'var(--accent-bg)',
                }
              }} 
              onClick={() => setChoice('heads')}
            >
              Heads
            </Button>
            <Button 
              variant={choice === 'tails' ? 'contained' : 'outlined'} 
              sx={{ 
                flex: 1,
                bgcolor: choice === 'tails' ? 'var(--gold-primary)' : 'transparent', 
                color: choice === 'tails' ? 'var(--primary-bg)' : 'var(--text-gold)', 
                fontWeight: 700, 
                borderRadius: 2,
                border: choice === 'tails' ? 'none' : '2px solid var(--border-primary)',
                '&:hover': {
                  bgcolor: choice === 'tails' ? 'var(--gold-secondary)' : 'var(--accent-bg)',
                }
              }} 
              onClick={() => setChoice('tails')}
            >
              Tails
            </Button>
          </Box>
          
          <Button 
            disabled={!bet || loading || spinning} 
            onClick={handleFlip} 
            variant="contained"
            className="gaming-button-primary"
            sx={{ 
              width: '100%',
              mb: 2,
              background: 'var(--gradient-gold)',
              color: 'var(--primary-bg)',
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 2,
              padding: '12px 0',
              boxShadow: 'var(--shadow-primary)',
              '&:disabled': {
                background: 'var(--accent-bg)',
                color: 'var(--text-muted)',
              }
            }}
          >
            {loading || spinning ? 'Flipping...' : 'Flip Coin'}
          </Button>
          
          {error && (
            <Typography style={{ color: 'var(--red-accent)', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </Typography>
          )}
          
          {loading && <LinearProgress sx={{ width: '100%', mt: 1 }} />}
          
          {wallet !== null && (
            <Typography style={{ color: 'var(--text-gold)', fontWeight: 600, fontSize: 18 }}>
              Wallet: ${wallet}
            </Typography>
          )}
          
          {/* Game History */}
          <Box sx={{ 
            width: '100%', 
            mt: 2, 
            background: 'var(--accent-bg)', 
            borderRadius: 2, 
            border: '1px solid var(--border-secondary)',
            maxHeight: 200, 
            overflowY: 'auto',
            padding: 1
          }}>
            <Typography sx={{ 
              color: 'var(--text-primary)', 
              fontWeight: 600, 
              mb: 1, 
              textAlign: 'center' 
            }}>
              Recent Games
            </Typography>
            {history.length === 0 && (
              <Typography sx={{ color: 'var(--text-muted)', textAlign: 'center', py: 2 }}>
                No games yet
              </Typography>
            )}
            {history.map((h, idx) => (
              <Box key={idx} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                py: 0.5, 
                px: 1, 
                borderRadius: 1, 
                bgcolor: h.win ? 'var(--accent-bg)' : 'var(--secondary-bg)', 
                mb: 0.5, 
                border: h.win ? '1px solid var(--green-accent)' : '1px solid var(--red-accent)'
              }}>
                <Typography sx={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: 12 }}>
                  {h.time}
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: 13 }}>
                  {h.choice.charAt(0).toUpperCase() + h.choice.slice(1)}
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: 13 }}>
                  {h.result.charAt(0).toUpperCase() + h.result.slice(1)}
                </Typography>
                <Typography sx={{ 
                  color: h.win ? 'var(--green-accent)' : 'var(--red-accent)', 
                  fontWeight: 700, 
                  fontSize: 13 
                }}>
                  {h.win ? 'Win' : 'Lose'}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'var(--text-gold)' }}>
                  ${h.wallet}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Snackbar 
            open={showSnackbar} 
            autoHideDuration={2000} 
            onClose={() => setShowSnackbar(false)} 
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              severity={choice === result ? 'success' : 'error'} 
              sx={{ width: '100%' }}
            >
              {choice === result ? 'Congratulations! You won the flip.' : 'Sorry, you lost the flip.'}
            </Alert>
          </Snackbar>
        </div>
      </div>
    </div>
  );
}

export default CoinFlip;
