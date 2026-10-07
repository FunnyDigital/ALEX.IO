const express = require('express');
const axios = require('axios');

const config = require('../config');
const store = require('../store');
const auth = require('../middleware/auth');

const router = express.Router();

const WELCOME_BALANCE = 1000;
const EDITABLE_FIELDS = [
  'username',
  'firstName',
  'lastName',
  'phoneNumber',
  'accountNumber',
  'bankCode',
  'bankName',
];

function sanitize(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

function fail(res, err) {
  const known = ['User not found', 'Insufficient funds'];
  if (known.includes(err.message)) {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error' });
}

async function ensureUser(uid) {
  let user = await store.getUser(uid);
  if (!user) {
    user = await store.createUser({ id: uid, wallet: WELCOME_BALANCE });
  }
  return user;
}

router.get('/profile', auth, async (req, res) => {
  try {
    res.json(sanitize(await ensureUser(req.user)));
  } catch (err) {
    fail(res, err);
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const patch = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) patch[field] = req.body[field];
    }
    const updated = await store.updateUser(req.user, patch);
    res.json(sanitize(updated));
  } catch (err) {
    fail(res, err);
  }
});

router.get('/wallet', auth, async (req, res) => {
  try {
    const user = await ensureUser(req.user);
    res.json({ balance: Number(user.wallet || 0) });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/wallet/deposit', auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const reference = String(req.body.reference || '');
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    await ensureUser(req.user);

    if (!config.isDemo && !reference.startsWith('demo_')) {
      if (!config.paystackSecretKey) {
        return res.status(500).json({ message: 'Payment processor not configured' });
      }
      const { data } = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${config.paystackSecretKey}` },
      });
      if (data.status !== true || data.data.status !== 'success') {
        return res.status(400).json({ message: 'Payment not verified' });
      }
      if (data.data.amount / 100 !== amount) {
        return res.status(400).json({ message: 'Payment amount mismatch' });
      }
    }

    const out = await store.transaction(req.user, (current) => ({
      newWallet: current + amount,
      payload: { amount },
    }));
    await store.addTxRecord(req.user, { type: 'deposit', amount, balance: out.wallet });
    res.json({ success: true, wallet: out.wallet, message: `Deposited ${amount} successfully` });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/wallet/withdraw', auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    const out = await store.transaction(req.user, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      return { newWallet: current - amount, payload: { amount } };
    });
    await store.addTxRecord(req.user, { type: 'withdraw', amount: -amount, balance: out.wallet });
    res.json({ success: true, wallet: out.wallet });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/wallet/payout', auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { account_number, bank_code } = req.body;
    if (!amount || amount <= 0 || !account_number || !bank_code) {
      return res.status(400).json({ message: 'Invalid payout request' });
    }
    const user = await ensureUser(req.user);
    if (Number(user.wallet || 0) < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    let transfer = { reference: `demo_payout_${Date.now()}`, status: 'success' };

    if (!config.isDemo && config.paystackSecretKey) {
      const recipientRes = await axios.post(
        'https://api.paystack.co/transferrecipient',
        {
          type: 'nuban',
          name: user.username || 'ALEX.IO user',
          account_number,
          bank_code,
          currency: 'NGN',
        },
        { headers: { Authorization: `Bearer ${config.paystackSecretKey}` } }
      );
      const recipient = recipientRes.data.data.recipient_code;
      const transferRes = await axios.post(
        'https://api.paystack.co/transfer',
        { source: 'balance', amount: amount * 100, recipient, reason: 'Wallet withdrawal' },
        { headers: { Authorization: `Bearer ${config.paystackSecretKey}` } }
      );
      if (transferRes.data.status !== true) {
        return res.status(502).json({ message: 'Payout failed', error: transferRes.data.message });
      }
      transfer = transferRes.data.data;
    }

    const out = await store.transaction(req.user, (current) => {
      if (current < amount) throw new Error('Insufficient funds');
      return { newWallet: current - amount, payload: { amount } };
    });
    await store.addTxRecord(req.user, {
      type: 'payout',
      amount: -amount,
      balance: out.wallet,
      account_number,
      bank_code,
    });
    res.json({ success: true, wallet: out.wallet, transfer });
  } catch (err) {
    fail(res, err);
  }
});

router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await store.listTransactions(req.user);
    res.json({ transactions });
  } catch (err) {
    fail(res, err);
  }
});

module.exports = router;
