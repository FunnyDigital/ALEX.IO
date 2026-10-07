const express = require('express');

const store = require('../store');
const auth = require('../middleware/auth');
const logic = require('../games/logic');

const router = express.Router();

function fail(res, err) {
  const known = ['User not found', 'Insufficient funds'];
  if (known.includes(err.message)) {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error' });
}

async function settle(req, res, { game, amount, outcome }) {
  const out = await store.transaction(req.user, (current) => {
    if (current < amount) throw new Error('Insufficient funds');
    return { newWallet: current + outcome.profit, payload: outcome };
  });
  await store.bumpStats(req.user, outcome.win);
  await store.addTxRecord(req.user, {
    type: 'game',
    game,
    bet: amount,
    profit: outcome.profit,
    win: outcome.win,
    balance: out.wallet,
  });
  res.json({ success: true, ...outcome, bet: amount, wallet: out.wallet });
}

router.post('/coin-flip', auth, async (req, res) => {
  try {
    const amount = Number(req.body.bet);
    const choice = String(req.body.choice);
    if (!amount || amount <= 0 || !['heads', 'tails'].includes(choice)) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    await settle(req, res, { game: 'coin-flip', amount, outcome: logic.playCoinFlip(amount, choice) });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/dice-roll', auth, async (req, res) => {
  try {
    const amount = Number(req.body.bet);
    const guess = Number(req.body.guess);
    if (!amount || amount <= 0 || !Number.isInteger(guess) || guess < 1 || guess > 6) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    await settle(req, res, { game: 'dice-roll', amount, outcome: logic.playDiceRoll(amount, guess) });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/trade-gamble', auth, async (req, res) => {
  try {
    const amount = Number(req.body.bet);
    const direction = req.body.direction;
    const duration = Number(req.body.duration);
    if (!amount || amount <= 0 || !['up', 'down'].includes(direction) || ![1, 2, 5, 10].includes(duration)) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    await settle(req, res, {
      game: 'trade-gamble',
      amount,
      outcome: logic.playTradeGamble(amount, direction, duration),
    });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/flappy-bird', auth, async (req, res) => {
  try {
    const amount = Number(req.body.bet);
    const { completed, timeTarget, timeSurvived } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid bet amount' });
    }
    if (typeof completed !== 'boolean' || !timeTarget || Number(timeSurvived) < 0) {
      return res.status(400).json({ success: false, message: 'Invalid game data' });
    }
    if (completed && Number(timeSurvived) < Number(timeTarget) - 0.5) {
      return res.status(400).json({ success: false, message: 'Invalid game length telemetry' });
    }
    await settle(req, res, {
      game: 'flappy-bird',
      amount,
      outcome: logic.playFlappyBird(amount, completed),
    });
  } catch (err) {
    fail(res, err);
  }
});

module.exports = router;
