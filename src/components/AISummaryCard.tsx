'use client';

import { useState, useEffect } from 'react';
import { buildAIContext, generatePredictions, analyzeTrends } from '@/utils/aiUtils';

interface AISummaryProps {
  tasks: any[];
  habits: any[];
  settings: any;
  smokeStats: any;
  weeklyData?: Array<{ day: string; completed: number; total: number }>;
}

export default function AISummaryCard({ tasks, habits, settings, smokeStats, weeklyData }: AISummaryProps) {
  const [summary, setSummary] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    generateSummary();
  }, [tasks, habits]);

  const generateSummary = async () => {
    setLoading(true);
    try {
      // Calculate weekly stats
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      let weekCompleted = 0;
      let weekTotal = 0;
      const weekDays: Array<{ day: string; completed: number; total: number }> = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTasks = tasks.filter(t => t.date === dateStr);
        const completed = dayTasks.filter(t => t.done).length;
        const total = dayTasks.length;

        weekDays.push({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
          completed,
          total: total || 1,
        });

        weekCompleted += completed;
        weekTotal += total;
      }

      const context = buildAIContext(tasks, habits, settings, smokeStats, {
        completed: weekCompleted,
        total: weekTotal || 1,
      });

      // Generate predictions
      const preds = generatePredictions(tasks, habits, context);
      setPredictions(preds);

      // Analyze trends
      if (weeklyData || weekDays.length > 0) {
        const data = weeklyData || weekDays;
        const analysed = analyzeTrends(data);
        setTrends(analysed);
      }

      // Generate AI summary
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });

      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Summary generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(0,255,136,0.05))', borderLeft: '4px solid #00f5ff' }}>
      <div className="card-header" style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => setShowDetails(!showDetails)}>
        <div className="card-title">🤖 AI Weekly Summary</div>
        <span style={{ color: '#00f5ff', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{summary?.score || '--'}%</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b6b8a', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Analyzing your week...
        </div>
      ) : (
        <>
          {/* Main Message */}
          {summary && (
            <div style={{ padding: '12px 16px', background: 'rgba(0,255,136,0.1)', borderLeft: '3px solid #00ff88', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ color: '#00ff88', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)' }}>💡 {summary.message}</div>
            </div>
          )}

          {/* Trends */}
          {trends && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(0,245,255,0.1)', borderRadius: 6 }}>
              <div style={{ color: '#00f5ff', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>📈 WEEKLY TREND</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a0a0c0' }}>
                <div>Trend: <span style={{ color: trends.trend === 'improving' ? '#00ff88' : trends.trend === 'declining' ? '#ff3366' : '#ff8c00' }}>{trends.trend.toUpperCase()}</span></div>
                <div>Momentum: {trends.momentum > 0 ? '+' : ''}{trends.momentum}%</div>
                <div>Best day: {trends.bestDay}</div>
              </div>
            </div>
          )}

          {/* Next Goal */}
          {predictions?.nextGoal && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(255,140,0,0.1)', borderRadius: 6 }}>
              <div style={{ color: '#ff8c00', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>🎯 {predictions.nextGoal}</div>
            </div>
          )}

          {/* Show More Details */}
          {!showDetails && (
            <button
              onClick={() => setShowDetails(true)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(0,245,255,0.1)',
                color: '#00f5ff',
                border: '1px solid #00f5ff',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              VIEW FULL ANALYSIS
            </button>
          )}

          {/* Detailed View */}
          {showDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Insights */}
              {summary?.insights && (
                <div style={{ padding: '12px 16px', background: 'rgba(0,255,136,0.1)', borderRadius: 6 }}>
                  <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>✓ KEY INSIGHTS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {summary.insights.map((insight: string, idx: number) => (
                      <div key={idx} style={{ fontSize: 12, color: '#a0a0c0', fontFamily: 'var(--font-mono)' }}>
                        • {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {summary?.recommendations && (
                <div style={{ padding: '12px 16px', background: 'rgba(0,245,255,0.1)', borderRadius: 6 }}>
                  <div style={{ color: '#00f5ff', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>💬 RECOMMENDATIONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {summary.recommendations.map((rec: string, idx: number) => (
                      <div key={idx} style={{ fontSize: 12, color: '#a0a0c0', fontFamily: 'var(--font-mono)' }}>
                        • {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predictions */}
              {predictions?.suggestedTasks && predictions.suggestedTasks.length > 0 && (
                <div style={{ padding: '12px 16px', background: 'rgba(255,140,0,0.1)', borderRadius: 6 }}>
                  <div style={{ color: '#ff8c00', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>🔮 SUGGESTIONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {predictions.suggestedTasks.map((task: any, idx: number) => (
                      <div key={idx}>
                        <div style={{ fontSize: 12, color: '#a0a0c0', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {task.name}
                          <span style={{ marginLeft: 8, color: task.priority === 'high' ? '#ff3366' : task.priority === 'medium' ? '#ff8c00' : '#00ff88' }}>
                            [{task.priority.toUpperCase()}]
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 4, fontStyle: 'italic' }}>→ {task.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimization Tips */}
              {predictions?.optimizationTips && predictions.optimizationTips.length > 0 && (
                <div style={{ padding: '12px 16px', background: 'rgba(157,78,221,0.1)', borderRadius: 6 }}>
                  <div style={{ color: '#9d4edd', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>⚡ OPTIMIZATION TIPS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {predictions.optimizationTips.map((tip: string, idx: number) => (
                      <div key={idx} style={{ fontSize: 12, color: '#a0a0c0', fontFamily: 'var(--font-mono)' }}>
                        • {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDetails(false)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  color: '#ff3366',
                  border: '1px solid #ff3366',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                COLLAPSE
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
