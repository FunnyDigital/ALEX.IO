const express = require('express');
const router = express.Router();
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, getAuth } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK (ensure only once)
if (!global._firebaseAdminInitialized) {
  let credential;
  
  // Check if service account key file exists
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
    console.log('Using service account credentials from file');
    credential = applicationDefault();
  } else {
    console.log('Service account file not found, using environment variables');
    // Use environment variables for Firebase config
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "alexio-b7a7c",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };
    
    // Check if we have the required environment variables
    if (serviceAccount.private_key && serviceAccount.client_email) {
      credential = cert(serviceAccount);
    } else {
      throw new Error('Firebase credentials not found. Please provide either a service account file or environment variables.');
    }
  }
  
  initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID || "alexio-b7a7c"
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
      const payout = win ? amount : -amount; // Win: get bet back (net +amount), Lose: lose bet (net -amount)
      const newWallet = current + payout;
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
      const payout = win ? amount : -amount; // Win: net +amount, Lose: net -amount
      const newWallet = current + payout;
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
      const payout = win ? amount : -amount; // Win: net +amount, Lose: net -amount
      const newWallet = current + payout;
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
    const { bet, completed, timeTarget, timeSurvived, score, multiplier, totalWinnings } = req.body;
    
    console.log('Flappy Bird game data:', req.body);
    
    const amount = Number(bet);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid bet amount' });
    }
    
    if (typeof completed !== 'boolean' || !timeTarget || timeSurvived < 0) {
      return res.status(400).json({ success: false, message: 'Invalid game data' });
    }
    
    // Calculate winnings based on completion and multiplier
    let delta;
    let winnings = 0;
    
    if (completed) {
      // Player completed the target time - they win!
      winnings = amount * (multiplier || 1); // Bet amount × multiplier
      delta = -amount + winnings; // Subtract bet, add winnings (net profit)
    } else {
      // Player failed - they lose only the bet amount
      delta = -amount; // Subtract bet amount from wallet
      winnings = 0;
    }
    
    const out = await updateWalletTxn(req.user, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      const newWallet = current + delta;
      return { 
        newWallet, 
        payload: { 
          win: completed, 
          winnings,
          timeSurvived,
          timeTarget,
          score,
          multiplier: multiplier || 1
        } 
      };
    });
    
    console.log('Flappy Bird result:', { completed, winnings, newWallet: out.wallet });
    
    res.json({ 
      success: true, 
      win: completed, 
      winnings,
      wallet: out.wallet,
      timeSurvived,
      timeTarget,
      score,
      multiplier: multiplier || 1
    });
  } catch (err) {
    console.error('Flappy Bird Error:', err);
    const message = err.message === 'User not found' || err.message === 'Insufficient funds' ? err.message : 'Server error';
    res.status(message === 'Server error' ? 500 : 400).json({ success: false, message });
  }
});

module.exports = router;
