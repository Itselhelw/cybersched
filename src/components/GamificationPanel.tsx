'use client';

import React, { useState, memo } from 'react';
import { ACHIEVEMENTS, BADGES, calculateDailyPoints, getProgressToNextMilestone, getRewardsForMilestone, type Achievement, type Badge } from '@/utils/gamificationUtils';

interface GamificationPanelProps {
  tasksCompleted: number;
  habitsCompleted: number;
  dailyScore: number;
  weeklyScore: number;
  currentStreak: number;
  unlockedAchievements: Achievement[];
  unlockedBadges: Badge[];
}

export default memo(function GamificationPanel({
  tasksCompleted,
  habitsCompleted,
  dailyScore,
  weeklyScore,
  currentStreak,
  unlockedAchievements,
  unlockedBadges,
}: GamificationPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'badges' | 'milestones'>('overview');

  const milestone = getProgressToNextMilestone(currentStreak);
  const rewards = getRewardsForMilestone(currentStreak);

  const totalLevel = Math.floor(weeklyScore / 500) + 1;
  const levelProgress = (weeklyScore % 500) / 500;

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, rgba(251,191,36,0.05), rgba(157,78,221,0.05))' }}>
      {/* Header with Points */}
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="card-title">🎮 Achievements & Rewards</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{dailyScore} pts</div>
            <div style={{ fontSize: 11, color: '#6b6b8a', fontFamily: 'var(--font-mono)' }}>Today&apos;s Score</div>
          </div>
        </div>
      </div>

      {/* Level & Progress */}
      <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,0.1)', borderRadius: 6, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>LEVEL {totalLevel}</div>
          <div style={{ fontSize: 11, color: '#a0a0c0' }}>{weeklyScore} / {(totalLevel) * 500} XP</div>
        </div>
        <div style={{ width: '100%', height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${levelProgress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #ff8c00)' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {(['overview', 'achievements', 'badges', 'milestones'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 12px',
              background: activeTab === tab ? '#fbbf24' : 'rgba(251,191,36,0.2)',
              color: activeTab === tab ? '#0a0a1a' : '#fbbf24',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'achievements' && `✓ Achievements (${unlockedAchievements.length})`}
            {tab === 'badges' && `🏆 Badges (${unlockedBadges.length})`}
            {tab === 'milestones' && '🎯 Milestones'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 16px', background: 'rgba(0,255,136,0.1)', borderRadius: 6 }}>
            <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>📈 TODAY&apos;S STATS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a0a0c0' }}>
              <div>✅ Tasks: {tasksCompleted}</div>
              <div>🔥 Habits: {habitsCompleted}</div>
              <div>🎯 Points: {dailyScore}</div>
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(0,245,255,0.1)', borderRadius: 6 }}>
            <div style={{ color: '#00f5ff', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>🔥 CURRENT STREAK</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{currentStreak} days</div>
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(251,191,36,0.2)', borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>Next milestone: {milestone.nextMilestone} days ({milestone.progress}%)</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ACHIEVEMENTS.map(ach => {
            const unlocked = unlockedAchievements.find(a => a.id === ach.id);
            return (
              <div key={ach.id} style={{ padding: '10px 12px', background: unlocked ? 'rgba(0,255,136,0.15)' : 'rgba(107,107,138,0.1)', borderRadius: 6, opacity: unlocked ? 1 : 0.6, borderLeft: `3px solid ${unlocked ? '#00ff88' : '#6b6b8a'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? '#00ff88' : '#6b6b8a', fontFamily: 'var(--font-mono)' }}>
                      {ach.icon} {ach.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#a0a0c0', marginTop: 4 }}>{ach.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: unlocked ? '#fbbf24' : '#6b6b8a' }}>{ach.points}pts</div>
                    {unlocked && <div style={{ fontSize: 10, color: '#00ff88', fontFamily: 'var(--font-mono)' }}>✓ Unlocked</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {BADGES.map(badge => {
            const unlocked = unlockedBadges.find(b => b.id === badge.id);
            return (
              <div key={badge.id} style={{ padding: '12px', background: unlocked ? `${badge.color}20` : 'rgba(107,107,138,0.1)', borderRadius: 8, border: `2px solid ${unlocked ? badge.color : '#6b6b8a'}`, textAlign: 'center', opacity: unlocked ? 1 : 0.5 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{badge.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: unlocked ? badge.color : '#6b6b8a', fontFamily: 'var(--font-mono)' }}>{badge.name}</div>
                <div style={{ fontSize: 9, color: '#a0a0c0', marginTop: 4, lineHeight: 1.3 }}>{badge.condition}</div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[7, 21, 66, 100, 365].map(days => (
            <div key={days} style={{ padding: '12px 16px', background: currentStreak >= days ? 'rgba(0,255,136,0.15)' : 'rgba(107,107,138,0.1)', borderRadius: 6, borderLeft: `4px solid ${currentStreak >= days ? '#00ff88' : '#6b6b8a'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: currentStreak >= days ? '#00ff88' : '#a0a0c0', fontFamily: 'var(--font-mono)' }}>
                    🎯 {days}-Day Streak
                  </div>
                  {currentStreak >= days && getRewardsForMilestone(days).length > 0 && (
                    <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>✓ {getRewardsForMilestone(days)[0].reward}</div>
                  )}
                </div>
                {currentStreak >= days ? (
                  <div style={{ fontSize: 20 }}>✅</div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#a0a0c0', fontFamily: 'var(--font-mono)' }}>{days - currentStreak} days left</div>
                    <div style={{ width: 60, height: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(currentStreak / days) * 100}%`, height: '100%', background: '#fbbf24' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
