const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();



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
    if (!bet || !choice) return res.status(400).json({ message: 'Missing parameters' });
    const userRef = db.collection('users').doc(req.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    let wallet = userDoc.data().wallet || 0;
    if (wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    let win = false;
    if (choice === result) {
      wallet += bet;
      win = true;
    } else {
      wallet -= bet;
    }
    await userRef.update({ wallet });
    res.json({ result, win, wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Play dice roll game
router.post('/dice-roll', async (req, res) => {
  try {
    const { bet, guess } = req.body;
    if (!bet || !guess) return res.status(400).json({ message: 'Missing parameters' });
    const userRef = db.collection('users').doc(req.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    let wallet = userDoc.data().wallet || 0;
    if (wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });
    const result = Math.floor(Math.random() * 6) + 1;
    let win = false;
    if (guess === result) {
      wallet += bet * 5;
      win = true;
    } else {
      wallet -= bet;
    }
    await userRef.update({ wallet });
    res.json({ result, win, wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Play trade gamble game
router.post('/trade-gamble', async (req, res) => {
  try {
    const { bet, direction, duration } = req.body;
    if (!bet || !direction || !duration) return res.status(400).json({ message: 'Missing parameters' });
    if (!['up','down'].includes(direction) || ![1,2,5,10].includes(Number(duration))) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const userRef = db.collection('users').doc(req.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    let wallet = userDoc.data().wallet || 0;
    if (wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });
    const win = Math.random() < 0.5;
    if (win) {
      wallet += bet;
    } else {
      wallet -= bet;
    }
    await userRef.update({ wallet });
    res.json({ win, wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Play flappy bird game
router.post('/flappy-bird', async (req, res) => {
  try {
    const { bet, score } = req.body;
    if (!bet || typeof score !== 'number') return res.status(400).json({ message: 'Missing parameters' });
    const userRef = db.collection('users').doc(req.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    let wallet = userDoc.data().wallet || 0;
    if (wallet < bet) return res.status(400).json({ message: 'Insufficient funds' });
    let win = false;
    if (score >= 10) {
      wallet += bet * 2;
      win = true;
    } else {
      wallet -= bet;
    }
    await userRef.update({ wallet });
    res.json({ win, wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
