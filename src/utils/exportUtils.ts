/**
 * Export Utilities for CyberSched
 * Handles CSV and PDF exports of tasks and habits
 */

interface Task {
  id: string;
  name: string;
  category: string;
  time: string;
  done: boolean;
  date: string;
}

interface HabitStat {
  id: string;
  label: string;
  icon: string;
  color: string;
  streak: number;
  todayDone: boolean;
  weekProgress: number;
}

// ── CSV EXPORT ──────────────────────────────────────────

export function exportTasksToCSV(tasks: Task[]): void {
  const headers = ['Task Name', 'Category', 'Time', 'Status', 'Date'];
  const rows = tasks.map(t => [
    t.name,
    t.category.toUpperCase(),
    t.time,
    t.done ? 'DONE' : 'PENDING',
    t.date,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadCSV(csvContent, 'cybersched-tasks.csv');
}

export function exportHabitsToCSV(habits: HabitStat[]): void {
  const headers = ['Habit', 'Current Streak', 'Week Progress', 'Done Today'];
  const rows = habits.map(h => [
    h.label,
    h.streak,
    `${h.weekProgress}%`,
    h.todayDone ? 'YES' : 'NO',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadCSV(csvContent, 'cybersched-habits.csv');
}

export function exportAllDataToCSV(tasks: Task[], habits: HabitStat[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const tasksCSV = [
    'TASKS',
    ['Task Name', 'Category', 'Time', 'Status', 'Date'].join(','),
    ...tasks.map(t => `"${t.name}","${t.category}","${t.time}","${t.done ? 'DONE' : 'PENDING'}","${t.date}"`),
    '',
    'HABITS',
    ['Habit', 'Streak', 'Week Progress', 'Done Today'].join(','),
    ...habits.map(h => `"${h.label}","${h.streak}","${h.weekProgress}%","${h.todayDone ? 'YES' : 'NO'}"`),
  ].join('\n');

  downloadCSV(tasksCSV, `cybersched-all-data-${timestamp}.csv`);
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ── PDF EXPORT ──────────────────────────────────────────

export async function exportDataToPDF(
  tasks: Task[],
  habits: HabitStat[],
  settings: { name: string; currency: string },
  smokeStats: { days: number; moneySaved: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.text('CyberSched Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  doc.text(`User: ${settings.name}`, pageWidth / 2, yPos + 5, { align: 'center' });
  yPos += 20;

  // Summary Section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Summary', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  const completedTasks = tasks.filter(t => t.done).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  const summaryLines = [
    `Total Tasks: ${tasks.length} (${completedTasks} completed, ${completionRate}%)`,
    `Active Habits: ${habits.length}`,
    `Best Streak: ${bestStreak} days`,
    `Smoke Free: ${smokeStats.days} days | Saved: ${settings.currency}${smokeStats.moneySaved}`,
    `Habits Done Today: ${habits.filter(h => h.todayDone).length}/${habits.length}`,
  ];

  summaryLines.forEach(line => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, 20, yPos);
    yPos += 7;
  });

  // Tasks Section
  yPos += 5;
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('Recent Tasks', 20, yPos);
  yPos += 10;

  doc.setFontSize(9);
  const recentTasks = tasks.slice(-10).reverse();
  recentTasks.forEach(task => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    const status = task.done ? '✓' : '○';
    doc.text(`${status} ${task.name} (${task.category}) - ${task.date}`, 20, yPos);
    yPos += 6;
  });

  // Habits Section
  yPos += 5;
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('Habit Streaks', 20, yPos);
  yPos += 10;

  doc.setFontSize(9);
  habits.forEach(habit => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`${habit.icon} ${habit.label}: ${habit.streak}d streak | ${habit.weekProgress}% week progress`, 20, yPos);
    yPos += 6;
  });

  doc.save(`cybersched-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── ANALYTICS DATA GENERATORS ──────────────────────────

export function getWeeklyProgressData(tasks: Task[]): Array<{ day: string; completed: number; total: number }> {
  const today = new Date();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayTasks = tasks.filter(t => t.date === dateStr);
    const completed = dayTasks.filter(t => t.done).length;
    const total = dayTasks.length;

    weekData.push({
      day: weekDays[i],
      completed,
      total: total > 0 ? total : 1,
    });
  }

  return weekData;
}

export function getCategoryBreakdown(tasks: Task[]): Array<{ name: string; completed: number; total: number; color: string }> {
  const categories: Record<string, { completed: number; total: number; color: string }> = {
    body: { completed: 0, total: 0, color: '#00ff88' },
    mind: { completed: 0, total: 0, color: '#00f5ff' },
    work: { completed: 0, total: 0, color: '#ff8c00' },
    quit: { completed: 0, total: 0, color: '#ff3366' },
    fun: { completed: 0, total: 0, color: '#9d4edd' },
  };

  tasks.forEach(task => {
    if (categories[task.category]) {
      categories[task.category].total += 1;
      if (task.done) {
        categories[task.category].completed += 1;
      }
    }
  });

  return Object.entries(categories).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    ...data,
  }));
}

export function getStreakHistory(habits: HabitStat[]): Array<{ name: string; streak: number; color: string }> {
  return habits.map(h => ({
    name: h.label,
    streak: h.streak,
    color: h.color,
  }));
}

export function getCompletionStats(tasks: Task[]): {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
} {
  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;
  return {
    total,
    completed,
    pending: total - completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
