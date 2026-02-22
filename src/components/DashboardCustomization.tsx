'use client';

import { useState } from 'react';

interface DashboardCustomization {
  theme: 'dark' | 'light' | 'cyan' | 'green';
  fontSize: 'small' | 'medium' | 'large';
  showHabits: boolean;
  showStats: boolean;
  showAnalytics: boolean;
  showGamification: boolean;
  showNotifications: boolean;
}

interface DashboardCustomizationPanelProps {
  settings: DashboardCustomization;
  onSettingsChange: (settings: DashboardCustomization) => void;
}

export default function DashboardCustomizationPanel({
  settings,
  onSettingsChange,
}: DashboardCustomizationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    localStorage.setItem('dashboard-customization', JSON.stringify(localSettings));
    setIsOpen(false);
  };

  const applyTheme = (theme: 'dark' | 'light' | 'cyan' | 'green') => {
    setLocalSettings(p => ({ ...p, theme }));

    // Apply theme to root
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.colorScheme = 'dark';
    } else if (theme === 'light') {
      root.style.colorScheme = 'light';
    }
  };

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    setLocalSettings(p => ({ ...p, fontSize: size }));

    // Apply font size
    const root = document.documentElement;
    const scale = size === 'small' ? '0.9' : size === 'large' ? '1.1' : '1';
    root.style.fontSize = `${16 * parseFloat(scale)}px`;
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 180,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: isOpen ? 'var(--bg-card)' : 'var(--purple)',
          border: `2px solid ${isOpen ? 'var(--border-bright)' : 'var(--purple)'}`,
          color: isOpen ? 'var(--purple)' : '#fff',
          fontSize: 22,
          cursor: 'pointer',
          zIndex: 400,
          boxShadow: '0 0 30px rgba(157,78,221,0.3)',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⚙️
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 28,
            width: 380,
            maxHeight: 600,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-bright)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 399,
            boxShadow: '0 0 60px rgba(157,78,221,0.1)',
            animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--purple)', letterSpacing: 2 }}>CUSTOMIZE</div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* Theme Selection */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 8 }}>THEME</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['dark', 'light', 'cyan', 'green'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => applyTheme(t)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: `2px solid ${localSettings.theme === t ? (t === 'dark' ? '#6b6b8a' : t === 'light' ? '#e8e8f0' : t === 'cyan' ? 'var(--cyan)' : 'var(--green)') : 'var(--border)'}`,
                      background: localSettings.theme === t ? (t === 'dark' ? '#0d0d14' : t === 'light' ? '#f5f5f5' : t === 'cyan' ? 'var(--cyan)15' : 'var(--green)15') : 'transparent',
                      color: localSettings.theme === t ? (t === 'cyan' ? 'var(--cyan)' : t === 'green' ? 'var(--green)' : 'var(--text-primary)') : 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : t === 'cyan' ? '💎' : '🌿'} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 8 }}>FONT SIZE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['small', 'medium', 'large'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => applyFontSize(s)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: `2px solid ${localSettings.fontSize === s ? 'var(--cyan)' : 'var(--border)'}`,
                      background: localSettings.fontSize === s ? 'var(--cyan)15' : 'transparent',
                      color: localSettings.fontSize === s ? 'var(--cyan)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: s === 'small' ? 9 : s === 'large' ? 11 : 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Widget Visibility */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 8 }}>WIDGETS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'showHabits', label: 'Habits' },
                  { key: 'showStats', label: 'Statistics' },
                  { key: 'showAnalytics', label: 'Analytics' },
                  { key: 'showGamification', label: 'Gamification' },
                  { key: 'showNotifications', label: 'Notifications' },
                ].map(widget => (
                  <label
                    key={widget.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(localSettings as any)[widget.key]}
                      onChange={e =>
                        setLocalSettings(p => ({
                          ...p,
                          [widget.key]: e.target.checked,
                        }))
                      }
                      style={{ cursor: 'pointer', width: 14, height: 14 }}
                    />
                    {widget.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'var(--cyan)',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
              }}
            >
              SAVE
            </button>
            <button
              onClick={() => {
                setLocalSettings(settings);
                setIsOpen(false);
              }}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </>
  );
}
