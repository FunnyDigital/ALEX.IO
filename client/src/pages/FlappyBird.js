import React, { useState } from 'react';
import { Typography, Button, Paper, TextField, LinearProgress } from '@mui/material';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function FlappyBird() {
  const [bet, setBet] = useState('');
  const [score, setScore] = useState('');
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setError('');
    setLoading(true);
    try {
      const user = auth.currentUser;
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentWallet = userDoc.data().wallet || 0;
      const betAmount = Number(bet);
      const userScore = Number(score);
      // Simple win/lose logic: win if score > 10
      const win = userScore > 10;
      let newWallet = currentWallet;
      if (betAmount > 0 && betAmount <= currentWallet) {
        if (win) {
          newWallet += betAmount;
        } else {
          newWallet -= betAmount;
        }
        await updateDoc(userRef, { wallet: newWallet });
        setResult(win ? 'Win' : 'Lose');
        setWallet(newWallet);
      } else {
        setError('Invalid bet or insufficient balance');
      }
    } catch (err) {
      setError('Error');
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6">Flappy Bird</Typography>
      <TextField label="Bet Amount" type="number" value={bet} onChange={e => setBet(e.target.value)} fullWidth sx={{ mt: 2 }} />
      <TextField label="Score" type="number" value={score} onChange={e => setScore(e.target.value)} fullWidth sx={{ mt: 2 }} />
  <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handlePlay} disabled={loading}>Play</Button>
  {loading && <LinearProgress sx={{ mt: 2 }} />}
      {result && <Typography sx={{ mt: 2 }}>Result: {result}</Typography>}
      {wallet !== null && <Typography>Wallet: ${wallet}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
    </Paper>
  );
}

export default FlappyBird;
