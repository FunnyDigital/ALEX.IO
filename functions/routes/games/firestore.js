const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

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



// Middleware to verify Firebase ID token and set req.userId
async function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
}

// Apply authMiddleware to all game routes
router.use(authMiddleware);

// Play coin flip game (uses authenticated user)
router.post('/coin-flip', async (req, res) => {
  try {
    const { bet, choice } = req.body;
    const amount = Number(bet);
    if (!amount || amount <= 0 || !['heads','tails'].includes(String(choice))) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const win = choice === result;
    const out = await updateWalletTxn(req.userId, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = win ? current + amount : current - amount;
      return { newWallet, payload: { result, win } };
    });
    res.json({ success: true, result, win, wallet: out.wallet });
  } catch (err) {
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

// alias
router.post('/coinflip', (req, res) => router.handle({ ...req, url: '/coin-flip' }, res));

// Play dice roll game
router.post('/dice-roll', async (req, res) => {
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
    const out = await updateWalletTxn(req.userId, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = current + payout;
      return { newWallet, payload: { result, win } };
    });
    res.json({ success: true, result, win, wallet: out.wallet });
  } catch (err) {
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

// Play trade gamble game
router.post('/trade-gamble', async (req, res) => {
  try {
    const { bet, direction, duration } = req.body;
    const amount = Number(bet);
    if (!amount || amount <= 0 || !['up','down'].includes(direction) || ![1,2,5,10].includes(Number(duration))) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const win = Math.random() < 0.5;
    const out = await updateWalletTxn(req.userId, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = win ? current + amount : current - amount;
      return { newWallet, payload: { win } };
    });
    res.json({ success: true, win, wallet: out.wallet });
  } catch (err) {
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

router.post('/trade-gamble/settle', async (req, res) => {
  try {
    const { bet, win } = req.body;
    const amount = Number(bet);
    if (!amount || amount <= 0 || typeof win !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const out = await updateWalletTxn(req.userId, (current) => {
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

// Play flappy bird game
router.post('/flappy-bird', async (req, res) => {
  try {
    const { bet, score } = req.body;
    const amount = Number(bet);
    if (!amount || amount <= 0 || typeof score !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const win = score >= 10;
    const delta = win ? amount * 2 : -amount;
    const out = await updateWalletTxn(req.userId, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = current + delta;
      return { newWallet, payload: { win } };
    });
    res.json({ success: true, win, wallet: out.wallet });
  } catch (err) {
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

module.exports = router;
