import React from 'react';

export default function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-b from-gray-900 to-gray-800 py-16 flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold text-gold-400 mb-4 drop-shadow-lg">Where Fortunes Are Made</h1>
      <p className="mt-6 max-w-2xl text-lg md:text-2xl text-gold-200 font-semibold drop-shadow-md">
        Enter the ultimate arcade arena where skill meets rewards. Compete in real-time tournaments and win massive $JAKPOT prizes daily!
      </p>
    </section>
  );
}
