import { useLocalStorage } from './useLocalStorage';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { checkAchievements, calculateDailyPoints, type Achievement } from '@/utils/gamificationUtils';

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
    isCustom?: boolean;
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

function calcWeekProgress(category: Category, weekDates: string[], doneTaskMap: Set<string>): number {
    const daysWithTask = weekDates.filter(date =>
        doneTaskMap.has(`${category}:${date}`)
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
    // Memoize the daily timestamp to stabilize callbacks and effects
    const dailyTimestamp = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : 0;

    // Memoize static markers to avoid O(N) recalculations on every render
    const weekDates = useMemo(() => {
        if (!dailyTimestamp) return [];
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(dailyTimestamp);
            d.setDate(d.getDate() - d.getDay() + i);
            return d.toISOString().split('T')[0];
        });
    }, [dailyTimestamp]);

    const doneTaskMap = useMemo(() =>
        new Set(tasks.filter(t => t.done).map(t => `${t.category}:${t.date}`)),
        [tasks]
    );

    const syncTasksToHabits = useCallback(() => {
        if (!dailyTimestamp || weekDates.length === 0) return;
        const currentToday = todayStr(new Date(dailyTimestamp));

        // Update habits based on current tasks - consolidated into single pass
        setHabitsRaw(prev => prev.map(h => {
            const category = h.id as Category;
            const weekProgress = calcWeekProgress(category, weekDates, doneTaskMap);

            const wasAlreadyDone = h.todayDone;
            const todayDone = doneTaskMap.has(`${category}:${currentToday}`);

            // Streak and total days logic - maintained with O(1) lookups
            let newStreak = h.streak;
            if (todayDone && !wasAlreadyDone) {
                newStreak = h.streak + 1;
            } else if (!todayDone && wasAlreadyDone) {
                newStreak = Math.max(0, h.streak - 1);
            }

            const bestStreak = Math.max(newStreak, h.bestStreak);
            const totalDays = todayDone && !wasAlreadyDone ? h.totalDays + 1 :
                             (!todayDone && wasAlreadyDone ? Math.max(0, h.totalDays - 1) : h.totalDays);

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
    }, [dailyTimestamp, weekDates, doneTaskMap, setHabitsRaw]);

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

    // Sync effect when tasks change - only sync when tasks or day changes
    useEffect(() => {
        if (!dailyTimestamp) return;
        syncTasksToHabits();
    }, [tasks, dailyTimestamp, syncTasksToHabits]);

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
    // Memoize smoke stats by minute to prevent unnecessary re-renders every second
    const smokeStats: SmokeStats = useMemo(() => {
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
    }, [quitDate, now ? Math.floor(now.getTime() / 60000) : null, settings.cigarettesPerDay, settings.costPerPack, settings.cigarettesPerPack]);

    // ── COMPUTED STATS ────────────────────────────────────────────
    // Memoize current today string by date
    const currentTodayStr = useMemo(() => todayStr(now), [now ? todayStr(now) : '']);

    const todayTasks = useMemo(() =>
        tasks
            .filter(t => t.date === currentTodayStr || (currentTodayStr === '' && t.date === ''))
            .sort((a, b) => a.time.localeCompare(b.time)),
        [tasks, currentTodayStr]
    );

    const { completedToday, totalToday, completionPct } = useMemo(() => {
        const completed = todayTasks.filter(t => t.done).length;
        const total = todayTasks.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completedToday: completed, totalToday: total, completionPct: pct };
    }, [todayTasks]);

    // Optimized habit progress calculation using memoized markers
    const habitsWithProgress = useMemo(() => {
        if (!now || weekDates.length === 0) return habits;

        return habits.map(h => ({
            ...h,
            weekProgress: calcWeekProgress(h.id as Category, weekDates, doneTaskMap),
        }));
    }, [habits, weekDates, doneTaskMap]);

    // Dashboard metrics memoized to prevent recalculation on every clock tick
    const dailyScore = useMemo(() =>
        calculateDailyPoints(
            completedToday,
            habitsWithProgress.filter(h => h.todayDone).length,
            habitsWithProgress.filter(h => h.streak > 0).length
        ),
        [completedToday, habitsWithProgress]
    );

    const bestStreak = useMemo(() =>
        habitsWithProgress.length > 0 ? Math.max(...habitsWithProgress.map(h => h.streak)) : 0,
        [habitsWithProgress]
    );

    const weeklyScore = useMemo(() => {
        const weeklyStats = { completed: completedToday, total: totalToday || 1 };
        return weeklyStats.completed + bestStreak * 25 + (habitsWithProgress.filter(h => h.weekProgress > 50).length * 50);
    }, [completedToday, totalToday, bestStreak, habitsWithProgress]);

    // ── ACHIEVEMENT SYSTEM ────────────────────────────────────────
    // Only run when meaningful state changes (tasks, habits, or day changes), not every second
    useEffect(() => {
        if (!dailyTimestamp) return;
        const newAchievements = checkAchievements(tasks, habits, smokeStats, unlockedAchievements);
        if (newAchievements.length > unlockedAchievements.length) {
            setUnlockedAchievements(newAchievements);
            const latest = newAchievements[newAchievements.length - 1];
            notify(`🏆 Achievement Unlocked: ${latest.name}`, 'var(--orange)');
        }
    }, [tasks, habits, smokeStats.days, unlockedAchievements, setUnlockedAchievements, notify, dailyTimestamp]);

    // ── STABILIZE APP OBJECT ──────────────────────────────────────
    return useMemo(() => ({
        // State
        tasks, habits, settings, quitDate, smokeStats,
        onboarded, eventLog, notifications,
        unlockedAchievements, unlockedBadges,
        // Computed
        todayTasks, completedToday, totalToday, completionPct, currentTodayStr,
        habitsWithProgress, dailyScore, bestStreak, weeklyScore,
        // Actions
        addTask, completeTask, deleteTask,
        setTasksRaw, setHabitsRaw,
        toggleHabit, syncTasksToHabits,
        setQuitDate, setSettings, setOnboarded,
        notify, logEvent,
    }), [
        tasks, habits, settings, quitDate, smokeStats,
        onboarded, eventLog, notifications,
        unlockedAchievements, unlockedBadges,
        todayTasks, completedToday, totalToday, completionPct, currentTodayStr,
        habitsWithProgress, dailyScore, bestStreak, weeklyScore,
        addTask, completeTask, deleteTask,
        setTasksRaw, setHabitsRaw,
        toggleHabit, syncTasksToHabits,
        setQuitDate, setSettings, setOnboarded,
        notify, logEvent
    ]);
}
