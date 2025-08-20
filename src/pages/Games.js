import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Games() {
  const navigate = useNavigate();
  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" align="center">Choose a Game</Typography>
  <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/games/coin-flip')}>
        Coin Flip
      </Button>
  <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/games/dice-roll')}>
        Dice Roll
      </Button>
  <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/games/trade-gamble')}>
        Trade Gamble
      </Button>
  <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/games/flappy-bird')}>
        Flappy Bird
      </Button>
      <Button fullWidth sx={{ mt: 2 }} onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </Paper>
  );
}

export default Games;
