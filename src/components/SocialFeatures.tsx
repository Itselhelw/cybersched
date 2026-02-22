'use client';

import { useState } from 'react';

interface SocialFeaturesProps {
  userName: string;
  completionPct: number;
  bestStreak: number;
  smokeFreeDays: number;
  totalTasks: number;
}

export default function SocialFeatures({
  userName,
  completionPct,
  bestStreak,
  smokeFreeDays,
  totalTasks,
}: SocialFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'partners' | 'challenges'>('share');
  const [partners, setPartners] = useState<Array<{ id: string; name: string; streak: number; added: string }>>([]);
  const [challenges, setChallenges] = useState<Array<{ id: string; name: string; days: number; progress: number }>>([]);

  const [newPartner, setNewPartner] = useState('');
  const [newChallenge, setNewChallenge] = useState({ name: '', days: 7 });

  const shareProgress = (platform: 'twitter' | 'linkedin' | 'copy') => {
    const text = `I'm crushing my goals with CyberSched! 🚀 ${completionPct}% daily completion, ${bestStreak} day streak, ${smokeFreeDays} days smoke-free. Join me in optimizing your life! #CyberSched #Productivity`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(text);
      alert('Progress copied to clipboard!');
    }
  };

  const handleAddPartner = () => {
    if (newPartner.trim()) {
      setPartners([...partners, {
        id: Date.now().toString(),
        name: newPartner,
        streak: Math.floor(Math.random() * 30) + 1,
        added: new Date().toLocaleDateString(),
      }]);
      setNewPartner('');
    }
  };

  const handleCreateChallenge = () => {
    if (newChallenge.name.trim()) {
      setChallenges([...challenges, {
        id: Date.now().toString(),
        name: newChallenge.name,
        days: newChallenge.days,
        progress: 0,
      }]);
      setNewChallenge({ name: '', days: 7 });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {(['share', 'partners', 'challenges'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === tab ? 'var(--cyan)' : 'transparent',
              color: activeTab === tab ? '#000' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'share' ? '📤 Share' : tab === 'partners' ? '👥 Partners' : '🎯 Challenges'}
          </button>
        ))}
      </div>

      {/* SHARE TAB */}
      {activeTab === 'share' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: 16,
            background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,255,136,0.05))',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 1, marginBottom: 12 }}>YOUR STATS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cyan)' }}>{completionPct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Daily completion</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--orange)' }}>🔥 {bestStreak}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Day streak</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>{smokeFreeDays}d</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Smoke-free</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--purple)' }}>{totalTasks}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tasks done</div>
              </div>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: 1 }}>SHARE YOUR PROGRESS</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <button
              onClick={() => shareProgress('twitter')}
              style={{
                padding: '12px 16px',
                background: '#1DA1F2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              𝕏 Tweet
            </button>
            <button
              onClick={() => shareProgress('linkedin')}
              style={{
                padding: '12px 16px',
                background: '#0A66C2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              in LinkedIn
            </button>
            <button
              onClick={() => shareProgress('copy')}
              style={{
                padding: '12px 16px',
                background: 'var(--cyan)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}

      {/* PARTNERS TAB */}
      {activeTab === 'partners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Enter partner name..."
              value={newPartner}
              onChange={e => setNewPartner(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPartner()}
              className="input-field"
              style={{ flex: 1 }}
            />
            <button
              onClick={handleAddPartner}
              style={{
                padding: '10px 14px',
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
              ADD
            </button>
          </div>

          {partners.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No accountability partners yet. Add one to stay motivated!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {partners.map(partner => (
                <div key={partner.id} style={{
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--cyan)' }}>👤 {partner.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>🔥 {partner.streak} day streak</div>
                  </div>
                  <button
                    onClick={() => setPartners(partners.filter(p => p.id !== partner.id))}
                    style={{
                      background: 'rgba(255,51,102,0.2)',
                      color: '#ff3366',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHALLENGES TAB */}
      {activeTab === 'challenges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-group">
            <label className="input-label">NEW CHALLENGE</label>
            <input
              type="text"
              placeholder="e.g., 30-day gym streak"
              value={newChallenge.name}
              onChange={e => setNewChallenge(p => ({ ...p, name: e.target.value }))}
              className="input-field"
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={newChallenge.days}
                onChange={e => setNewChallenge(p => ({ ...p, days: Number(e.target.value) }))}
                className="input-select"
                style={{ flex: 1 }}
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={21}>21 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
              <button
                onClick={handleCreateChallenge}
                style={{
                  padding: '10px 14px',
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
                CREATE
              </button>
            </div>
          </div>

          {challenges.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No active challenges. Create one to level up!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {challenges.map(challenge => (
                <div key={challenge.id} style={{
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--cyan)' }}>🎯 {challenge.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{challenge.progress}/{challenge.days}d</div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--cyan)', width: `${(challenge.progress / challenge.days) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
