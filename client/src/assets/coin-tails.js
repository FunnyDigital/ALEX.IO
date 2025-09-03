import React from 'react';

// SVG placeholder for tails
function CoinTailsSVG() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#C0C0C0" stroke="#808080" strokeWidth="4" />
      <text x="50%" y="55%" textAnchor="middle" fontSize="32" fill="#808080" fontWeight="bold" dy=".3em">T</text>
    </svg>
  );
}
export default CoinTailsSVG;
