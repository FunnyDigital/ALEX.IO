import React, { useState } from 'react';
import { Box, Typography, Button, Paper, TextField } from '@mui/material';
import axios from 'axios';

function FlappyBird() {
  const [bet, setBet] = useState('');
  const [score, setScore] = useState('');
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');

  const handlePlay = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/games/flappy-bird', { bet: Number(bet), score: Number(score) }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data.win ? 'Win' : 'Lose');
      setWallet(res.data.wallet);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6">Flappy Bird</Typography>
      <TextField label="Bet Amount" type="number" value={bet} onChange={e => setBet(e.target.value)} fullWidth sx={{ mt: 2 }} />
      <TextField label="Score" type="number" value={score} onChange={e => setScore(e.target.value)} fullWidth sx={{ mt: 2 }} />
      <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handlePlay}>Play</Button>
      {result && <Typography sx={{ mt: 2 }}>Result: {result}</Typography>}
      {wallet !== null && <Typography>Wallet: ${wallet}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
    </Paper>
  );
}

export default FlappyBird;
