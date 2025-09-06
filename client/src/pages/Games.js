import React from 'react';
import { Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './GamesMobile.css';

function Games() {
  const navigate = useNavigate();
  return (
    <div className="games-root">
      <div className="games-box">
        <Typography className="games-title">Choose a Game</Typography>
        <Button fullWidth className="games-btn" onClick={() => navigate('/games/coin-flip')}>
          Coin Flip
        </Button>
        <Button fullWidth className="games-btn" onClick={() => navigate('/games/dice-roll')}>
          Dice Roll
        </Button>
        <Button fullWidth className="games-btn" onClick={() => navigate('/games/trade-gamble')}>
          Trade Gamble
        </Button>
        <Button fullWidth className="games-btn" onClick={() => navigate('/games/flappy-bird')}>
          Flappy Bird
        </Button>
        <Button fullWidth className="games-btn back" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default Games;
