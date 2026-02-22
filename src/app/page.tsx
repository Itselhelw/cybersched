'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type Category = 'body' | 'mind' | 'work' | 'quit' | 'fun';
type NavSection = 'dashboard' | 'tasks' | 'habits' | 'stats' | 'planner' | 'english' | 'settings';

interface Settings {
  name: string;
  cigarettesPerDay: number;
  costPerPack: number;
  cigarettesPerPack: number;
  currency: string;
}

const DEFAULT_SETTINGS: Settings = {
  name: 'Legend',
  cigarettesPerDay: 20,
  costPerPack: 10,
  cigarettesPerPack: 20,
  currency: '$',
};

interface Task {
  id: string;
  name: string;
  category: Category;
  time: string;
  done: boolean;
  date: string;
}

interface HabitStat {
  id: Category;
  label: string;
  icon: string;
  color: string;
  streak: number;
  todayDone: boolean;
  weekProgress: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORY_LABELS: Record<Category, string> = { body: 'Body', mind: 'Mind', work: 'Work', quit: 'Quit', fun: 'Fun' };

const ENGLISH_WORDS = [
  { word: 'Resilience', type: 'noun', def: 'The ability to recover quickly from difficulties; toughness.', example: '"Her resilience helped her overcome every setback."' },
  { word: 'Discipline', type: 'noun', def: 'Training oneself to do something in a controlled and habitual way.', example: '"Discipline is the bridge between goals and accomplishment."' },
  { word: 'Persevere', type: 'verb', def: 'Continue in a course of action despite difficulty.', example: '"He persevered through the hardest moments."' },
  { word: 'Momentum', type: 'noun', def: 'The impetus and driving force gained by developing events.', example: '"Build momentum with small wins every day."' },
  { word: 'Meticulous', type: 'adjective', def: 'Showing great attention to detail; very careful and precise.', example: '"He was meticulous in tracking his progress."' },
  { word: 'Tenacity', type: 'noun', def: 'The quality of being determined and persistent.', example: '"Her tenacity pushed her past every obstacle."' },
  { word: 'Acumen', type: 'noun', def: 'The ability to make good judgments and quick decisions.', example: '"His business acumen led to rapid growth."' },
];

const WEEK_SCHEDULE: Record<number, { label: string; color: string; bg: string }[]> = {
  0: [{ label: 'Rest', color: '#6b6b8a', bg: 'rgba(107,107,138,0.15)' }],
  1: [{ label: 'Gym', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Study', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }, { label: 'Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }],
  2: [{ label: 'Run', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }, { label: 'Read', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }],
  3: [{ label: 'Gym', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Deep Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }],
  4: [{ label: 'Study', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }, { label: 'Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }, { label: 'Game', color: '#9d4edd', bg: 'rgba(157,78,221,0.12)' }],
  5: [{ label: 'Gym', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Study', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }, { label: 'Social', color: '#9d4edd', bg: 'rgba(157,78,221,0.12)' }],
  6: [{ label: 'Walk', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Game', color: '#9d4edd', bg: 'rgba(157,78,221,0.12)' }],
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - day + i);
    return d;
  });
}

const DEFAULT_TASKS: Task[] = [
  { id: '1', name: 'Morning workout — chest & triceps', category: 'body', time: '07:00', done: false, date: todayStr() },
  { id: '2', name: 'Study session — 2 focused pomodoros', category: 'mind', time: '09:00', done: false, date: todayStr() },
  { id: '3', name: 'Deep work block — project tasks', category: 'work', time: '11:00', done: false, date: todayStr() },
  { id: '4', name: 'Urge surfing meditation (5 min)', category: 'quit', time: '14:00', done: false, date: todayStr() },
  { id: '5', name: 'Evening walk or light jog', category: 'body', time: '18:00', done: false, date: todayStr() },
  { id: '6', name: 'Read 20 pages', category: 'mind', time: '20:00', done: false, date: todayStr() },
  { id: '7', name: 'Gaming or social time (1.5h max)', category: 'fun', time: '21:30', done: false, date: todayStr() },
];

const DEFAULT_HABITS: HabitStat[] = [
  { id: 'body', label: 'Gym', icon: '💪', color: '#00ff88', streak: 12, todayDone: false, weekProgress: 71 },
  { id: 'mind', label: 'Study', icon: '📚', color: '#00f5ff', streak: 8, todayDone: false, weekProgress: 85 },
  { id: 'work', label: 'Work', icon: '⚡', color: '#ff8c00', streak: 21, todayDone: false, weekProgress: 100 },
  { id: 'quit', label: 'No Smoke', icon: '🚫', color: '#ff3366', streak: 7, todayDone: false, weekProgress: 100 },
  { id: 'fun', label: 'Balanced', icon: '🎮', color: '#9d4edd', streak: 5, todayDone: false, weekProgress: 57 },
];

function HabitRing({ progress, color, size = 56 }: { progress: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

// ── TASKS SECTION ─────────────────────────────────────────────────
function TasksSection({ tasks, setTasks }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [newTask, setNewTask] = useState({ name: '', category: 'body' as Category, time: '09:00' });

  function toggleTask(id: string) { setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTask(id: string) { setTasks(prev => prev.filter(t => t.id !== id)); }
  function addTask() {
    if (!newTask.name.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), ...newTask, done: false, date: todayStr() }].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTask({ name: '', category: 'body', time: '09:00' });
    setShowAdd(false);
  }

  const filtered = tasks.filter(t => filter === 'all' ? true : t.category === filter);
  const done = filtered.filter(t => t.done).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Task Manager</div>
        <div className="header-greeting">Mission <span>Control</span></div>
        <div className="header-date">{done}/{filtered.length} tasks completed today</div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'body', 'mind', 'work', 'quit', 'fun'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid',
            borderColor: filter === f ? 'var(--cyan)' : 'var(--border)',
            background: filter === f ? 'var(--cyan-glow)' : 'transparent',
            color: filter === f ? 'var(--cyan)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
            letterSpacing: 1, textTransform: 'uppercase' as const, transition: 'all 0.2s'
          }}>{f === 'all' ? 'ALL' : `${f === 'body' ? '💪' : f === 'mind' ? '📚' : f === 'work' ? '⚡' : f === 'quit' ? '🚭' : '🎮'} ${CATEGORY_LABELS[f as Category]}`}</button>
        ))}
        <button onClick={() => setShowAdd(true)} style={{
          marginLeft: 'auto', padding: '8px 20px', borderRadius: 8,
          background: 'var(--cyan)', color: '#000', border: 'none',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 2, cursor: 'pointer'
        }}>+ NEW TASK</button>
      </div>
      <div className="card">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No tasks. Add one above.</div>
        )}
        {filtered.sort((a, b) => a.time.localeCompare(b.time)).map(task => (
          <div key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
            <div className={`task-check ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id)}>{task.done ? '✓' : ''}</div>
            <div className="task-info" onClick={() => toggleTask(task.id)}>
              <div className="task-name">{task.name}</div>
              <div className="task-meta">
                <span>{task.time}</span>
                <span className={`task-tag tag-${task.category}`}>{CATEGORY_LABELS[task.category]}</span>
                <span>{task.date}</span>
              </div>
            </div>
            <button onClick={() => deleteTask(task.id)}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '0 8px' }}>✕</button>
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">// ADD NEW TASK</div>
            <div className="input-group">
              <label className="input-label">TASK NAME</label>
              <input className="input-field" placeholder="What do you need to do?" value={newTask.name}
                onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addTask()} autoFocus />
            </div>
            <div className="input-group">
              <label className="input-label">CATEGORY</label>
              <select className="input-select" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value as Category }))}>
                <option value="body">💪 Body</option>
                <option value="mind">📚 Mind</option>
                <option value="work">⚡ Work</option>
                <option value="quit">🚭 Quit Smoking</option>
                <option value="fun">🎮 Fun</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">TIME</label>
              <input className="input-field" type="time" value={newTask.time} onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={addTask}>EXECUTE TASK</button>
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── HABITS SECTION ────────────────────────────────────────────────
function HabitsSection({ habits, setHabits }: { habits: HabitStat[]; setHabits: React.Dispatch<React.SetStateAction<HabitStat[]>> }) {
  function toggle(id: Category) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, todayDone: !h.todayDone, streak: !h.todayDone ? h.streak + 1 : Math.max(0, h.streak - 1) } : h));
  }
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Habit Tracker</div>
        <div className="header-greeting">Habit <span>Core</span></div>
        <div className="header-date">{habits.filter(h => h.todayDone).length}/{habits.length} habits completed today</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {habits.map(habit => (
          <div key={habit.id} className="card" onClick={() => toggle(habit.id)}
            style={{ borderColor: habit.todayDone ? `${habit.color}40` : undefined, cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div className="habit-ring" style={{ width: 72, height: 72 }}>
                <HabitRing progress={habit.todayDone ? 100 : habit.weekProgress} color={habit.color} size={72} />
                <div className="habit-ring-value" style={{ color: habit.color, fontSize: 14 }}>{habit.todayDone ? '✓' : `${habit.weekProgress}%`}</div>
              </div>
              <div>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{habit.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: habit.todayDone ? habit.color : 'var(--text-primary)', letterSpacing: 1 }}>{habit.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--orange)', marginTop: 2 }}>🔥 {habit.streak} day streak</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${habit.weekProgress}%`, background: habit.color }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              <span>Week progress</span><span style={{ color: habit.color }}>{habit.weekProgress}%</span>
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: habit.todayDone ? `${habit.color}15` : 'var(--bg-secondary)', border: `1px solid ${habit.todayDone ? habit.color + '40' : 'var(--border)'}`, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: habit.todayDone ? habit.color : 'var(--text-muted)', letterSpacing: 2, transition: 'all 0.3s' }}>
              {habit.todayDone ? '✓ DONE TODAY' : 'CLICK TO MARK DONE'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QUIT COUNTER CARD ─────────────────────────────────────────────
function QuitCounterCard({ quitDate, setQuitDate, smokeStats }: {
  quitDate: string;
  setQuitDate: (d: string) => void;
  smokeStats: { days: number; hours: number; minutes: number; cigarettes: number; moneySaved: string; percent: number };
}) {
  const milestones = [
    { days: 1,  label: '24 Hours',  desc: 'Heart rate normalizes',     icon: '🫀' },
    { days: 3,  label: '3 Days',    desc: 'Nicotine fully cleared',     icon: '🧹' },
    { days: 7,  label: '1 Week',    desc: 'Taste & smell improving',    icon: '👃' },
    { days: 14, label: '2 Weeks',   desc: 'Circulation improves',       icon: '💓' },
    { days: 30, label: '1 Month',   desc: 'Lung capacity increases',    icon: '🫁' },
    { days: 90, label: '3 Months',  desc: 'Circulation fully restored', icon: '⚡' },
  ];

  const nextMilestone = milestones.find(m => m.days > smokeStats.days);

  return (
    <div className="card" style={{ border: '1px solid rgba(0,255,136,0.2)' }}>
      <div className="card-header">
        <div className="card-title" style={{ color: 'var(--green)' }}>// Quit Counter</div>
        {quitDate && (
          <button className="card-action" style={{ color: 'var(--red)' }}
            onClick={() => { if (confirm('Reset quit date?')) setQuitDate(''); }}>
            RESET
          </button>
        )}
      </div>

      {!quitDate ? (
        // ── NO QUIT DATE SET ──
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚭</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
            Set Your Quit Date
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Enter the date you stopped smoking.<br />Your counter starts from that moment.
          </div>
          <input type="date" className="input-field"
            max={new Date().toISOString().split('T')[0]}
            onChange={e => e.target.value && setQuitDate(e.target.value)}
            style={{ textAlign: 'center', cursor: 'pointer', maxWidth: 200, margin: '0 auto' }} />
        </div>
      ) : (
        // ── QUIT DATE IS SET ──
        <div>
          {/* Big counter */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: 'var(--green)', textShadow: '0 0 30px rgba(0,255,136,0.4)', lineHeight: 1 }}>
              {smokeStats.days}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 2, marginTop: 4 }}>
              DAYS SMOKE-FREE
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {smokeStats.hours}h · {smokeStats.minutes}min total
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Money Saved', value: `$${smokeStats.moneySaved}`, color: 'var(--green)', icon: '💰' },
              { label: 'Cigs Avoided', value: `${smokeStats.cigarettes}`, color: 'var(--cyan)', icon: '🚬' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Progress to 90 day goal */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Progress to 90-day goal</span>
              <span style={{ color: 'var(--green)' }}>{Math.round(smokeStats.percent)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${smokeStats.percent}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))' }} />
            </div>
          </div>

          {/* Next milestone */}
          {nextMilestone && (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: 2, marginBottom: 4 }}>NEXT MILESTONE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{nextMilestone.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{nextMilestone.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                    {nextMilestone.desc} · {nextMilestone.days - smokeStats.days} days away
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map(ms => (
              <div key={ms.days} className={`milestone ${smokeStats.days >= ms.days ? 'achieved' : ''}`}>
                <span className="milestone-icon">{ms.icon}</span>
                <div className="milestone-info">
                  <div className="milestone-name">{ms.label}</div>
                  <div className="milestone-desc">{ms.desc}</div>
                </div>
                <span>{smokeStats.days >= ms.days ? '✅' : `${ms.days - smokeStats.days}d`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STATS SECTION ─────────────────────────────────────────────────
function StatsSection({ tasks, habits, quitDate, setQuitDate, smokeStats }: { tasks: Task[]; habits: HabitStat[]; quitDate: string; setQuitDate: (d: string) => void; smokeStats: { days: number; hours: number; minutes: number; cigarettes: number; moneySaved: string; percent: number } }) {
  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const moneySaved = smokeStats.moneySaved;
  const categoryBreakdown = (['body', 'mind', 'work', 'quit', 'fun'] as Category[]).map(cat => ({
    cat,
    total: tasks.filter(t => t.category === cat).length,
    done: tasks.filter(t => t.category === cat && t.done).length,
    color: cat === 'body' ? '#00ff88' : cat === 'mind' ? '#00f5ff' : cat === 'work' ? '#ff8c00' : cat === 'quit' ? '#ff3366' : '#9d4edd',
  }));
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Analytics</div>
        <div className="header-greeting">Progress <span>Report</span></div>
        <div className="header-date">Real data. Real growth.</div>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Overall Completion', value: `${pct}%`, sub: `${completed} of ${total} tasks`, accent: 'var(--cyan)' },
          { label: 'Days Smoke Free', value: `${smokeStats.days}`, sub: `$${moneySaved} saved`, accent: 'var(--green)' },
          { label: 'Best Streak', value: `${Math.max(...habits.map(h => h.streak))}d`, sub: 'consecutive days', accent: 'var(--orange)' },
          { label: 'Habits Done Today', value: `${habits.filter(h => h.todayDone).length}/${habits.length}`, sub: 'habits completed', accent: 'var(--purple)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--accent-color': s.accent } as React.CSSProperties}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">// Category Breakdown</div></div>
          {categoryBreakdown.map(c => (
            <div key={c.cat} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <span style={{ color: c.color }}>{CATEGORY_LABELS[c.cat]}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{c.done}/{c.total}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: c.total > 0 ? `${(c.done / c.total) * 100}%` : '0%', background: c.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">// Habit Streaks</div></div>
          {habits.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{h.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>{h.label}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((h.streak / 30) * 100, 100)}%`, background: h.color }} />
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: h.color }}>🔥{h.streak}</span>
            </div>
          ))}
        </div>
        <QuitCounterCard
          quitDate={quitDate}
          setQuitDate={setQuitDate}
          smokeStats={smokeStats}
        />
      </div>
    </div>
  );
}

// ── PLANNER SECTION ───────────────────────────────────────────────
function PlannerSection() {
  const weekDates = getWeekDates();
  const todayIdx = new Date().getDay();
  const [loading, setLoading] = useState(false);
  const [aiSchedule, setAiSchedule] = useLocalStorage<null | { week: { day: string; theme: string; blocks: { time: string; duration: string; activity: string; category: string; notes: string }[] }[]; weekInsight: string }>('cybersched-ai-schedule', null);
  const [form, setForm] = useState({ wakeTime: '07:00', sleepTime: '23:00', gymDays: '3', workHours: '4', energyType: 'morning', goals: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  async function generateSchedule() {
    if (!form.goals.trim()) { setError('Please describe your goals first.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setAiSchedule(data);
      setShowForm(false);
    } catch {
      setError('Connection failed. Check your API key in .env.local');
    } finally {
      setLoading(false);
    }
  }

  const categoryColor: Record<string, string> = {
    body: '#00ff88', mind: '#00f5ff', work: '#ff8c00', quit: '#ff3366', fun: '#9d4edd',
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // AI Planner</div>
        <div className="header-greeting">Command <span>Grid</span></div>
        <div className="header-date">Your week, designed by AI around your life</div>
      </div>

      {/* Generate button */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={() => setShowForm(true)}>
          ◉ GENERATE MY WEEK WITH AI
        </button>
        {aiSchedule && (
          <button className="btn-secondary" onClick={() => setShowForm(true)}>Regenerate</button>
        )}
      </div>

      {/* AI Insight */}
      {aiSchedule?.weekInsight && (
        <div className="ai-insight" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>◉ AI WEEK STRATEGY</div>
          <div className="ai-insight-text">{aiSchedule.weekInsight}</div>
        </div>
      )}

      {/* AI Generated Schedule */}
      {aiSchedule ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {aiSchedule.week.map((dayPlan, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="card-title">{dayPlan.day.toUpperCase()}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{dayPlan.theme}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{dayPlan.blocks.length} blocks</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayPlan.blocks.map((block, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: `1px solid ${categoryColor[block.category] || 'var(--border)'}20` }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', minWidth: 50 }}>{block.time}</div>
                    <div style={{ width: 3, height: '100%', minHeight: 36, borderRadius: 2, background: categoryColor[block.category] || 'var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{block.activity}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: categoryColor[block.category] || 'var(--text-muted)' }}>{block.duration}</span>
                        <span className={`task-tag tag-${block.category}`}>{block.category}</span>
                        {block.notes && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>{block.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Fallback static grid
        <div className="card">
          <div className="card-header">
            <div className="card-title">// Default Week View</div>
            <span className="card-action">Click Generate to use AI</span>
          </div>
          <div className="week-grid">
            {weekDates.map((date, i) => (
              <div key={i} className="day-col">
                <div className="day-header">
                  <div className="day-name">{DAYS[date.getDay()]}</div>
                  <div className={`day-num ${date.getDay() === todayIdx ? 'today' : ''}`}>{date.getDate()}</div>
                </div>
                {(WEEK_SCHEDULE[i] || []).map((block, j) => (
                  <div key={j} className="day-block" style={{ background: block.bg, color: block.color, border: `1px solid ${block.color}30` }}>{block.label}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">◉ AI SCHEDULE GENERATOR</div>

            {error && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">WAKE UP TIME</label>
                <input className="input-field" type="time" value={form.wakeTime} onChange={e => setForm(p => ({ ...p, wakeTime: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">SLEEP TIME</label>
                <input className="input-field" type="time" value={form.sleepTime} onChange={e => setForm(p => ({ ...p, sleepTime: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">GYM DAYS / WEEK</label>
                <select className="input-select" value={form.gymDays} onChange={e => setForm(p => ({ ...p, gymDays: e.target.value }))}>
                  {['1','2','3','4','5','6'].map(n => <option key={n} value={n}>{n} days</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">WORK/STUDY HOURS</label>
                <select className="input-select" value={form.workHours} onChange={e => setForm(p => ({ ...p, workHours: e.target.value }))}>
                  {['2','3','4','5','6','7','8'].map(n => <option key={n} value={n}>{n} hours/day</option>)}
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">ENERGY TYPE</label>
                <select className="input-select" value={form.energyType} onChange={e => setForm(p => ({ ...p, energyType: e.target.value }))}>
                  <option value="morning">🌅 Morning person — peak energy AM</option>
                  <option value="evening">🌙 Night owl — peak energy PM</option>
                  <option value="balanced">⚡ Balanced — consistent energy</option>
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">YOUR GOALS THIS WEEK</label>
                <textarea className="input-field" rows={3}
                  style={{ resize: 'vertical' }}
                  placeholder="e.g. Pass my math exam, build gym habit, stay smoke-free, finish work project, improve English..."
                  value={form.goals}
                  onChange={e => setForm(p => ({ ...p, goals: e.target.value }))} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={generateSchedule} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? '◉ GENERATING...' : '◉ GENERATE MY WEEK'}
              </button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ENGLISH SECTION ───────────────────────────────────────────────
function EnglishSection() {
  const [currentWord, setCurrentWord] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const word = ENGLISH_WORDS[currentWord];
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // English+</div>
        <div className="header-greeting">Level <span>Up</span></div>
        <div className="header-date">Build your vocabulary — one word at a time</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ border: '1px solid rgba(157,78,221,0.3)' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--purple)' }}>// Word of the Day</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{currentWord + 1}/{ENGLISH_WORDS.length}</span>
          </div>
          <div className="word-card" style={{ marginBottom: 20 }}>
            <div className="word-main">{word.word}</div>
            <div className="word-type">{word.type}</div>
            <div className="word-definition">{word.def}</div>
            <div className="word-example">{word.example}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setCurrentWord(p => Math.max(0, p - 1)); setRevealed(false); }}>← Prev</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setCurrentWord(p => (p + 1) % ENGLISH_WORDS.length); setRevealed(false); }}>Next →</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">// Practice</div></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
            Use <strong style={{ color: 'var(--purple)' }}>{word.word}</strong> in your own sentence:
          </div>
          <textarea style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, minHeight: 100, outline: 'none', resize: 'vertical' }}
            placeholder="Write your sentence here..." />
          <button className="btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={() => setRevealed(true)}>REVEAL EXAMPLE</button>
          {revealed && (
            <div style={{ marginTop: 14, padding: 14, background: 'rgba(157,78,221,0.08)', borderRadius: 8, border: '1px solid rgba(157,78,221,0.25)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {word.example}
            </div>
          )}
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><div className="card-title">// Word Bank</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {ENGLISH_WORDS.map((w, i) => (
              <div key={i} onClick={() => { setCurrentWord(i); setRevealed(false); }}
                style={{ padding: 14, borderRadius: 8, background: currentWord === i ? 'rgba(157,78,221,0.1)' : 'var(--bg-secondary)', border: `1px solid ${currentWord === i ? 'rgba(157,78,221,0.4)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: currentWord === i ? 'var(--purple)' : 'var(--text-primary)', marginBottom: 4 }}>{w.word}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{w.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS SECTION ──────────────────────────────────────────────
function SettingsSection({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) {
  const [edited, setEdited] = useState(false);
  const [form, setForm] = useState(settings);

  function save() {
    setSettings(form);
    setEdited(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Settings</div>
        <div className="header-greeting">Personalize <span>Your</span> <span>Path</span></div>
        <div className="header-date">Customize your life OS for maximum resonance</div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">// User Profile</div>
        </div>
        <div className="input-group">
          <label className="input-label">YOUR NAME</label>
          <input className="input-field" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setEdited(true); }} placeholder="Enter your name" />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">// Smoking Stats (for savings calculation)</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">CIGARETTES PER DAY</label>
            <input className="input-field" type="number" min="1" value={form.cigarettesPerDay} onChange={e => { setForm(p => ({ ...p, cigarettesPerDay: Number(e.target.value) })); setEdited(true); }} />
          </div>
          <div className="input-group">
            <label className="input-label">COST PER PACK</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input-field" type="number" min="0.01" step="0.01" value={form.costPerPack} onChange={e => { setForm(p => ({ ...p, costPerPack: Number(e.target.value) })); setEdited(true); }} style={{ flex: 1 }} />
              <input className="input-field" value={form.currency} onChange={e => { setForm(p => ({ ...p, currency: e.target.value })); setEdited(true); }} style={{ width: 60 }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">CIGARETTES PER PACK</label>
            <input className="input-field" type="number" min="1" value={form.cigarettesPerPack} onChange={e => { setForm(p => ({ ...p, cigarettesPerPack: Number(e.target.value) })); setEdited(true); }} />
          </div>
        </div>
      </div>
      {edited && (
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={save}>SAVE SETTINGS</button>
          <button className="btn-secondary" onClick={() => { setForm(settings); setEdited(false); }}>CANCEL</button>
        </div>
      )}
    </div>
  );
}

// ── AI MOTIVATION CARD ────────────────────────────────────────────
function AIMotivationCard({ settings, smokeStats, gymStreak, completionPct, goals }: {
  settings: Settings;
  smokeStats: { days: number; hours: number; minutes: number; cigarettes: number; moneySaved: string; percent: number };
  gymStreak: number;
  completionPct: number;
  goals: string;
}) {
  const [motivation, setMotivation] = useLocalStorage<string>('cybersched-motivation', '');
  const [motivDate, setMotivDate] = useLocalStorage<string>('cybersched-motiv-date', '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = todayStr();
    if (motivDate !== today) {
      setLoading(true);
      fetch('/api/motivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          smokeDays: smokeStats.days,
          gymStreak,
          completionPct,
          goals: goals || 'become the best version',
        }),
      })
        .then(r => r.json())
        .then(d => {
          setMotivation(d.message);
          setMotivDate(today);
        })
        .catch(() => setMotivation('Every day smoke-free is a war won. Keep going.'))
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <div className="ai-insight" style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>◉ AI MOTIVATION</div>
      <div className="ai-insight-text">
        {loading ? 'Generating your daily message...' : motivation || 'Show up today. That is enough.'}
      </div>
    </div>
  );
}

// ── POMODORO TIMER ────────────────────────────────────────────────
function PomodoroTimer() {
  const [count, setCount] = useLocalStorage<number>('cybersched-pomodoros', 0);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [time, setTime] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  const modes = {
    work: { label: 'WORK', time: 25 * 60, color: 'var(--cyan)' },
    shortBreak: { label: 'SHORT BREAK', time: 5 * 60, color: 'var(--orange)' },
    longBreak: { label: 'LONG BREAK', time: 15 * 60, color: 'var(--green)' },
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (running && time > 0) {
      interval = setInterval(() => setTime(t => t - 1), 1000);
    } else if (time === 0 && running) {
      setRunning(false);
      if (mode === 'work') setCount(c => c + 1);
      setMode(mode === 'work' ? 'shortBreak' : 'work');
      setTime(modes[mode === 'work' ? 'shortBreak' : 'work'].time);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [running, time, mode]);

  function reset() {
    setTime(modes[mode].time);
    setRunning(false);
  }

  const mins = Math.floor(time / 60);
  const secs = time % 60;
  const percent = mode === 'work' ? ((25 * 60 - time) / (25 * 60)) * 100 : 100;

  return (
    <div className="card" style={{ border: `1px solid ${modes[mode].color}40`, marginBottom: 20 }}>
      <div className="card-header">
        <div className="card-title" style={{ color: modes[mode].color }}>// Pomodoro</div>
        <span className="card-action" style={{ color: modes[mode].color }}>{count} sessions</span>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto', marginBottom: 18 }}>
          <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={70} cy={70} r={60} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
            <circle cx={70} cy={70} r={60} fill="none" stroke={modes[mode].color} strokeWidth={3}
              strokeDasharray={`${(percent / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
              strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${modes[mode].color})` }} />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: modes[mode].color }}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 1 }}>{modes[mode].label}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={() => setRunning(!running)}>
          {running ? 'PAUSE' : 'START'}
        </button>
        <button className="btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={reset}>RESET</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {(Object.keys(modes) as Array<'work' | 'shortBreak' | 'longBreak'>).map(m => (
          <button key={m} onClick={() => { setMode(m); setTime(modes[m].time); setRunning(false); }}
            style={{
              flex: 1, padding: '6px 8px', borderRadius: 6, border: `1px solid`,
              borderColor: mode === m ? modes[m].color : 'var(--border)',
              background: mode === m ? `${modes[m].color}15` : 'transparent',
              color: mode === m ? modes[m].color : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            {m === 'work' ? '25M' : m === 'shortBreak' ? '5M' : '15M'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AI CHAT CONTROLLER ────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

function AIChatController({
  tasks, setTasks, habits, setHabits, settings, setSettings,
  quitDate, setQuitDate, setActiveNav,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  habits: HabitStat[];
  setHabits: React.Dispatch<React.SetStateAction<HabitStat[]>>;
  settings: Settings;
  setSettings: (s: Settings) => void;
  quitDate: string;
  setQuitDate: (d: string) => void;
  setActiveNav: (n: NavSection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: `Hey ${settings.name}! I'm your CyberSched AI. I can see your full dashboard and control it directly. Try saying "add gym at 7am", "I just studied for 2 hours", "what should I focus on today", or "show my stats".`,
      timestamp: new Date().toTimeString().slice(0, 5),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function executeActions(actions: { action: string; [key: string]: unknown }[]) {
    for (const act of actions) {
      switch (act.action) {

        case 'ADD_TASK': {
          const t = act.task as { name: string; category: Category; time: string };
          setTasks(prev => [...prev, {
            id: Date.now().toString(),
            name: t.name,
            category: t.category || 'work',
            time: t.time || '09:00',
            done: false,
            date: todayStr(),
          }].sort((a, b) => a.time.localeCompare(b.time)));
          break;
        }

        case 'COMPLETE_TASK': {
          const name = (act.taskName as string).toLowerCase();
          setTasks(prev => prev.map(t =>
            t.name.toLowerCase().includes(name) ? { ...t, done: true } : t
          ));
          break;
        }

        case 'DELETE_TASK': {
          const name = (act.taskName as string).toLowerCase();
          setTasks(prev => prev.filter(t => !t.name.toLowerCase().includes(name)));
          break;
        }

        case 'CLEAR_DONE_TASKS': {
          setTasks(prev => prev.filter(t => !t.done));
          break;
        }

        case 'COMPLETE_HABIT': {
          const id = act.habitId as string;
          setHabits(prev => prev.map(h =>
            h.id === id ? { ...h, todayDone: true, streak: h.streak + 1 } : h
          ));
          break;
        }

        case 'RESET_HABIT': {
          const id = act.habitId as string;
          setHabits(prev => prev.map(h =>
            h.id === id ? { ...h, todayDone: false } : h
          ));
          break;
        }

        case 'UPDATE_SETTING': {
          setSettings({ ...settings, [act.key as string]: act.value });
          break;
        }

        case 'NAVIGATE': {
          setActiveNav(act.section as NavSection);
          setOpen(false);
          break;
        }
      }
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMsg,
      timestamp: new Date().toTimeString().slice(0, 5),
    }]);

    setLoading(true);

    try {
      const appState = {
        tasks: tasks.map(t => ({ name: t.name, category: t.category, time: t.time, done: t.done, date: t.date })),
        habits: habits.map(h => ({ id: h.id, label: h.label, streak: h.streak, todayDone: h.todayDone })),
        settings: { name: settings.name },
        smokeFree: { quitDate, daysClean: quitDate ? Math.floor((Date.now() - new Date(quitDate).getTime()) / 86400000) : 0 },
        today: new Date().toDateString(),
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, appState }),
      });

      const data = await res.json();

      if (data.actions?.length > 0) executeActions(data.actions);

      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.message || 'Done.',
        timestamp: new Date().toTimeString().slice(0, 5),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Connection error. Check your internet and try again.',
        timestamp: new Date().toTimeString().slice(0, 5),
      }]);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    'What should I focus on today?',
    'I just finished my workout',
    'Add study session at 3pm',
    'Show my progress stats',
    'Clear my completed tasks',
  ];

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 28, right: 28, width: 56, height: 56,
        borderRadius: '50%', background: open ? 'var(--bg-card)' : 'var(--cyan)',
        border: `2px solid ${open ? 'var(--border-bright)' : 'var(--cyan)'}`,
        color: open ? 'var(--cyan)' : '#000',
        fontSize: 22, cursor: 'pointer', zIndex: 500,
        boxShadow: '0 0 30px rgba(0,245,255,0.3)',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {open ? '✕' : '◉'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28,
          width: 380, height: 520,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-bright)',
          borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          zIndex: 499,
          boxShadow: '0 0 60px rgba(0,245,255,0.1)',
          animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 2 }}>CYBERSCHED AI</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Controls your app in real-time</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? 'var(--cyan)' : 'var(--bg-secondary)',
                  border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
                  color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                  fontSize: 13, lineHeight: 1.5,
                  fontFamily: 'var(--font-body)',
                }}>
                  {msg.content}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 3, paddingInline: 4 }}>{msg.timestamp}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: `blink 1s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{
                  padding: '5px 10px', borderRadius: 20, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                  fontSize: 10, cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
              placeholder="Tell me what to do..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <button onClick={sendMessage} disabled={loading} style={{
              width: 42, height: 42, borderRadius: 10, background: 'var(--cyan)', border: 'none',
              color: '#000', fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>→</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('cybersched-tasks', DEFAULT_TASKS);
  const [habits, setHabits] = useLocalStorage<HabitStat[]>('cybersched-habits', DEFAULT_HABITS);
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [quitDate, setQuitDate] = useLocalStorage<string>('cybersched-quitdate', '');
  const [settings, setSettings] = useLocalStorage<Settings>('cybersched-settings', DEFAULT_SETTINGS);

  // Calculate everything from quit date in real time
  const smokeStats = (() => {
    if (!quitDate) return { days: 0, hours: 0, minutes: 0, cigarettes: 0, moneySaved: '0', percent: 0 };
    const diff = Date.now() - new Date(quitDate).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const cigarettes = Math.floor(days * settings.cigarettesPerDay);
    const costPerCigarette = settings.costPerPack / settings.cigarettesPerPack;
    const moneySaved = (days * settings.cigarettesPerDay * costPerCigarette).toFixed(2);
    const percent = Math.min((days / 90) * 100, 100); // 90 day goal
    return { days, hours, minutes, cigarettes, moneySaved, percent };
  })();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', category: 'body' as Category, time: '09:00' });
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [quitDate]);

  const weekDates = getWeekDates();
  const todayDayIdx = now ? now.getDay() : new Date().getDay();
  const completedToday = tasks.filter(t => t.done && t.date === todayStr()).length;
  const totalToday = tasks.filter(t => t.date === todayStr()).length;
  const completionPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const moneySaved = smokeStats.moneySaved;

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const done = !t.done;
      if (done) setHabits(h => h.map(hab => hab.id === t.category ? { ...hab, todayDone: true } : hab));
      return { ...t, done };
    }));
  }

  function addTask() {
    if (!newTask.name.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), ...newTask, done: false, date: todayStr() }].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTask({ name: '', category: 'body', time: '09:00' });
    setShowAddTask(false);
  }

  const displayTime = now ? now.toTimeString().slice(0, 8) : '--:--:--';
  const displayDay = now ? DAYS[now.getDay()] : '';
  const displayMonth = now ? MONTHS[now.getMonth()] : '';
  const displayDate = now ? now.getDate() : '';
  const displayYear = now ? now.getFullYear() : '';

  const NAV_ITEMS = [
    { id: 'dashboard' as NavSection, icon: '⬡', label: 'Dashboard' },
    { id: 'tasks' as NavSection, icon: '◈', label: 'Tasks' },
    { id: 'habits' as NavSection, icon: '◎', label: 'Habits' },
    { id: 'stats' as NavSection, icon: '◫', label: 'Statistics' },
    { id: 'planner' as NavSection, icon: '▦', label: 'Planner' },
    { id: 'english' as NavSection, icon: '◉', label: 'English' },
    { id: 'settings' as NavSection, icon: '⚙', label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sidebar-logo">CS<span>:SCHED</span></div>
        {NAV_ITEMS.map(nav => (
          <button key={nav.id} className={`nav-item ${activeNav === nav.id ? 'active' : ''}`} onClick={() => setActiveNav(nav.id)}>
            <span className="nav-icon">{nav.icon}</span>
            <span className="nav-label">{nav.label}</span>
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft: 72, flex: 1, padding: 32, maxWidth: 'calc(100vw - 72px)', minWidth: 0 }}>

        {/* ── DASHBOARD ── */}
        {activeNav === 'dashboard' && (
          <>
            <div className="header">
              <div>
                <div className="header-title">CyberSched // Life OS</div>
                <div className="header-greeting">Welcome back, <span className="cursor-blink">{settings.name}</span></div>
                <div className="header-date">
                  {displayDay.toUpperCase()} · {displayMonth} {displayDate}, {displayYear} ·{' '}
                  <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{displayTime}</span>
                </div>
              </div>
              <div className="header-right">
                <div className="streak-badge">🔥 {habits[0].streak} day streak</div>
                <div className="streak-badge" style={{ color: 'var(--green)', boxShadow: '0 0 20px rgba(0,255,136,0.1)' }}>🚭 {smokeStats.days} days clean</div>
              </div>
            </div>

            <div className="stats-grid">
                {[
                { label: "Today's Score", value: `${completionPct}%`, sub: `${completedToday}/${totalToday} tasks done`, icon: '◈', accent: 'var(--cyan)' },
                { label: 'Smoke Free', value: `${smokeStats.days}d`, sub: `≈ $${moneySaved} saved`, icon: '🚭', accent: 'var(--green)' },
                { label: 'Gym Streak', value: `${habits[0].streak}`, sub: 'days consecutive', icon: '💪', accent: 'var(--orange)' },
                { label: 'Study Streak', value: `${habits[1].streak}`, sub: 'days consecutive', icon: '📚', accent: 'var(--purple)' },
              ].map((stat, i) => (
                <div key={i} className="stat-card" style={{ '--accent-color': stat.accent } as React.CSSProperties}>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-sub">{stat.sub}</div>
                  <div className="stat-icon">{stat.icon}</div>
                </div>
              ))}
            </div>

            <div className="content-grid">
              <div className="content-left">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">// Habit Core</div>
                    <span className="card-action">Week {Math.ceil((now?.getDate() ?? 1) / 7)}</span>
                  </div>
                  <div className="habits-grid">
                    {habits.map(habit => (
                      <div key={habit.id} className="habit-item" onClick={() => setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, todayDone: !h.todayDone } : h))}>
                        <div className="habit-ring">
                          <HabitRing progress={habit.todayDone ? 100 : habit.weekProgress} color={habit.color} />
                          <div className="habit-ring-value" style={{ color: habit.color }}>{habit.todayDone ? '✓' : `${habit.weekProgress}%`}</div>
                        </div>
                        <div className="habit-label" style={{ color: habit.todayDone ? habit.color : undefined }}>{habit.icon} {habit.label}</div>
                        <div className="habit-streak">🔥 {habit.streak}d</div>
                      </div>
                    ))}
                  </div>
                  <div className="progress-bar" style={{ marginTop: 16 }}>
                    <div className="progress-fill" style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Daily completion: {completionPct}%</div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">{"// Today's Mission"}</div>
                    <button className="card-action" onClick={() => setShowAddTask(true)}>+ ADD TASK</button>
                  </div>
                  {tasks.filter(t => t.date === todayStr()).sort((a, b) => a.time.localeCompare(b.time)).map(task => (
                    <div key={task.id} className={`task-item ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id)}>
                      <div className={`task-check ${task.done ? 'done' : ''}`}>{task.done ? '✓' : ''}</div>
                      <div className="task-info">
                        <div className="task-name">{task.name}</div>
                        <div className="task-meta">
                          <span>{task.time}</span>
                          <span className={`task-tag tag-${task.category}`}>{CATEGORY_LABELS[task.category]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="add-task-btn" onClick={() => setShowAddTask(true)}>
                    <span style={{ fontSize: 18, color: 'var(--cyan)' }}>+</span> Add new task...
                  </button>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">// Weekly Command Grid</div>
                    <span className="card-action">AI-Generated</span>
                  </div>
                  <div className="week-grid">
                    {weekDates.map((date, i) => (
                      <div key={i} className="day-col">
                        <div className="day-header">
                          <div className="day-name">{DAYS[date.getDay()]}</div>
                          <div className={`day-num ${date.getDay() === todayDayIdx ? 'today' : ''}`}>{date.getDate()}</div>
                        </div>
                        {(WEEK_SCHEDULE[i] || []).map((block, j) => (
                          <div key={j} className="day-block" style={{ background: block.bg, color: block.color, border: `1px solid ${block.color}30` }}>{block.label}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="content-right">
                <AIMotivationCard
                  settings={settings}
                  smokeStats={smokeStats}
                  gymStreak={habits[0]?.streak || 0}
                  completionPct={completionPct}
                  goals=""
                />

                <PomodoroTimer />

                <QuitCounterCard
                  quitDate={quitDate}
                  setQuitDate={setQuitDate}
                  smokeStats={smokeStats}
                />

                <div className="card" style={{ border: '1px solid rgba(157,78,221,0.2)' }}>
                  <div className="card-header">
                    <div className="card-title" style={{ color: 'var(--purple)' }}>// Word of the Day</div>
                  </div>
                  <div className="word-card">
                    <div className="word-main">{ENGLISH_WORDS[0].word}</div>
                    <div className="word-type">{ENGLISH_WORDS[0].type}</div>
                    <div className="word-definition">{ENGLISH_WORDS[0].def}</div>
                    <div className="word-example">{ENGLISH_WORDS[0].example}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeNav === 'tasks' && <TasksSection tasks={tasks} setTasks={setTasks} />}
        {activeNav === 'habits' && <HabitsSection habits={habits} setHabits={setHabits} />}
        {activeNav === 'stats' && <StatsSection tasks={tasks} habits={habits} quitDate={quitDate} setQuitDate={setQuitDate} smokeStats={smokeStats} />}
        {activeNav === 'planner' && <PlannerSection />}
        {activeNav === 'english' && <EnglishSection />}
        {activeNav === 'settings' && <SettingsSection settings={settings} setSettings={setSettings} />}
      </main>

      {/* ADD TASK MODAL */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">// ADD NEW TASK</div>
            <div className="input-group">
              <label className="input-label">TASK NAME</label>
              <input className="input-field" placeholder="What do you need to do?" value={newTask.name}
                onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addTask()} autoFocus />
            </div>
            <div className="input-group">
              <label className="input-label">CATEGORY</label>
              <select className="input-select" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value as Category }))}>
                <option value="body">💪 Body</option>
                <option value="mind">📚 Mind</option>
                <option value="work">⚡ Work</option>
                <option value="quit">🚭 Quit Smoking</option>
                <option value="fun">🎮 Fun</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">SCHEDULED TIME</label>
              <input className="input-field" type="time" value={newTask.time} onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={addTask}>EXECUTE TASK</button>
              <button className="btn-secondary" onClick={() => setShowAddTask(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <AIChatController
        tasks={tasks}
        setTasks={setTasks}
        habits={habits}
        setHabits={setHabits}
        settings={settings}
        setSettings={setSettings}
        quitDate={quitDate}
        setQuitDate={setQuitDate}
        setActiveNav={setActiveNav}
      />
    </div>
  );
}
