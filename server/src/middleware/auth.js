const jwt = require('jsonwebtoken');

const config = require('../config');

async function auth(req, res, next) {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    if (config.isDemo) {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = payload.uid;
    } else {
      const { admin } = require('../firebase');
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded.uid;
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

module.exports = auth;
