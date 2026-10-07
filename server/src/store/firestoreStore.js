const { db } = require('../firebase');

const users = () => db.collection('users');

async function getUser(uid) {
  const snap = await users().doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function getUserByEmail(email) {
  const snap = await users().where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function createUser(user) {
  const uid = user.id || users().doc().id;
  const { id, ...rest } = user;
  const record = {
    wallet: 0,
    gamesPlayed: 0,
    wins: 0,
    createdAt: new Date().toISOString(),
    ...rest,
  };
  await users().doc(uid).set(record);
  return { id: uid, ...record };
}

async function updateUser(uid, patch) {
  await users().doc(uid).set(patch, { merge: true });
  return getUser(uid);
}

async function transaction(uid, compute) {
  const ref = users().doc(uid);
  return db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists) throw new Error('User not found');
    const current = Number((snap.data() || {}).wallet || 0);
    const { newWallet, payload } = compute(current);
    if (newWallet < 0) throw new Error('Insufficient funds');
    const rounded = Number(newWallet.toFixed(2));
    t.update(ref, { wallet: rounded });
    return { wallet: rounded, ...(payload || {}) };
  });
}

async function bumpStats(uid, win) {
  const { FieldValue } = require('firebase-admin/firestore');
  await users().doc(uid).set(
    {
      gamesPlayed: FieldValue.increment(1),
      wins: FieldValue.increment(win ? 1 : 0),
    },
    { merge: true }
  );
}

async function addTxRecord(uid, record) {
  await users().doc(uid).collection('transactions').add({
    createdAt: new Date().toISOString(),
    ...record,
  });
}

async function listTransactions(uid) {
  const snap = await users()
    .doc(uid)
    .collection('transactions')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
