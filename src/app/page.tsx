'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type Category = 'body' | 'mind' | 'work' | 'quit' | 'fun';
type NavSection = 'dashboard' | 'tasks' | 'habits' | 'stats' | 'planner' | 'english';

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

// ── MAIN APP ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('cybersched-tasks', DEFAULT_TASKS);
  const [habits, setHabits] = useLocalStorage<HabitStat[]>('cybersched-habits', DEFAULT_HABITS);
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [quitDate, setQuitDate] = useLocalStorage<string>('cybersched-quitdate', '');

  // Calculate everything from quit date in real time
  const smokeStats = (() => {
    if (!quitDate) return { days: 0, hours: 0, minutes: 0, cigarettes: 0, moneySaved: '0', percent: 0 };
    const diff = Date.now() - new Date(quitDate).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const cigarettes = Math.floor(days * 20); // assumes 1 pack/day
    const moneySaved = (days * 5).toFixed(2);  // assumes $5/day
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
        <div style={{ flex: 1 }} />
        <button className="nav-item" style={{ color: 'var(--red)' }}>
          <span className="nav-icon">⊗</span>
          <span className="nav-label">Settings</span>
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft: 72, flex: 1, padding: 32, maxWidth: 'calc(100vw - 72px)', minWidth: 0 }}>

        {/* ── DASHBOARD ── */}
        {activeNav === 'dashboard' && (
          <>
            <div className="header">
              <div>
                <div className="header-title">CyberSched // Life OS</div>
                <div className="header-greeting">Welcome back, <span className="cursor-blink">Legend</span></div>
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
                <div className="ai-insight">
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>◉ AI INSIGHT</div>
                  <div className="ai-insight-text">
                    <strong>Pattern detected:</strong> You complete gym tasks 85% more often on weekdays. Consider lighter activity on weekends to maintain the habit chain.
                  </div>
                </div>

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
    </div>
  );
}
