import React, { useState } from 'react';
import { Typography, Button, Paper, TextField, LinearProgress } from '@mui/material';
import axios from 'axios';
import { auth } from '../firebase';

function DiceRoll() {
  const [bet, setBet] = useState('');
  const [guess, setGuess] = useState(1);
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setError('');
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
  const res = await axios.post('https://api-v2ckmk5jla-uc.a.run.app/api/games/dice-roll', { bet: Number(bet), guess: Number(guess) }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data.result);
      setWallet(res.data.wallet);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error');
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6">Dice Roll</Typography>
      <TextField label="Bet Amount" type="number" value={bet} onChange={e => setBet(e.target.value)} fullWidth sx={{ mt: 2 }} />
      <TextField label="Your Guess (1-6)" type="number" value={guess} onChange={e => setGuess(e.target.value)} fullWidth sx={{ mt: 2 }} inputProps={{ min: 1, max: 6 }} />
  <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handlePlay} disabled={loading}>Play</Button>
  {loading && <LinearProgress sx={{ mt: 2 }} />}
      {result && <Typography sx={{ mt: 2 }}>Result: {result}</Typography>}
      {wallet !== null && <Typography>Wallet: ${wallet}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
    </Paper>
  );
}

export default DiceRoll;
