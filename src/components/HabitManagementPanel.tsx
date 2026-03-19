'use client';

import React, { useState, memo } from 'react';
import { HABIT_TEMPLATES, createCustomHabit, createHabitFromTemplate, addJournalEntry, getHabitJournalEntries, getHabitInsights } from '@/utils/habitUtils';

interface HabitManagementPanelProps {
  habits: any[];
  onAddHabit: (habit: any) => void;
  onDeleteHabit: (habitId: string) => void;
  onUpdateHabit: (habitId: string, updates: any) => void;
}

/**
 * HabitManagementPanel handles habit creation, templates, and journaling.
 * Wrapped in memo() to optimize dashboard performance by reducing re-renders from the per-second clock.
 */
const HabitManagementPanel = memo(function HabitManagementPanel({
  habits,
  onAddHabit,
  onDeleteHabit,
  onUpdateHabit,
}: HabitManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'manage' | 'templates' | 'journal'>('manage');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'ok' | 'struggling'>('good');

  const [customHabitForm, setCustomHabitForm] = useState({
    label: '',
    icon: '🎯',
    color: '#00ff88',
  });

  const handleCreateCustom = () => {
    if (!customHabitForm.label.trim()) return;
    const newHabit = createCustomHabit(customHabitForm.label, customHabitForm.icon, customHabitForm.color);
    onAddHabit(newHabit);
    setCustomHabitForm({ label: '', icon: '🎯', color: '#00ff88' });
    setShowCreateModal(false);
  };

  const handleCreateFromTemplate = (templateId: string) => {
    const newHabit = createHabitFromTemplate(templateId);
    if (newHabit) {
      onAddHabit(newHabit);
    }
  };

  const handleAddJournalEntry = () => {
    if (selectedHabitId && journalEntry.trim()) {
      const updated = addJournalEntry(
        habits.find(h => h.id === selectedHabitId),
        journalEntry,
        selectedMood
      );
      onUpdateHabit(selectedHabitId, updated);
      setJournalEntry('');
      setSelectedMood('good');
    }
  };

  const selectedHabit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {(['manage', 'templates', 'journal'] as const).map(tab => (
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
            {tab === 'manage' ? '💾 Manage' : tab === 'templates' ? '📋 Templates' : '📔 Journal'}
          </button>
        ))}
      </div>

      {/* MANAGE TAB */}
      {activeTab === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
              color: '#0a0a1a',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          >
            + CREATE CUSTOM HABIT
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {habits.filter(h => h.isCustom).map(habit => (
              <div key={habit.id} style={{
                padding: 14,
                background: 'var(--bg-secondary)',
                border: `1px solid ${habit.color}40`,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 24 }}>{habit.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: habit.color }}>{habit.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>🔥 {habit.streak} days</div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  style={{
                    background: 'rgba(255,51,102,0.2)',
                    color: '#ff3366',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {HABIT_TEMPLATES.map(template => (
            <div
              key={template.id}
              style={{
                padding: 14,
                background: 'var(--bg-secondary)',
                border: `1px solid ${template.color}40`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 10,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = template.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = `${template.color}40`)}
            >
              <span style={{ fontSize: 32 }}>{template.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: template.color, marginBottom: 4 }}>{template.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{template.description}</div>
              </div>
              <button
                onClick={() => handleCreateFromTemplate(template.id)}
                style={{
                  padding: '8px 12px',
                  background: template.color,
                  color: '#0a0a1a',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  width: '100%',
                }}
              >
                ADD THIS
              </button>
            </div>
          ))}
        </div>
      )}

      {/* JOURNAL TAB */}
      {activeTab === 'journal' && (
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <div className="input-group">
            <label className="input-label">SELECT HABIT</label>
            <select
              className="input-select"
              value={selectedHabitId || ''}
              onChange={e => setSelectedHabitId(e.target.value || null)}
            >
              <option value="">Choose a habit...</option>
              {habits.map(h => (
                <option key={h.id} value={h.id}>
                  {h.icon} {h.label}
                </option>
              ))}
            </select>
          </div>

          {selectedHabit && (
            <>
              {/* Habit Insights */}
              {selectedHabit.journalEntry && (
                <div style={{
                  padding: 12,
                  background: 'rgba(0,255,136,0.1)',
                  borderRadius: 6,
                  borderLeft: `3px solid ${selectedHabit.color}`,
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', fontWeight: 700, marginBottom: 8 }}>📈 INSIGHTS</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Avg mood: <span style={{ color: selectedHabit.color }}>{selectedHabit.journalEntry.mood || 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Journal Entry Form */}
              <div className="input-group">
                <label className="input-label">HOW ARE YOU FEELING TODAY?</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {(['great', 'good', 'ok', 'struggling'] as const).map(mood => (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(mood)}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        background: selectedMood === mood ? 'var(--cyan)' : 'var(--bg-secondary)',
                        color: selectedMood === mood ? '#000' : 'var(--text-secondary)',
                        border: `1px solid ${selectedMood === mood ? 'var(--cyan)' : 'var(--border)'}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {mood === 'great' ? '🤩 Great' : mood === 'good' ? '😊 Good' : mood === 'ok' ? '😐 Ok' : '😰 Struggling'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">JOURNAL ENTRY</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="How's your progress going? What helped today?"
                  value={journalEntry}
                  onChange={e => setJournalEntry(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                onClick={handleAddJournalEntry}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #00f5ff, #0099cc)',
                  color: '#0a0a1a',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                }}
              >
                SAVE ENTRY
              </button>

              {/* Recent Journal Entries */}
              {selectedHabit.journalEntry && (
                <div style={{
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>LATEST ENTRY</div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {selectedHabit.journalEntry.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                    {selectedHabit.journalEntry.date}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* CREATE CUSTOM HABIT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">// CREATE CUSTOM HABIT</div>

            <div className="input-group">
              <label className="input-label">HABIT NAME</label>
              <input
                className="input-field"
                placeholder="e.g., Cold Showers, Stretching, etc."
                value={customHabitForm.label}
                onChange={e => setCustomHabitForm(p => ({ ...p, label: e.target.value }))}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">ICON</label>
                <input
                  className="input-field"
                  placeholder="Pick an emoji"
                  value={customHabitForm.icon}
                  onChange={e => setCustomHabitForm(p => ({ ...p, icon: e.target.value }))}
                  maxLength={2}
                />
              </div>

              <div className="input-group">
                <label className="input-label">COLOR</label>
                <input
                  className="input-field"
                  type="color"
                  value={customHabitForm.color}
                  onChange={e => setCustomHabitForm(p => ({ ...p, color: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCreateCustom}>CREATE HABIT</button>
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default HabitManagementPanel;
