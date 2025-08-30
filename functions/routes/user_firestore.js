const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Example: Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.query.uid;
    if (!userId) return res.status(400).json({ message: 'Missing uid' });
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    res.json(userDoc.data());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
