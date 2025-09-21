const express = require('express');
const router = express.Router();
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken.uid;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
}

// POST /api/games/coin-flip (transactional)
router.post('/coin-flip', authMiddleware, async (req, res) => {
  try {
    const { bet, choice } = req.body;
    const wager = Number(bet);
    if (!wager || wager <= 0 || !['heads', 'tails'].includes(String(choice))) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const userRef = db.collection('users').doc(req.user);
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    let response;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('User not found');
      const data = snap.data();
      const current = Number(data.wallet || 0);
      if (current < wager) {
        throw new Error('Insufficient funds');
      }
      const win = String(choice) === result;
      const newWallet = win ? current + wager : current - wager;
      tx.update(userRef, { wallet: newWallet });
      response = { result, win, wallet: newWallet };
    });
    res.json(response);
  } catch (err) {
    const msg = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    if (msg !== 'Server error') return res.status(msg === 'User not found' ? 404 : 400).json({ message: msg });
    console.error('Coin Flip Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/games/dice-roll
router.post('/dice-roll', authMiddleware, async (req, res) => {
  try {
    const { bet, guess } = req.body;
    const wager = Number(bet);
    const g = Number(guess);
    if (!wager || wager <= 0 || !Number.isInteger(g) || g < 1 || g > 6) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const userRef = db.collection('users').doc(req.user);
    const result = Math.floor(Math.random() * 6) + 1;
    let response;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('User not found');
      const current = Number(snap.data().wallet || 0);
      if (current < wager) throw new Error('Insufficient funds');
      const win = g === result;
      const newWallet = win ? current + wager * 5 : current - wager;
      tx.update(userRef, { wallet: newWallet });
      response = { result, win, wallet: newWallet };
    });
    res.json(response);
  } catch (err) {
    const msg = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    if (msg !== 'Server error') return res.status(msg === 'User not found' ? 404 : 400).json({ message: msg });
    console.error('Dice Roll Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/games/trade-gamble
router.post('/trade-gamble', authMiddleware, async (req, res) => {
  try {
    const { bet, direction, duration } = req.body;
    const wager = Number(bet);
    const dur = Number(duration);
    if (!wager || wager <= 0 || !['up', 'down'].includes(String(direction)) || ![1, 2, 5, 10].includes(dur)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const userRef = db.collection('users').doc(req.user);
    const win = Math.random() < 0.5;
    let response;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('User not found');
      const current = Number(snap.data().wallet || 0);
      if (current < wager) throw new Error('Insufficient funds');
      const newWallet = win ? current + wager : current - wager;
      tx.update(userRef, { wallet: newWallet });
      response = { win, wallet: newWallet };
    });
    res.json(response);
  } catch (err) {
    const msg = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    if (msg !== 'Server error') return res.status(msg === 'User not found' ? 404 : 400).json({ message: msg });
    console.error('Trade Gamble Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/games/flappy-bird
router.post('/flappy-bird', authMiddleware, async (req, res) => {
  try {
    const { bet, score } = req.body;
    const wager = Number(bet);
    const sc = Number(score);
    if (!wager || wager <= 0 || !Number.isFinite(sc) || sc < 0) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const userRef = db.collection('users').doc(req.user);
    let response;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('User not found');
      const current = Number(snap.data().wallet || 0);
      if (current < wager) throw new Error('Insufficient funds');
      const win = sc >= 10;
      const newWallet = win ? current + wager * 2 : current - wager;
      tx.update(userRef, { wallet: newWallet });
      response = { win, wallet: newWallet };
    });
    res.json(response);
  } catch (err) {
    const msg = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    if (msg !== 'Server error') return res.status(msg === 'User not found' ? 404 : 400).json({ message: msg });
    console.error('Flappy Bird Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
