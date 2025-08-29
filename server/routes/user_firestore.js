const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!global._firebaseAdminInitialized) {
  initializeApp({
    credential: applicationDefault(),
  });
  global._firebaseAdminInitialized = true;
}
const db = getFirestore();

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
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const paystackRes = await axios.get(verifyUrl, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    const paymentData = paystackRes.data;
    if (paymentData.status !== true || paymentData.data.status !== 'success' || paymentData.data.amount / 100 !== amount) {
      return res.status(400).json({ message: 'Payment not verified or amount mismatch' });
    }
    const userRef = db.collection('users').doc(req.user);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    const newWallet = (user.wallet || 0) + amount;
    await userRef.update({ wallet: newWallet });
    res.json({ wallet: newWallet });
  } catch (err) {
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
