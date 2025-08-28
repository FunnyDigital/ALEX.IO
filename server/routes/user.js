// POST /api/user/wallet/payout (Paystack transfer)
router.post('/wallet/payout', authMiddleware, async (req, res) => {
  try {
    const { amount, account_number, bank_code } = req.body;
    if (amount <= 0 || !account_number || !bank_code) {
      return res.status(400).json({ message: 'Invalid payout request' });
    }
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.wallet < amount) return res.status(400).json({ message: 'Insufficient balance' });

    // Initiate Paystack transfer
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
      user.wallet -= amount;
      await user.save();
      return res.json({ wallet: user.wallet, transfer: transferRes.data.data });
    } else {
      return res.status(500).json({ message: 'Payout failed', error: transferRes.data.message });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// ...existing code...
// ...existing code...
// ...existing code...

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
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

    // Verify payment with Paystack
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const paystackRes = await axios.get(verifyUrl, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    const paymentData = paystackRes.data;
    if (paymentData.status !== true || paymentData.data.status !== 'success' || paymentData.data.amount / 100 !== amount) {
      return res.status(400).json({ message: 'Payment not verified or amount mismatch' });
    }

    // Credit user wallet
    const user = await User.findById(req.user);
    user.wallet += amount;
    await user.save();
    res.json({ wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/user/wallet/withdraw
router.post('/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.wallet < amount) return res.status(400).json({ message: 'Insufficient balance' });
    user.wallet -= amount;
    await user.save();
    res.json({ wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
