const config = require('./config');

let admin = null;
let db = null;

if (!config.isDemo) {
  const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  admin = require('firebase-admin');

  let credential;
  if (config.serviceAccountPath) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = config.serviceAccountPath;
    credential = applicationDefault();
  } else {
    credential = cert({
      projectId: config.firebaseProjectId,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });
  }

  initializeApp({ credential, projectId: config.firebaseProjectId });
  db = getFirestore();
}

module.exports = { admin, db };
