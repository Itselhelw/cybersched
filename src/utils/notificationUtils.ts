/**
 * Notifications & Reminders System
 * Push notifications, task reminders, habit alerts
 */

export interface Notification {
  id: string;
  type: 'task' | 'habit' | 'reminder' | 'milestone' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

export interface ReminderSettings {
  enableTaskReminders: boolean;
  enableHabitReminders: boolean;
  taskReminderTime: string; // HH:MM format
  habitReminderTime: string;
  enablePushNotifications: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  enableTaskReminders: true,
  enableHabitReminders: true,
  taskReminderTime: '09:00',
  habitReminderTime: '20:00',
  enablePushNotifications: false,
};

// ── NOTIFICATION GENERATION ────────────────────────

export function createTaskReminder(taskName: string, time: string): Notification {
  return {
    id: `rem-${Date.now()}`,
    type: 'task',
    title: '📋 Task Reminder',
    message: `Time to work on: ${taskName} (scheduled for ${time})`,
    timestamp: new Date().toISOString(),
    read: false,
    icon: '📋',
  };
}

export function createHabitReminder(habitName: string): Notification {
  return {
    id: `rem-${Date.now()}`,
    type: 'habit',
    title: '🔥 Habit Reminder',
    message: `Don't forget your ${habitName} habit today!`,
    timestamp: new Date().toISOString(),
    read: false,
    icon: '🔥',
  };
}

export function createMilestoneNotification(days: number, habitName: string): Notification {
  const icons: Record<number, string> = {
    7: '🌟',
    21: '🎖️',
    66: '⚡',
    100: '👑',
    365: '🏆',
  };

  return {
    id: `mile-${Date.now()}`,
    type: 'milestone',
    title: `${icons[days] || '🎯'} Milestone Reached!`,
    message: `${habitName} has reached ${days} days! ${days === 365 ? '🎉' : 'Keep going!'}`,
    timestamp: new Date().toISOString(),
    read: false,
    icon: icons[days],
  };
}

export function createAchievementNotification(achievementName: string, points: number): Notification {
  return {
    id: `ach-${Date.now()}`,
    type: 'achievement',
    title: '🏆 Achievement Unlocked!',
    message: `You've unlocked ${achievementName}! +${points} points`,
    timestamp: new Date().toISOString(),
    read: false,
    icon: '🏆',
  };
}

// ── BROWSER NOTIFICATIONS ──────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return 'denied';
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      badge: '🎮',
      icon: '/icon-192x192.png',
      requireInteraction: false,
      ...options,
    });
  }
}

// ── NOTIFICATION MANAGEMENT ────────────────────────

export function markAsRead(notifications: Notification[], id: string): Notification[] {
  return notifications.map(n => (n.id === id ? { ...n, read: true } : n));
}

export function markAllAsRead(notifications: Notification[]): Notification[] {
  return notifications.map(n => ({ ...n, read: true }));
}

export function dismissNotification(notifications: Notification[], id: string): Notification[] {
  return notifications.filter(n => n.id !== id);
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.read).length;
}

// ── REMINDER CHECKING ──────────────────────────────

export function shouldShowTaskReminder(time: string, reminderTime: string, lastRemind?: string): boolean {
  const task = new Date(`1970-01-01T${time}:00`);
  const reminder = new Date(`1970-01-01T${reminderTime}:00`);

  // Show reminder within 30 minutes before task time
  const diff = (task.getTime() - reminder.getTime()) / 60000;
  if (diff > 30 || diff < -5) return false;

  // Don't show same reminder twice
  if (lastRemind) {
    const sinceLastRemind = (Date.now() - new Date(lastRemind).getTime()) / 1000 / 60;
    if (sinceLastRemind < 60) return false;
  }

  return true;
}

export function getUpcomingTaskReminders(
  tasks: any[],
  settings: ReminderSettings,
  hoursAhead: number = 2
): { task: any; remindAt: string }[] {
  if (!settings.enableTaskReminders) return [];

  const now = new Date();
  const checkUntil = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  return tasks
    .filter(t => !t.done)
    .map(t => {
      const [h, m] = t.time.split(':').map(Number);
      const taskTime = new Date(now);
      taskTime.setHours(h, m, 0);

      if (taskTime > now && taskTime <= checkUntil) {
        return { task: t, remindAt: t.time };
      }
      return null;
    })
    .filter((x): x is { task: any; remindAt: string } => x !== null);
}
