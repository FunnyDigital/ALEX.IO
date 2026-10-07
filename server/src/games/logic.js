const crypto = require('crypto');

const HOUSE_EDGE = {
  coinFlip: 0.96,
  diceRoll: 4.88,
  tradeGamble: 0.9,
  flappyBird: 0.96,
};

const round2 = (value) => Number(value.toFixed(2));

function playCoinFlip(amount, choice) {
  const result = crypto.randomBytes(1)[0] % 2 === 0 ? 'heads' : 'tails';
  const win = choice === result;
  return { result, choice, win, profit: round2(win ? amount * HOUSE_EDGE.coinFlip : -amount) };
}

function playDiceRoll(amount, guess) {
  const result = crypto.randomInt(1, 7);
  const win = Number(guess) === result;
  return { result, guess: Number(guess), win, profit: round2(win ? amount * HOUSE_EDGE.diceRoll : -amount) };
}

function playTradeGamble(amount, direction, duration) {
  const win = crypto.randomBytes(1)[0] % 2 === 0;
  return {
    direction,
    duration: Number(duration),
    win,
    profit: round2(win ? amount * HOUSE_EDGE.tradeGamble : -amount),
  };
}

function playFlappyBird(amount, completed) {
  return { win: completed, profit: round2(completed ? amount * HOUSE_EDGE.flappyBird : -amount) };
}

module.exports = { playCoinFlip, playDiceRoll, playTradeGamble, playFlappyBird };
