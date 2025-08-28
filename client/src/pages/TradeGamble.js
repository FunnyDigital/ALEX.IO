import React, { useState } from 'react';
import { Typography, Button, Paper, TextField, MenuItem } from '@mui/material';
import axios from 'axios';

function TradeGamble() {
  const [bet, setBet] = useState('');
  const [direction, setDirection] = useState('up');
  const [duration, setDuration] = useState(1);
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');

  const handlePlay = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/games/trade-gamble', { bet: Number(bet), direction, duration: Number(duration) }, {
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
      <Typography variant="h6">Trade Gamble</Typography>
      <TextField label="Bet Amount" type="number" value={bet} onChange={e => setBet(e.target.value)} fullWidth sx={{ mt: 2 }} />
      <TextField select label="Direction" value={direction} onChange={e => setDirection(e.target.value)} fullWidth sx={{ mt: 2 }}>
        <MenuItem value="up">Up</MenuItem>
        <MenuItem value="down">Down</MenuItem>
      </TextField>
      <TextField select label="Duration (minutes)" value={duration} onChange={e => setDuration(e.target.value)} fullWidth sx={{ mt: 2 }}>
        {[1,2,5,10].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
      <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handlePlay}>Play</Button>
      {result && <Typography sx={{ mt: 2 }}>Result: {result}</Typography>}
      {wallet !== null && <Typography>Wallet: ${wallet}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
    </Paper>
  );
}

export default TradeGamble;
