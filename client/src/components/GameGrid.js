import React from 'react';

const games = [
  { name: 'Coin Flip', icon: '🪙', route: '/games/coin-flip' },
  { name: 'Dice Roll', icon: '🎲', route: '/games/dice-roll' },
  { name: 'Trade Gamble', icon: '📈', route: '/games/trade-gamble' },
  { name: 'Flappy Bird', icon: '🐦', route: '/games/flappy-bird' },
];

export default function GameGrid({ onPlay }) {
  return (
    <section className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-12 px-4">
      {games.map((game) => (
        <div
          key={game.name}
          className="bg-gray-900 rounded-2xl shadow-xl flex flex-col items-center p-8 border border-gray-800 hover:border-gold-400 transition duration-200"
        >
          <div className="text-6xl mb-4">{game.icon}</div>
          <div className="text-xl font-bold text-gold-400 mb-4">{game.name}</div>
          <button
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-gold-400 hover:from-gold-400 hover:to-blue-600 text-gray-900 font-bold rounded-lg shadow transition duration-200"
            onClick={() => onPlay(game.route)}
          >
            Play Now
          </button>
        </div>
      ))}
    </section>
  );
}
