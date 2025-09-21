import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import GameGrid from '../components/GameGrid';

function Games() {
  const navigate = useNavigate();

  const handleExplore = () => {
    // Scroll to game grid or focus
    const grid = document.getElementById('game-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlay = (route) => {
    navigate(route);
  };

  return (
    <div className="gaming-page">
      <HeroSection />
      <div id="game-grid" style={{ flex: 1, overflow: 'hidden' }}>
        <GameGrid onPlay={handlePlay} />
      </div>
    </div>
  );
}

export default Games;
