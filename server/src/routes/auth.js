const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../config');
const store = require('../store');
const auth = require('../middleware/auth');

const router = express.Router();

const WELCOME_BALANCE = 1000;

function sanitize(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

function signToken(user) {
  return jwt.sign({ uid: user.id }, config.jwtSecret, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = await store.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await store.createUser({
      username: username || String(email).split('@')[0],
      email,
      passwordHash,
      wallet: WELCOME_BALANCE,
    });
    res.status(201).json({ token: signToken(user), user: sanitize(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await store.getUserByEmail(email || '');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user: sanitize(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await store.getUser(req.user);
  res.json(sanitize(user));
});

module.exports = router;
