require('dotenv').config();

const fs = require('fs');
const path = require('path');

const SERVER_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SERVER_ROOT, '..');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(SERVER_ROOT, process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

const hasServiceAccountFile = Boolean(serviceAccountPath && fs.existsSync(serviceAccountPath));
const hasServiceAccountEnv = Boolean(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL);

function resolveMode() {
  const requested = (process.env.DEMO_MODE || 'auto').toLowerCase();
  if (requested === 'demo') return 'demo';
  if (requested === 'firebase') return 'firebase';
  return hasServiceAccountFile || hasServiceAccountEnv ? 'firebase' : 'demo';
}

const mode = resolveMode();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;

module.exports = {
  mode,
  isDemo: mode === 'demo',
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || '0.0.0.0',
  corsOrigins,
  jwtSecret: process.env.JWT_SECRET || 'alex-io-demo-secret-change-me',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'alexio-b7a7c',
  serviceAccountPath: hasServiceAccountFile ? serviceAccountPath : null,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paths: {
    serverRoot: SERVER_ROOT,
    repoRoot: REPO_ROOT,
    webDist: path.resolve(REPO_ROOT, 'web', 'dist'),
    dataDir: path.resolve(SERVER_ROOT, 'data'),
    dataFile: path.resolve(SERVER_ROOT, 'data', 'db.json'),
  },
};
