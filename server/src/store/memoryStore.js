const fs = require('fs');
const path = require('path');
const fsp = require('fs/promises');
const crypto = require('crypto');

const config = require('../config');

const FILE = config.paths.dataFile;

if (!fs.existsSync(config.paths.dataDir)) {
  fs.mkdirSync(config.paths.dataDir, { recursive: true });
}

function load() {
  try {
    if (fs.existsSync(FILE)) {
      return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[demo store] could not read datastore:', err.message);
  }
  return { users: {}, transactions: {} };
}

const data = load();
if (!data.users) data.users = {};
if (!data.transactions) data.transactions = {};

let writeQueue = Promise.resolve();

function persist() {
  const snapshot = JSON.stringify(data, null, 2);
  writeQueue = writeQueue
    .then(() => fsp.writeFile(FILE, snapshot))
    .catch((err) => console.error('[demo store] could not write datastore:', err.message));
  return writeQueue;
}

async function getUser(uid) {
  return data.users[uid] ? { id: uid, ...data.users[uid] } : null;
}

async function getUserByEmail(email) {
  const target = String(email || '').toLowerCase();
  const match = Object.entries(data.users).find(
    ([, user]) => user.email && String(user.email).toLowerCase() === target
  );
  return match ? { id: match[0], ...match[1] } : null;
}

async function createUser(user) {
  const uid = user.id || crypto.randomUUID();
  const { id, ...rest } = user;
  data.users[uid] = {
    wallet: 0,
    gamesPlayed: 0,
    wins: 0,
    createdAt: new Date().toISOString(),
    ...rest,
  };
  if (!data.transactions[uid]) data.transactions[uid] = [];
  await persist();
  return { id: uid, ...data.users[uid] };
}

async function updateUser(uid, patch) {
  if (!data.users[uid]) throw new Error('User not found');
  data.users[uid] = { ...data.users[uid], ...patch };
  await persist();
  return { id: uid, ...data.users[uid] };
}

async function transaction(uid, compute) {
  const user = data.users[uid];
  if (!user) throw new Error('User not found');
  const current = Number(user.wallet || 0);
  const { newWallet, payload } = compute(current);
  if (newWallet < 0) throw new Error('Insufficient funds');
  user.wallet = Number(newWallet.toFixed(2));
  await persist();
  return { wallet: user.wallet, ...(payload || {}) };
}

async function bumpStats(uid, win) {
  const user = data.users[uid];
  if (!user) throw new Error('User not found');
  user.gamesPlayed = Number(user.gamesPlayed || 0) + 1;
  if (win) user.wins = Number(user.wins || 0) + 1;
  await persist();
}

async function addTxRecord(uid, record) {
  if (!data.transactions[uid]) data.transactions[uid] = [];
  data.transactions[uid].unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...record,
  });
  data.transactions[uid] = data.transactions[uid].slice(0, 100);
  await persist();
}

async function listTransactions(uid) {
  return data.transactions[uid] || [];
}

module.exports = {
  getUser,
  getUserByEmail,
  createUser,
  updateUser,
  transaction,
  bumpStats,
  addTxRecord,
  listTransactions,
};
