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

// POST /api/games/coin-flip
router.post('/coin-flip', authMiddleware, async (req, res) => {
  try {
    const { bet, choice } = req.body;
    if (bet <= 0) return res.status(400).json({ message: 'Invalid bet amount' });
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    let win = false;
    let newWallet = user.wallet;
    if (choice === result) {
      newWallet += bet;
      win = true;
    } else {
      newWallet -= bet;
    }
    await userRef.update({ wallet: newWallet });
    res.json({ result, win, wallet: newWallet });
  } catch (err) {
    console.error('Coin Flip Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/games/dice-roll
router.post('/dice-roll', authMiddleware, async (req, res) => {
  try {
    const { bet, guess } = req.body;
    if (bet <= 0 || guess < 1 || guess > 6) return res.status(400).json({ message: 'Invalid input' });
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    const result = Math.floor(Math.random() * 6) + 1;
    let win = false;
    let newWallet = user.wallet;
    if (guess === result) {
      newWallet += bet * 5;
      win = true;
    } else {
      newWallet -= bet;
    }
    await userRef.update({ wallet: newWallet });
    res.json({ result, win, wallet: newWallet });
  } catch (err) {
    console.error('Dice Roll Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/games/trade-gamble
router.post('/trade-gamble', authMiddleware, async (req, res) => {
  try {
    const { bet, direction, duration } = req.body;
    if (bet <= 0 || !['up','down'].includes(direction) || ![1,2,5,10].includes(duration)) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    const win = Math.random() < 0.5;
    let newWallet = user.wallet;
    if (win) {
      newWallet += bet;
    } else {
      newWallet -= bet;
    }
    await userRef.update({ wallet: newWallet });
    res.json({ win, wallet: newWallet });
  } catch (err) {
    console.error('Trade Gamble Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/games/flappy-bird
router.post('/flappy-bird', authMiddleware, async (req, res) => {
  try {
    const { bet, score } = req.body;
    if (bet <= 0 || typeof score !== 'number' || score < 0) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    if (user.wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });

    let win = false;
    let newWallet = user.wallet;
    if (score >= 10) {
      newWallet += bet * 2;
      win = true;
    } else {
      newWallet -= bet;
    }
    await userRef.update({ wallet: newWallet });
    res.json({ win, wallet: newWallet });
  } catch (err) {
    console.error('Flappy Bird Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
