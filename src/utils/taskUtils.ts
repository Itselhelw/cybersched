/**
 * Task Management Utilities for CyberSched
 * Handles priorities, recurring tasks, subtasks, and time tracking
 */

interface Task {
  id: string;
  name: string;
  category: string;
  time: string;
  done: boolean;
  date: string;
  priority?: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  subtasks?: Subtask[];
  estimatedTime?: number;
  actualTime?: number;
}

interface Subtask {
  id: string;
  name: string;
  done: boolean;
}

// ── PRIORITY HELPERS ──────────────────────────────────

export function getPriorityColor(priority?: string): string {
  switch (priority) {
    case 'high':
      return '#ff3366'; // Red
    case 'medium':
      return '#ff8c00'; // Orange
    case 'low':
      return '#00ff88'; // Green
    default:
      return '#6b6b8a'; // Gray
  }
}

export function getPriorityLabel(priority?: string): string {
  return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Normal';
}

export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
  return [...tasks].sort((a, b) => {
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
    return priorityA - priorityB;
  });
}

// ── RECURRING TASK HELPERS ────────────────────────────

export function generateRecurringTasks(baseTask: Task, startDate: Date, daysAhead: number = 7): Task[] {
  if (!baseTask.isRecurring || !baseTask.recurrence) return [baseTask];

  const tasks: Task[] = [];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysAhead);

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const shouldInclude = checkRecurrenceMatch(currentDate, startDate, baseTask.recurrence);

    if (shouldInclude) {
      const dateStr = currentDate.toISOString().split('T')[0];
      tasks.push({
        ...baseTask,
        date: dateStr,
        id: `${baseTask.id}-${dateStr}`, // Unique ID for each occurrence
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return tasks;
}

function checkRecurrenceMatch(date: Date, baseDate: Date, recurrence: string): boolean {
  const baseDayOfWeek = baseDate.getDay();
  const baseDayOfMonth = baseDate.getDate();

  switch (recurrence) {
    case 'daily':
      return true;

    case 'weekly':
      return date.getDay() === baseDayOfWeek;

    case 'monthly':
      return date.getDate() === baseDayOfMonth;

    default:
      return false;
  }
}

export function expandRecurringInTaskList(tasks: Task[], today: Date, daysAhead: number = 7): Task[] {
  const expanded: Task[] = [];

  tasks.forEach(task => {
    if (task.isRecurring) {
      const generated = generateRecurringTasks(task, today, daysAhead);
      expanded.push(...generated);
    } else {
      expanded.push(task);
    }
  });

  return expanded;
}

// ── SUBTASK HELPERS ──────────────────────────────────

export function toggleSubtask(task: Task, subtaskId: string): Task {
  return {
    ...task,
    subtasks: task.subtasks?.map(st => (st.id === subtaskId ? { ...st, done: !st.done } : st)) || [],
  };
}

export function addSubtask(task: Task, subtaskName: string): Task {
  const newSubtask: Subtask = {
    id: `st-${Date.now()}`,
    name: subtaskName,
    done: false,
  };

  return {
    ...task,
    subtasks: [...(task.subtasks || []), newSubtask],
  };
}

export function removeSubtask(task: Task, subtaskId: string): Task {
  return {
    ...task,
    subtasks: task.subtasks?.filter(st => st.id !== subtaskId) || [],
  };
}

export function getSubtaskProgress(task: Task): { completed: number; total: number; percentage: number } {
  if (!task.subtasks || task.subtasks.length === 0) {
    return { completed: 0, total: 0, percentage: 100 };
  }

  const completed = task.subtasks.filter(st => st.done).length;
  const total = task.subtasks.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

// ── TIME TRACKING HELPERS ────────────────────────────

export function logTime(task: Task, minutes: number): Task {
  const newActualTime = (task.actualTime || 0) + minutes;
  return {
    ...task,
    actualTime: newActualTime,
  };
}

export function getTimeStats(task: Task): { estimated: number; actual: number; remaining: number; variance: number } {
  const estimated = task.estimatedTime || 0;
  const actual = task.actualTime || 0;
  const remaining = Math.max(0, estimated - actual);
  const variance = actual - estimated; // Positive = over, Negative = under

  return { estimated, actual, remaining, variance };
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getTimeColor(task: Task): string {
  const stats = getTimeStats(task);

  if (stats.estimated === 0) return '#6b6b8a'; // Gray if no estimate
  if (stats.variance > stats.estimated * 0.2) return '#ff3366'; // Red if way over
  if (stats.variance > 0) return '#ff8c00'; // Orange if slightly over
  return '#00ff88'; // Green if on time or under
}

// ── BATCH OPERATIONS ────────────────────────────────

export function filterTasksByPriority(tasks: Task[], priority: 'low' | 'medium' | 'high' | 'all' = 'all'): Task[] {
  if (priority === 'all') return tasks;
  return tasks.filter(t => t.priority === priority);
}

export function getHighPriorityTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => t.priority === 'high' && !t.done);
}

export function getOverdueRecurring(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(t => t.isRecurring && t.date === today && !t.done);
}

export function getTaskStats(tasks: Task[]): {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  withSubtasks: number;
  withTimeTracking: number;
} {
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.done).length,
    pending: tasks.filter(t => !t.done).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.done).length,
    withSubtasks: tasks.filter(t => t.subtasks && t.subtasks.length > 0).length,
    withTimeTracking: tasks.filter(t => t.estimatedTime || t.actualTime).length,
  };
}
