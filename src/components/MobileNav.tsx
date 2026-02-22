'use client';

import { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface MobileNavProps {
  activeNav: string;
  onNavigate: (nav: string) => void;
  navItems: Array<{ id: string; icon: string; label: string }>;
}

export default function MobileNav({ activeNav, onNavigate, navItems }: MobileNavProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Menu Button - visible only on small screens */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 600,
          background: 'var(--cyan)',
          border: 'none',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 18,
          cursor: 'pointer',
        }}
      >
        {showMenu ? '✕' : '☰'}
      </button>

      {/* Mobile Menu Drawer */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 55,
            }}
          />

          {/* Menu */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              maxWidth: 280,
              height: '100vh',
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border)',
              zIndex: 550,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Menu Header */}
            <div
              style={{
                padding: '20px 16px',
                borderBottom: '1px solid var(--border)',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                color: 'var(--cyan)',
              }}
            >
              CS:SCHED
            </div>

            {/* Menu Items */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: activeNav === item.id ? 'var(--cyan)15' : 'transparent',
                    border: 'none',
                    borderLeft: activeNav === item.id ? '4px solid var(--cyan)' : '4px solid transparent',
                    color: activeNav === item.id ? 'var(--cyan)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ marginRight: 10 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
