import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ balance = '...', onDeposit }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'var(--primary-bg)',
      borderBottom: '2px solid var(--border-primary)',
      boxShadow: 'var(--shadow-primary)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      minHeight: '60px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '60px'
      }}>
        {/* Logo */}
        <div 
          onClick={() => handleNavigation('/games')}
          className="header-logo"
          style={{
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '3px',
            background: 'var(--gradient-gold)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            cursor: 'pointer',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
            fontFamily: 'monospace'
          }}
        >
          ALEX.IO
        </div>

        {/* Desktop Navigation */}
        <div className="header-desktop-nav">
          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => handleNavigation('/games')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                ':hover': {
                  color: 'var(--text-gold)',
                  background: 'var(--accent-bg)'
                }
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--text-gold)';
                e.target.style.background = 'var(--accent-bg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--text-primary)';
                e.target.style.background = 'transparent';
              }}
            >
              Games
            </button>
            <button
              onClick={() => handleNavigation('/wallet')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--text-gold)';
                e.target.style.background = 'var(--accent-bg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--text-primary)';
                e.target.style.background = 'transparent';
              }}
            >
              Wallet
            </button>
          </nav>

          {/* Balance Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--accent-bg)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-secondary)',
            boxShadow: 'var(--shadow-secondary)'
          }}>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginRight: '4px'
            }}>
              $
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-gold)',
              fontFamily: 'monospace'
            }}>
              {balance !== '...' ? balance : '...'}
            </span>
          </div>

          {/* Deposit Button */}
          <button
            onClick={onDeposit}
            style={{
              background: 'var(--gradient-gold)',
              color: 'var(--primary-bg)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-primary)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            + Add
          </button>

          {/* Profile Button */}
          <button
            onClick={() => handleNavigation('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--accent-bg)',
              border: '1px solid var(--border-primary)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: 'var(--shadow-secondary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--gold-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--accent-bg)';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              style={{ width: '16px', height: '16px', color: 'var(--text-gold)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="header-mobile-toggle"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            style={{ width: '20px', height: '20px', color: 'var(--text-gold)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={{
          display: 'block',
          '@media (min-width: 769px)': {
            display: 'none'
          },
          background: 'var(--secondary-bg)',
          borderTop: '1px solid var(--border-secondary)',
          padding: '16px 24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => handleNavigation('/games')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
                padding: '12px 0',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Games
            </button>
            <button
              onClick={() => handleNavigation('/wallet')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
                padding: '12px 0',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Wallet
            </button>
            <button
              onClick={() => handleNavigation('/profile')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
                padding: '12px 0',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              Profile
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
