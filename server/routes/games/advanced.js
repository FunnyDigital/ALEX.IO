const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

// POST /api/games/trade-gamble
router.post('/trade-gamble', authMiddleware, async (req, res) => {
  try {
    const { bet, direction, duration } = req.body; // direction: 'up' or 'down', duration: 1,2,5,10 (minutes)
    if (bet <= 0 || !['up','down'].includes(direction) || ![1,2,5,10].includes(duration)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const user = await User.findById(req.user);
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    // Simulate chart movement (random win/loss)
    const win = Math.random() < 0.5;
    if (win) {
      user.wallet += bet;
    } else {
      user.wallet -= bet;
    }
    await user.save();
    res.json({ win, wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/games/flappy-bird
router.post('/flappy-bird', authMiddleware, async (req, res) => {
  try {
    const { bet, score } = req.body; // score: number of points achieved
    if (bet <= 0 || typeof score !== 'number' || score < 0) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const user = await User.findById(req.user);
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    // Simple reward logic: win if score >= 10
    let win = false;
    if (score >= 10) {
      user.wallet += bet * 2;
      win = true;
    } else {
      user.wallet -= bet;
    }
    await user.save();
    res.json({ win, wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
