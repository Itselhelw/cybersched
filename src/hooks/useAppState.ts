import { useLocalStorage } from './useLocalStorage';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { checkAchievements, type Achievement } from '@/utils/gamificationUtils';

export type Category = 'body' | 'mind' | 'work' | 'quit' | 'fun';
export type NavSection = 'dashboard' | 'tasks' | 'habits' | 'stats' | 'planner' | 'german' | 'cyber' | 'settings' | 'analytics';

export interface Task {
    id: string;
    name: string;
    category: Category;
    time: string;
    done: boolean;
    date: string;
    completedAt?: string;
    priority?: 'low' | 'medium' | 'high';
    isRecurring?: boolean;
    recurrence?: 'daily' | 'weekly' | 'monthly';
    subtasks?: Subtask[];
    estimatedTime?: number;
    actualTime?: number;
}

export interface Subtask {
    id: string;
    name: string;
    done: boolean;
}

export interface Habit {
    id: string;
    label: string;
    icon: string;
    color: string;
    streak: number;
    bestStreak: number;
    todayDone: boolean;
    weekProgress: number;
    totalDays: number;
    lastDone: string;
}

export interface AppEvent {
    type: string;
    payload: Record<string, unknown>;
    timestamp: string;
    source: 'user' | 'ai' | 'system';
}

export interface Settings {
    name: string;
    cigarettesPerDay: number;
    costPerPack: number;
    cigarettesPerPack: number;
    currency: string;
    goals: string;
}

export interface SmokeStats {
    days: number;
    hours: number;
    minutes: number;
    cigarettes: number;
    moneySaved: string;
    percent: number;
}

const DEFAULT_HABITS: Habit[] = [
    { id: 'body', label: 'Gym', icon: '💪', color: '#00ff88', streak: 0, bestStreak: 0, todayDone: false, weekProgress: 0, totalDays: 0, lastDone: '' },
    { id: 'mind', label: 'Study', icon: '📚', color: '#00f5ff', streak: 0, bestStreak: 0, todayDone: false, weekProgress: 0, totalDays: 0, lastDone: '' },
    { id: 'work', label: 'Work', icon: '⚡', color: '#ff8c00', streak: 0, bestStreak: 0, todayDone: false, weekProgress: 0, totalDays: 0, lastDone: '' },
    { id: 'quit', label: 'No Smoke', icon: '🚫', color: '#ff3366', streak: 0, bestStreak: 0, todayDone: false, weekProgress: 0, totalDays: 0, lastDone: '' },
    { id: 'fun', label: 'Balanced', icon: '🎮', color: '#9d4edd', streak: 0, bestStreak: 0, todayDone: false, weekProgress: 0, totalDays: 0, lastDone: '' },
];

const DEFAULT_SETTINGS: Settings = {
    name: 'Legend',
    cigarettesPerDay: 20,
    costPerPack: 10,
    cigarettesPerPack: 20,
    currency: '$',
    goals: '',
};

function todayStr(baseDate?: Date | null) {
    return baseDate ? baseDate.toISOString().split('T')[0] : '';
}

function calcWeekProgress(tasks: Task[], category: Category, now: Date | null): number {
    if (!now) return 0;
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay() + i);
        return d.toISOString().split('T')[0];
    });

    const daysWithTask = weekDates.filter(date =>
        tasks.some(t => t.category === category && t.date === date && t.done)
    ).length;

    return Math.round((daysWithTask / 7) * 100);
}

export function useAppState(now: Date | null) {
    const [tasks, setTasksRaw] = useLocalStorage<Task[]>('cs-tasks', []);
    const [habits, setHabitsRaw] = useLocalStorage<Habit[]>('cs-habits', DEFAULT_HABITS);
    const [settings, setSettings] = useLocalStorage<Settings>('cs-settings', DEFAULT_SETTINGS);
    const [quitDate, setQuitDateRaw] = useLocalStorage<string>('cs-quitdate', '');
    const [eventLog, setEventLog] = useLocalStorage<AppEvent[]>('cs-events', []);
    const [onboarded, setOnboarded] = useLocalStorage<boolean>('cs-onboarded', false);
    const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage<Achievement[]>('cs-achievements', []);
    const [unlockedBadges, setUnlockedBadges] = useLocalStorage<string[]>('cs-badges', []);
    const [notifications, setNotifications] = useState<{ id: string; message: string; color: string }[]>([]);

    // ── NOTIFICATION SYSTEM ──────────────────────────────────────
    const notify = useCallback((message: string, color = 'var(--cyan)') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, color }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3500);
    }, []);

    // ── LOG EVENTS ────────────────────────────────────────────────
    const logEvent = useCallback((type: string, payload: Record<string, unknown>, source: 'user' | 'ai' | 'system' = 'user') => {
        const event: AppEvent = { type, payload, timestamp: new Date().toISOString(), source };
        setEventLog(prev => [event, ...prev].slice(0, 100));
    }, [setEventLog]);

    // ── HABIT SYNC ────────────────────────────────────────────────
    const syncTaskToHabit = useCallback((category: Category) => {
        const currentToday = todayStr(now);
        if (!currentToday) return;

        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now!);
            d.setDate(d.getDate() - d.getDay() + i);
            return d.toISOString().split('T')[0];
        });

        // Update habits based on current tasks
        setHabitsRaw(prev => prev.map(h => {
            if (h.id !== category) return h;

            const daysWithDone = weekDates.filter(date =>
                tasks.some(t => t.category === category && t.date === date && t.done)
            ).length;
            const weekProgress = Math.round((daysWithDone / 7) * 100);

            const wasAlreadyDone = h.todayDone;
            const todayDone = tasks.some(t =>
                t.category === category && t.date === currentToday && t.done
            );

            const newStreak = todayDone && !wasAlreadyDone ? h.streak + 1 : (todayDone ? h.streak : h.streak);
            // Note: streak logic might need refinement for "losing" streak if not done, but user focused on increments.

            const bestStreak = Math.max(newStreak, h.bestStreak);
            const totalDays = todayDone && !wasAlreadyDone ? h.totalDays + 1 : h.totalDays;

            return {
                ...h,
                todayDone,
                weekProgress,
                streak: newStreak,
                bestStreak,
                totalDays,
                lastDone: todayDone ? currentToday : h.lastDone,
            };
        }));
    }, [now, tasks, setHabitsRaw]);

    // ── TASK ACTIONS ──────────────────────────────────────────────
    const completeTask = useCallback((taskId: string) => {
        let completedCategory: Category | undefined;
        let isNowDone = false;

        setTasksRaw(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            isNowDone = !t.done;
            completedCategory = t.category;
            return { ...t, done: isNowDone, completedAt: isNowDone ? new Date().toISOString() : undefined };
        }));

        if (completedCategory) {
            logEvent('TASK_COMPLETE', { taskId, category: completedCategory, done: isNowDone }, 'user');
            if (isNowDone) {
                notify(`✓ Task complete — ${completedCategory} habit updated`, 'var(--green)');
            }
        }
    }, [setTasksRaw, logEvent, notify]);

    // Sync effect when tasks change
    useEffect(() => {
        if (!now) return;
        const categories: Category[] = ['body', 'mind', 'work', 'quit', 'fun'];
        categories.forEach(cat => syncTaskToHabit(cat));
    }, [tasks, now, syncTaskToHabit]);

    const addTask = useCallback((taskData: Omit<Task, 'id' | 'done' | 'date'>) => {
        const newTask: Task = {
            ...taskData,
            id: Date.now().toString(),
            done: false,
            date: todayStr(now) || new Date().toISOString().split('T')[0],
        };
        setTasksRaw(prev => [...prev, newTask].sort((a, b) => a.time.localeCompare(b.time)));
        logEvent('TASK_ADD', { name: taskData.name, category: taskData.category }, 'user');
        notify(`+ Task added to ${taskData.category}`, 'var(--cyan)');
        return newTask;
    }, [now, setTasksRaw, logEvent, notify]);

    const deleteTask = useCallback((taskId: string) => {
        setTasksRaw(prev => prev.filter(t => t.id !== taskId));
        logEvent('TASK_DELETE', { taskId }, 'user');
    }, [setTasksRaw, logEvent]);

    const toggleHabit = useCallback((habitId: string) => {
        const currentToday = todayStr(now);
        if (!currentToday) return;

        setHabitsRaw(prev => prev.map(h => {
            if (h.id !== habitId) return h;
            const nowDone = !h.todayDone;
            const newStreak = nowDone ? h.streak + 1 : Math.max(0, h.streak - 1);
            const bestStreak = Math.max(newStreak, h.bestStreak);
            logEvent('HABIT_TOGGLE', { habitId, done: nowDone, streak: newStreak }, 'user');
            if (nowDone) notify(`🔥 ${h.label} streak: ${newStreak} days!`, h.color);
            return {
                ...h,
                todayDone: nowDone,
                streak: newStreak,
                bestStreak,
                totalDays: nowDone ? h.totalDays + 1 : h.totalDays,
                lastDone: nowDone ? currentToday : h.lastDone,
            };
        }));
    }, [now, setHabitsRaw, logEvent, notify]);

    // ── QUIT DATE ─────────────────────────────────────────────────
    const setQuitDate = useCallback((date: string) => {
        setQuitDateRaw(date);
        if (date) {
            setHabitsRaw(prev => prev.map(h =>
                h.id === 'quit' ? { ...h, todayDone: true, lastDone: todayStr(now) } : h
            ));
            logEvent('QUIT_DATE_SET', { date }, 'user');
            notify('🚭 Quit date set — No Smoke habit activated!', '#ff3366');
        }
    }, [now, setQuitDateRaw, setHabitsRaw, logEvent, notify]);

    // ── SMOKE STATS ───────────────────────────────────────────────
    const smokeStats: SmokeStats = (() => {
        if (!quitDate) return { days: 0, hours: 0, minutes: 0, cigarettes: 0, moneySaved: '0', percent: 0 };
        const base = new Date(quitDate).getTime();
        // Use a stable date during SSR/initial render to prevent hydration mismatch
        const current = now ? now.getTime() : new Date('2026-02-23').getTime();
        const diff = Math.max(0, current - base);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        const cigarettes = Math.floor(days * settings.cigarettesPerDay);
        const costPerCig = settings.costPerPack / settings.cigarettesPerPack;
        const moneySaved = (cigarettes * costPerCig).toFixed(2);
        const percent = Math.min((days / 90) * 100, 100);
        return { days, hours, minutes, cigarettes, moneySaved, percent };
    })();

    // ── COMPUTED STATS ────────────────────────────────────────────
    const currentTodayStr = todayStr(now);
    const todayTasks = tasks.filter(t => t.date === currentTodayStr || (currentTodayStr === '' && t.date === ''));
    const completedToday = todayTasks.filter(t => t.done).length;
    const totalToday = todayTasks.length;
    const completionPct = totalToday > 0
        ? Math.round((completedToday / totalToday) * 100)
        : 0;

    const habitsWithProgress = habits.map(h => ({
        ...h,
        weekProgress: calcWeekProgress(tasks, h.id as Category, now),
    }));

    // ── ACHIEVEMENT SYSTEM ────────────────────────────────────────
    useEffect(() => {
        if (!now) return;
        const newAchievements = checkAchievements(tasks, habits, smokeStats, unlockedAchievements);
        if (newAchievements.length > unlockedAchievements.length) {
            setUnlockedAchievements(newAchievements);
            const latest = newAchievements[newAchievements.length - 1];
            notify(`🏆 Achievement Unlocked: ${latest.name}`, 'var(--orange)');
        }
    }, [tasks, habits, smokeStats.days, unlockedAchievements, setUnlockedAchievements, notify, now]);

    // ── STABILIZE APP OBJECT ──────────────────────────────────────
    return useMemo(() => ({
        // State
        tasks, habits, settings, quitDate, smokeStats,
        onboarded, eventLog, notifications,
        unlockedAchievements, unlockedBadges,
        // Computed
        todayTasks, completedToday, totalToday, completionPct, currentTodayStr,
        habitsWithProgress,
        // Actions
        addTask, completeTask, deleteTask,
        setTasksRaw, setHabitsRaw,
        toggleHabit, syncTaskToHabit,
        setQuitDate, setSettings, setOnboarded,
        notify, logEvent,
    }), [
        tasks, habits, settings, quitDate, smokeStats,
        onboarded, eventLog, notifications,
        unlockedAchievements, unlockedBadges,
        todayTasks, completedToday, totalToday, completionPct, currentTodayStr,
        habitsWithProgress,
        addTask, completeTask, deleteTask,
        setTasksRaw, setHabitsRaw,
        toggleHabit, syncTaskToHabit,
        setQuitDate, setSettings, setOnboarded,
        notify, logEvent
    ]);
}
