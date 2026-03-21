'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Task {
  done: boolean;
  [key: string]: any;
}

interface HabitStat {
  streak: number;
  [key: string]: any;
}

/**
 * AISummaryCard: Displays AI-generated weekly insights and trends.
 * Wrapped in memo() because it consumes stable props and should not re-render on every clock tick.
 */
const AISummaryCard = memo(function AISummaryCard({ tasks, habits, smokeDays }: {
  tasks: Task[]; habits: HabitStat[]; smokeDays: number;
}) {
  const [summary, setSummary] = useLocalStorage<string>('cybersched-weekly-summary', '');
  const [trend, setTrend] = useLocalStorage<string>('cybersched-weekly-trend', '');
  const [lastGenDate, setLastGenDate] = useLocalStorage<string>('cybersched-summary-date', '');
  const [loading, setLoading] = useState(false);
  const hasRun = useRef(false);

  const completionPct = tasks.length > 0
    ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
    : 0;

  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  async function generateSummary() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Legend',
          tasks,
          habits,
          smokeDays,
        }),
      });

      const data = await res.json();
      // data expected: { insights, recommendations, score, message }
      if (data.message) setSummary(data.message);
      else if (Array.isArray(data.insights) && data.insights.length > 0) setSummary(data.insights.join(' '));
      else setSummary('Review your weekly progress.');

      const score = typeof data.score === 'number' ? data.score : 0;
      if (score >= 75) setTrend('IMPROVING');
      else if (score >= 40) setTrend('STABLE');
      else setTrend('DECLINING');

      setLastGenDate(new Date().toDateString());
    } catch {
      setSummary('Keep pushing. Every day of consistency compounds.');
      setTrend('STABLE');
      setLastGenDate(new Date().toDateString());
    } finally {
      setLoading(false);
    }
  }

  // Only generate once per day, never on re-renders
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (lastGenDate !== new Date().toDateString()) {
      generateSummary();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card" style={{ border: '1px solid rgba(0,245,255,0.2)' }}>
      <div className="card-header">
        <div className="card-title" style={{ color: 'var(--cyan)' }}>
          🤖 AI WEEKLY SUMMARY
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
          {completionPct}%
        </span>
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', padding: '12px 0' }}>
          Analyzing your week...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {summary && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {summary}
            </div>
          )}

          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 2, marginBottom: 6 }}>
              📊 WEEKLY TREND
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
              <span>Trend: <strong style={{ color: 'var(--orange)' }}>{trend || 'STABLE'}</strong></span>
              <span>Momentum: <strong style={{ color: 'var(--cyan)' }}>{completionPct}%</strong></span>
              <span>Streak: <strong style={{ color: 'var(--green)' }}>🔥{bestStreak}d</strong></span>
            </div>
          </div>

          {smokeDays > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)' }}>
              🎯 {90 - smokeDays > 0 ? `${90 - smokeDays} days until 90-day goal!` : '90-day goal achieved! 🏆'}
            </div>
          )}

          <button className="btn-secondary" style={{ width: '100%', marginTop: 4 }} onClick={generateSummary}>
            VIEW FULL ANALYSIS
          </button>
        </div>
      )}
    </div>
  );
});

export default AISummaryCard;
