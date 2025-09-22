import React, { useState } from 'react';
import { Box, Typography, Button, TextField, LinearProgress } from '@mui/material';
import axios from 'axios';
import { auth } from '../firebase';

function DiceRoll() {
  const [bet, setBet] = useState('');
  const [guess, setGuess] = useState(1);
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);

  const handlePlay = async () => {
    if (!bet || isNaN(bet) || bet <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    setError('');
    setLoading(true);
    setRolling(true);
    setResult(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      
      // Simulate dice roll animation
      setTimeout(async () => {
        try {
          const res = await axios.post('/api/games/dice-roll', { 
            bet: Number(bet), 
            guess: Number(guess) 
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.success) {
            setResult(res.data.result);
            setWallet(res.data.wallet);
          } else {
            setError(res.data?.message || 'Play failed');
          }
          setRolling(false);
        } catch (err) {
          setError(err.response?.data?.message || err.message || 'Error');
          setRolling(false);
        }
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error');
      setLoading(false);
      setRolling(false);
    }
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
            Dice Roll Challenge
          </div>
          
          {/* Dice Display */}
          <Box
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              background: 'var(--accent-bg)',
              border: '2px solid var(--border-primary)',
              boxShadow: 'var(--shadow-primary)',
              fontSize: { xs: 32, sm: 40 },
              fontWeight: 'bold',
              color: 'var(--text-gold)',
              animation: rolling ? 'spin 1.5s ease-in-out' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          >
            {result || (rolling ? '?' : '🎲')}
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
          
          <TextField 
            label="Your Guess (1-6)" 
            type="number" 
            value={guess} 
            onChange={e => setGuess(e.target.value)} 
            fullWidth 
            inputProps={{ min: 1, max: 6 }}
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
          
          <Button 
            disabled={!bet || loading || rolling} 
            onClick={handlePlay} 
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
            {loading || rolling ? 'Rolling...' : 'Roll Dice'}
          </Button>
          
          {error && (
            <Typography style={{ color: 'var(--red-accent)', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </Typography>
          )}
          
          {loading && <LinearProgress sx={{ width: '100%', mt: 1 }} />}
          
          {result && !loading && (
            <Typography sx={{ 
              mt: 1, 
              fontSize: 18, 
              fontWeight: 700, 
              color: guess == result ? 'var(--green-accent)' : 'var(--red-accent)',
              textAlign: 'center'
            }}>
              {guess == result ? 'Perfect! You Won!' : 'Better luck next time!'}<br />
              Rolled: {result} | Your guess: {guess}
            </Typography>
          )}
          
          {wallet !== null && (
            <Typography style={{ color: 'var(--text-gold)', fontWeight: 600, fontSize: 18 }}>
              Wallet: ${wallet}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiceRoll;
