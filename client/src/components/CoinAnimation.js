import React from 'react';
import { Box } from '@mui/material';
import headsImg from '../assets/coin-heads.png';
import tailsImg from '../assets/coin-tails.png';

/**
 * Coin animation component
 * Props:
 *  - result: 'heads' | 'tails' | null
 *  - spinning: boolean
 */
function CoinAnimation({ result, spinning }) {
  // Choose image based on result
  const coinImg = result === 'heads' ? headsImg : tailsImg;
  return (
    <Box
      sx={{
        width: 120,
        height: 120,
        margin: '0 auto',
        perspective: 600,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          boxShadow: 3,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 1s cubic-bezier(.17,.67,.83,.67)',
          transform: spinning
            ? 'rotateY(1080deg)' // 3 spins
            : result === 'heads'
            ? 'rotateY(0deg)'
            : 'rotateY(180deg)',
        }}
      >
        <img
          src={coinImg}
          alt={result || 'coin'}
          style={{ width: 100, height: 100, borderRadius: '50%' }}
        />
      </Box>
    </Box>
  );
}

export default CoinAnimation;
