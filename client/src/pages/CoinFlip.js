import React, { useState } from 'react';
import { Box, Typography, Button, Paper, TextField } from '@mui/material';
import axios from 'axios';

function CoinFlip() {
  const [bet, setBet] = useState('');
  const [choice, setChoice] = useState('heads');
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');

  const handlePlay = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/games/coin-flip', { bet: Number(bet), choice }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data.result);
      setWallet(res.data.wallet);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6">Coin Flip</Typography>
      <TextField label="Bet Amount" type="number" value={bet} onChange={e => setBet(e.target.value)} fullWidth sx={{ mt: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant={choice === 'heads' ? 'contained' : 'outlined'} onClick={() => setChoice('heads')}>Heads</Button>
        <Button variant={choice === 'tails' ? 'contained' : 'outlined'} onClick={() => setChoice('tails')}>Tails</Button>
      </Box>
      <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handlePlay}>Play</Button>
      {result && <Typography sx={{ mt: 2 }}>Result: {result}</Typography>}
      {wallet !== null && <Typography>Wallet: ${wallet}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
    </Paper>
  );
}

export default CoinFlip;
