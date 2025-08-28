import React, { useState } from 'react';
import { Typography, Button, Paper, TextField } from '@mui/material';
import axios from 'axios';

function DiceRoll() {
  const [bet, setBet] = useState('');
  const [guess, setGuess] = useState(1);
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');

  const handlePlay = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/games/dice-roll', { bet: Number(bet), guess: Number(guess) }, {
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
      <Typography variant="h6">Dice Roll</Typography>
      <TextField label="Bet Amount" type="number" value={bet} onChange={e => setBet(e.target.value)} fullWidth sx={{ mt: 2 }} />
      <TextField label="Your Guess (1-6)" type="number" value={guess} onChange={e => setGuess(e.target.value)} fullWidth sx={{ mt: 2 }} inputProps={{ min: 1, max: 6 }} />
      <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handlePlay}>Play</Button>
      {result && <Typography sx={{ mt: 2 }}>Result: {result}</Typography>}
      {wallet !== null && <Typography>Wallet: ${wallet}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
    </Paper>
  );
}

export default DiceRoll;
