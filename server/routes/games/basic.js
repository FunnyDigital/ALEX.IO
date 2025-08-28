const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
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

// POST /api/games/coin-flip
router.post('/coin-flip', authMiddleware, async (req, res) => {
  try {
    const { bet, choice } = req.body; // choice: 'heads' or 'tails'
    if (bet <= 0) return res.status(400).json({ message: 'Invalid bet amount' });
    const user = await User.findById(req.user);
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    let win = false;
    if (choice === result) {
      user.wallet += bet;
      win = true;
    } else {
      user.wallet -= bet;
    }
    await user.save();
    res.json({ result, win, wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/games/dice-roll
router.post('/dice-roll', authMiddleware, async (req, res) => {
  try {
    const { bet, guess } = req.body; // guess: 1-6
    if (bet <= 0 || guess < 1 || guess > 6) return res.status(400).json({ message: 'Invalid input' });
    const user = await User.findById(req.user);
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    const result = Math.floor(Math.random() * 6) + 1;
    let win = false;
    if (guess === result) {
      user.wallet += bet * 5; // 1/6 chance
      win = true;
    } else {
      user.wallet -= bet;
    }
    await user.save();
    res.json({ result, win, wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
