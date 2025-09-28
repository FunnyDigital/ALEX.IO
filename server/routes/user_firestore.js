const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const axios = require('axios');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

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

// Updated auth middleware using Firebase Admin SDK
async function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken.uid;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
}

// GET /api/user/wallet
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      // Create user if doesn't exist
      await userRef.set({ wallet: 0, createdAt: new Date() });
      return res.json({ balance: 0 });
    }
    const user = userDoc.data();
    res.json({ balance: user.wallet || 0 });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// GET /api/user/wallet/debug
router.get('/wallet/debug', authMiddleware, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    res.json({ wallet: user.wallet || 0, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/wallet/deposit (Paystack integration)
router.post('/wallet/deposit', authMiddleware, async (req, res) => {
  try {
    const { reference, amount } = req.body;
    if (!reference || amount <= 0) return res.status(400).json({ message: 'Invalid request' });
    
    // Check if this is a demo transaction
    if (reference.startsWith('demo_')) {
      console.log('Processing demo deposit:', { reference, amount });
      // Skip Paystack verification for demo transactions
      const userRef = db.collection('users').doc(req.user);
      const userDoc = await userRef.get();
      if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
      const user = userDoc.data();
      const newWallet = (user.wallet || 0) + amount;
      await userRef.update({ wallet: newWallet });
      return res.json({ success: true, wallet: newWallet, message: `₦${amount} deposited successfully (DEMO)` });
    }
    
    // Real Paystack verification for non-demo transactions
    console.log('Processing real Paystack deposit:', { reference, amount });
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(500).json({ message: 'Payment processor not configured' });
    }
    
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    console.log('Verifying with Paystack:', verifyUrl);
    
    const paystackRes = await axios.get(verifyUrl, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    
    console.log('Paystack verification response:', paystackRes.data);
    const paymentData = paystackRes.data;
    
    if (paymentData.status !== true || paymentData.data.status !== 'success') {
      console.log('Payment verification failed:', paymentData);
      return res.status(400).json({ message: 'Payment not verified' });
    }
    
    if (paymentData.data.amount / 100 !== amount) {
      console.log('Amount mismatch:', { expected: amount, received: paymentData.data.amount / 100 });
      return res.status(400).json({ message: 'Payment amount mismatch' });
    }
    
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    const newWallet = (user.wallet || 0) + amount;
    await userRef.update({ wallet: newWallet });
    
    console.log('Real deposit successful:', { amount, newWallet });
    res.json({ success: true, wallet: newWallet, message: `₦${amount} deposited successfully` });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/user/wallet/withdraw
router.post('/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    if ((user.wallet || 0) < amount) return res.status(400).json({ message: 'Insufficient balance' });
    const newWallet = (user.wallet || 0) - amount;
    await userRef.update({ wallet: newWallet });
    res.json({ wallet: newWallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/user/wallet/payout (Paystack transfer)
router.post('/wallet/payout', authMiddleware, async (req, res) => {
  try {
    const { amount, account_number, bank_code } = req.body;
    if (amount <= 0 || !account_number || !bank_code) {
      return res.status(400).json({ message: 'Invalid payout request' });
    }
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    if ((user.wallet || 0) < amount) return res.status(400).json({ message: 'Insufficient balance' });
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    // Step 1: Create transfer recipient
    const recipientRes = await axios.post('https://api.paystack.co/transferrecipient', {
      type: 'nuban',
      name: user.username,
      account_number,
      bank_code,
      currency: 'NGN'
    }, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    const recipient_code = recipientRes.data.data.recipient_code;
    // Step 2: Initiate transfer
    const transferRes = await axios.post('https://api.paystack.co/transfer', {
      source: 'balance',
      amount: amount * 100,
      recipient: recipient_code,
      reason: 'Wallet withdrawal'
    }, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    // Deduct from wallet if transfer is queued/successful
    if (transferRes.data.status === true) {
      const newWallet = (user.wallet || 0) - amount;
      await userRef.update({ wallet: newWallet });
      return res.json({ wallet: newWallet, transfer: transferRes.data.data });
    } else {
      return res.status(500).json({ message: 'Payout failed', error: transferRes.data.message });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
