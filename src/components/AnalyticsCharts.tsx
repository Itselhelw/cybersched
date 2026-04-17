'use client';

import React, { memo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const WeeklyProgressChart = memo(function WeeklyProgressChart({ data }: { data: Array<{ day: string; completed: number; total: number }> }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <div className="card-title">// Weekly Progress</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
          <XAxis dataKey="day" stroke="#00f5ff" />
          <YAxis stroke="#00f5ff" />
          <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #00f5ff', borderRadius: 4 }} />
          <Legend />
          <Bar dataKey="completed" fill="#00ff88" name="Tasks Done" />
          <Bar dataKey="total" fill="#ff8c00" name="Total Tasks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const CategoryBreakdownChart = memo(function CategoryBreakdownChart({ data }: { data: Array<{ name: string; completed: number; total: number; color: string }> }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <div className="card-title">// Category Breakdown</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
          <XAxis dataKey="name" stroke="#00f5ff" />
          <YAxis stroke="#00f5ff" />
          <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #00f5ff', borderRadius: 4 }} />
          <Legend />
          <Bar dataKey="completed" fill="#00ff88" name="Completed" />
          <Bar dataKey="total" fill="#6b6b8a" name="Total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export const StreakRanking = memo(function StreakRanking({ data }: { data: Array<{ name: string; streak: number; color: string }> }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <div className="card-title">// Streak Ranking</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...data]
          .sort((a, b) => b.streak - a.streak)
          .map((item, idx) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,245,255,0.05)', borderRadius: 8, borderLeft: `4px solid ${item.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#00f5ff', minWidth: 30 }}>#{idx + 1}</span>
                <span style={{ color: '#a0a0c0' }}>{item.name}</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: item.color }}>🔥 {item.streak}d</span>
            </div>
          ))}
      </div>
    </div>
  );
});

export const CompletionDonut = memo(function CompletionDonut({ stats }: { stats: { total: number; completed: number; pending: number; percentage: number } }) {
  const data = [
    { name: 'Completed', value: stats.completed, color: '#00ff88' },
    { name: 'Pending', value: stats.pending, color: '#6b6b8a' },
  ];

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <div className="card-title">// Overall Completion</div>
        <span style={{ color: '#00ff88', fontWeight: 700 }}>{stats.percentage}%</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #00f5ff', borderRadius: 4 }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ color: '#a0a0c0', fontSize: 12 }}>
          {stats.completed} / {stats.total} tasks completed
        </div>
      </div>
    </div>
  );
});
