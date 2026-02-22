/**
 * Habit Management and Journal System
 * Supports custom habits, templates, and tracking
 */

interface HabitStat {
  id: string;
  label: string;
  icon: string;
  color: string;
  streak: number;
  todayDone: boolean;
  weekProgress: number;
  isCustom?: boolean;
  startDate?: string;
  journalEntry?: string;
  lastJournalUpdate?: string;
}

interface JournalEntry {
  id: string;
  habitId: string;
  date: string;
  notes: string;
  mood?: 'great' | 'good' | 'ok' | 'struggling';
  timestamp: string;
}

export const HABIT_TEMPLATES = [
  {
    id: 'gym',
    label: 'Gym',
    icon: '💪',
    color: '#00ff88',
    description: 'Daily workout or exercise',
  },
  {
    id: 'meditation',
    label: 'Meditation',
    icon: '🧘',
    color: '#00f5ff',
    description: 'Daily meditation practice',
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: '📚',
    color: '#9d4edd',
    description: 'Daily reading session',
  },
  {
    id: 'journaling',
    label: 'Journaling',
    icon: '📝',
    color: '#ff8c00',
    description: 'Daily journal entry',
  },
  {
    id: 'hydration',
    label: 'Hydration',
    icon: '💧',
    color: '#00ccff',
    description: 'Drink water daily',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: '😴',
    color: '#a78bfa',
    description: 'Get proper sleep',
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: '🧠',
    color: '#34d399',
    description: 'Learn something new',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    icon: '🙏',
    color: '#fbbf24',
    description: 'Practice gratitude',
  },
];

// ── CUSTOM HABIT CREATION ────────────────────────────

export function createCustomHabit(
  label: string,
  icon: string,
  color: string,
  description?: string
): HabitStat {
  return {
    id: `custom-${Date.now()}`,
    label,
    icon,
    color,
    streak: 0,
    todayDone: false,
    weekProgress: 0,
    isCustom: true,
    startDate: new Date().toISOString().split('T')[0],
  };
}

// ── HABIT FROM TEMPLATE ─────────────────────────────

export function createHabitFromTemplate(templateId: string): HabitStat | null {
  const template = HABIT_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  return {
    id: template.id,
    label: template.label,
    icon: template.icon,
    color: template.color,
    streak: 0,
    todayDone: false,
    weekProgress: 0,
    isCustom: false,
    startDate: new Date().toISOString().split('T')[0],
  };
}

// ── JOURNAL ENTRY MANAGEMENT ────────────────────────

export function addJournalEntry(
  habitId: string,
  notes: string,
  mood?: 'great' | 'good' | 'ok' | 'struggling'
): JournalEntry {
  return {
    id: `je-${Date.now()}`,
    habitId,
    date: new Date().toISOString().split('T')[0],
    notes,
    mood,
    timestamp: new Date().toISOString(),
  };
}

export function getHabitJournalEntries(
  entries: JournalEntry[],
  habitId: string,
  days: number = 7
): JournalEntry[] {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return entries
    .filter(e => e.habitId === habitId && e.date >= cutoffStr)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── HABIT INSIGHTS ──────────────────────────────────

export function getHabitInsights(
  habit: HabitStat,
  journalEntries: JournalEntry[]
): {
  averageMood: string;
  totalNotes: number;
  lastNote: string | null;
  consistencyScore: number;
  recommendation: string;
} {
  const entries = journalEntries.filter(e => e.habitId === habit.id);

  if (entries.length === 0) {
    return {
      averageMood: 'No data',
      totalNotes: 0,
      lastNote: null,
      consistencyScore: 0,
      recommendation: 'Start tracking with journal entries to gain insights.',
    };
  }

  const moods = entries.filter(e => e.mood).map(e => e.mood!);
  const moodScore: Record<string, number> = { great: 4, good: 3, ok: 2, struggling: 1 };
  const avgMood = moods.length > 0 ? Math.round(moods.reduce((sum, m) => sum + moodScore[m], 0) / moods.length) : 0;

  const moodLabel = avgMood >= 3.5 ? '🌟 Great' : avgMood >= 2.5 ? '😊 Good' : avgMood >= 1.5 ? '😐 Ok' : '😔 Struggling';

  let recommendation = '';
  if (habit.streak < 5) {
    recommendation = 'Build momentum! You\'re getting started.';
  } else if (habit.streak < 21) {
    recommendation = 'Great progress! Aim for 21 days.';
  } else if (habit.streak < 66) {
    recommendation = 'In the habit zone! Push to 66 days.';
  } else {
    recommendation = '🎉 Habit mastered! Keep the momentum!';
  }

  return {
    averageMood: moodLabel,
    totalNotes: entries.length,
    lastNote: entries[0]?.notes || null,
    consistencyScore: Math.round((habit.streak / habit.weekProgress) * 10),
    recommendation,
  };
}

// ── BULK OPERATIONS ────────────────────────────────

export function deleteHabit(habits: HabitStat[], habitId: string): HabitStat[] {
  return habits.filter(h => h.id !== habitId);
}

export function updateHabitIcon(habits: HabitStat[], habitId: string, icon: string): HabitStat[] {
  return habits.map(h => (h.id === habitId ? { ...h, icon } : h));
}

export function renameHabit(habits: HabitStat[], habitId: string, newLabel: string): HabitStat[] {
  return habits.map(h => (h.id === habitId ? { ...h, label: newLabel } : h));
}
