import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 py-6 flex flex-col md:flex-row items-center justify-center md:justify-between px-6 text-blue-200 text-sm mt-12">
      <div className="mb-2 md:mb-0">&copy; {new Date().getFullYear()} ALEX.IO</div>
      <div className="flex gap-6">
        <a href="#" className="hover:text-gold-400 transition">Responsible Gaming</a>
        <a href="#" className="hover:text-gold-400 transition">Terms of Service</a>
        <a href="#" className="hover:text-gold-400 transition">Support</a>
      </div>
    </footer>
  );
}
