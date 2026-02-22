'use client';

import { useState } from 'react';

interface AdvancedTaskFormProps {
  onSubmit: (taskData: any) => void;
  onCancel: () => void;
}

export function AdvancedTaskForm({ onSubmit, onCancel }: AdvancedTaskFormProps) {
  const [form, setForm] = useState({
    name: '',
    category: 'body',
    time: '09:00',
    priority: 'medium',
    isRecurring: false,
    recurrence: 'daily',
    estimatedTime: '',
    subtasks: [] as string[],
  });

  const [newSubtask, setNewSubtask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : undefined,
      subtasks: form.subtasks.map((name, idx) => ({
        id: `st-${Date.now()}-${idx}`,
        name,
        done: false,
      })),
    });
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setForm(p => ({ ...p, subtasks: [...p.subtasks, newSubtask] }));
      setNewSubtask('');
    }
  };

  const removeSubtask = (idx: number) => {
    setForm(p => ({ ...p, subtasks: p.subtasks.filter((_, i) => i !== idx) }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Task Name */}
      <div className="input-group">
        <label className="input-label">TASK NAME</label>
        <input
          className="input-field"
          placeholder="What do you need to do?"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          required
          autoFocus
        />
      </div>

      {/* Category & Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="input-group">
          <label className="input-label">CATEGORY</label>
          <select
            className="input-select"
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
          >
            <option value="body">💪 Body</option>
            <option value="mind">📚 Mind</option>
            <option value="work">⚡ Work</option>
            <option value="quit">🚭 Quit</option>
            <option value="fun">🎮 Fun</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">TIME</label>
          <input
            className="input-field"
            type="time"
            value={form.time}
            onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
          />
        </div>
      </div>

      {/* Priority */}
      <div className="input-group">
        <label className="input-label">PRIORITY</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['low', 'medium', 'high'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setForm(f => ({ ...f, priority: p }))}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: form.priority === p ? (p === 'high' ? '#ff3366' : p === 'medium' ? '#ff8c00' : '#00ff88') : 'rgba(107,107,138,0.3)',
                color: form.priority === p ? '#fff' : '#a0a0c0',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring */}
      <div className="input-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#a0a0c0' }}>
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))}
            style={{ cursor: 'pointer', width: 16, height: 16 }}
          />
          RECURRING
        </label>
        {form.isRecurring && (
          <select
            className="input-select"
            value={form.recurrence}
            onChange={e => setForm(p => ({ ...p, recurrence: e.target.value }))}
            style={{ marginTop: 8 }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        )}
      </div>

      {/* Estimated Time */}
      <div className="input-group">
        <label className="input-label">ESTIMATED TIME (minutes)</label>
        <input
          className="input-field"
          type="number"
          min="0"
          step="15"
          placeholder="30"
          value={form.estimatedTime}
          onChange={e => setForm(p => ({ ...p, estimatedTime: e.target.value }))}
        />
      </div>

      {/* Subtasks */}
      <div className="input-group">
        <label className="input-label">SUBTASKS</label>
        {form.subtasks.length > 0 && (
          <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.subtasks.map((subtask, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,245,255,0.05)', borderRadius: 6, borderLeft: '3px solid #00f5ff' }}>
                <span style={{ color: '#a0a0c0', fontSize: 13 }}>☑️ {subtask}</span>
                <button
                  type="button"
                  onClick={() => removeSubtask(idx)}
                  style={{
                    background: 'rgba(255,51,102,0.2)',
                    color: '#ff3366',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input-field"
            placeholder="Add a subtask..."
            value={newSubtask}
            onChange={e => setNewSubtask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={addSubtask}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #00f5ff, #0099cc)',
              color: '#0a0a1a',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ADD
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
            color: '#0a0a1a',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
          }}
        >
          CREATE TASK
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'transparent',
            color: '#ff3366',
            border: '1px solid #ff3366',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
          }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
