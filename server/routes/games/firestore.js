const express = require('express');
const router = express.Router();
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, getAuth } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (ensure only once)
if (!global._firebaseAdminInitialized) {
  initializeApp({
    credential: applicationDefault(),
  });
  global._firebaseAdminInitialized = true;
}
const db = getFirestore();

async function authMiddleware(req, res, next) {
  console.log('Auth middleware called');
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Token present:', !!token);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken.uid;
    console.log('Token verified for user:', req.user);
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
}

// Helper: atomic wallet update via transaction
async function updateWalletTxn(userId, computeNewWallet) {
  const userRef = db.collection('users').doc(userId);
  return db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new Error('User not found');
    const user = snap.data() || {};
    const current = Number(user.wallet || 0);
    const { newWallet, payload } = computeNewWallet(current);
    if (newWallet < 0) throw new Error('Insufficient funds');
    t.update(userRef, { wallet: newWallet });
    return { wallet: newWallet, ...payload };
  });
}

// POST /api/games/coin-flip
router.post('/coin-flip', authMiddleware, async (req, res) => {
  console.log('Coin flip request received:', req.body);
  console.log('User ID:', req.user);
  try {
    const { bet, choice } = req.body;
    const amount = Number(bet);
    console.log('Processed bet:', amount, 'choice:', choice);
    
    if (!amount || amount <= 0 || !['heads', 'tails'].includes(String(choice))) {
      console.log('Invalid input validation failed');
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const win = choice === result;
    console.log('Game result:', result, 'win:', win);
    
    const out = await updateWalletTxn(req.user, (current) => {
      console.log('Current wallet balance:', current);
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = win ? current + amount : current - amount;
      console.log('New wallet balance:', newWallet);
      return { newWallet, payload: { result, win } };
    });
    
    console.log('Transaction completed:', out);
    res.json({ success: true, result, win, wallet: out.wallet });
  } catch (err) {
    console.error('Coin Flip Error:', err);
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

// Alias to support legacy client path
router.post('/coinflip', authMiddleware, (req, res) => router.handle({ ...req, url: '/coin-flip' }, res));

// POST /api/games/dice-roll
router.post('/dice-roll', authMiddleware, async (req, res) => {
  try {
    const { bet, guess } = req.body;
    const amount = Number(bet);
    const g = Number(guess);
    if (!amount || amount <= 0 || !Number.isInteger(g) || g < 1 || g > 6) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const result = Math.floor(Math.random() * 6) + 1;
    const win = g === result;
    const payout = win ? amount * 5 : -amount;
    const out = await updateWalletTxn(req.user, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = current + payout;
      return { newWallet, payload: { result, win } };
    });
    res.json({ success: true, result, win, wallet: out.wallet });
  } catch (err) {
    console.error('Dice Roll Error:', err);
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

// POST /api/games/trade-gamble
router.post('/trade-gamble', authMiddleware, async (req, res) => {
  try {
    const { bet, direction, duration } = req.body;
    const amount = Number(bet);
    if (!amount || amount <= 0 || !['up','down'].includes(direction) || ![1,2,5,10].includes(Number(duration))) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const win = Math.random() < 0.5;
    const out = await updateWalletTxn(req.user, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = win ? current + amount : current - amount;
      return { newWallet, payload: { win } };
    });
    res.json({ success: true, win, wallet: out.wallet });
  } catch (err) {
    console.error('Trade Gamble Error:', err);
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

// POST /api/games/trade-gamble/settle - settle a resolved client-side trade (win true/false)
router.post('/trade-gamble/settle', authMiddleware, async (req, res) => {
  try {
    const { bet, win } = req.body;
    const amount = Number(bet);
    if (!amount || amount <= 0 || typeof win !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const out = await updateWalletTxn(req.user, (current) => {
      if (current < amount && !win) throw new Error('Insufficient funds');
      const newWallet = win ? current + amount : current - amount;
      return { newWallet, payload: { win } };
    });
    res.json({ success: true, win, wallet: out.wallet });
  } catch (err) {
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

// POST /api/games/flappy-bird
router.post('/flappy-bird', authMiddleware, async (req, res) => {
  try {
    const { bet, score } = req.body;
    const amount = Number(bet);
    if (!amount || amount <= 0 || typeof score !== 'number' || score < 0) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const win = score >= 10;
    const delta = win ? amount * 2 : -amount;
    const out = await updateWalletTxn(req.user, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = current + delta;
      return { newWallet, payload: { win } };
    });
    res.json({ success: true, win, wallet: out.wallet });
  } catch (err) {
    console.error('Flappy Bird Error:', err);
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

module.exports = router;
