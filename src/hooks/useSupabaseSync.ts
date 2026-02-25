import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Generate or retrieve permanent user ID
function getUserId(): string {
    let id = typeof window !== 'undefined' ? localStorage.getItem('cs-user-id') : null;
    if (!id && typeof window !== 'undefined') {
        id = crypto.randomUUID();
        localStorage.setItem('cs-user-id', id);
    }
    return id || '';
}

export function useSupabaseSync() {
    const [userId, setUserId] = useState<string>('');
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string>('');
    const [syncError, setSyncError] = useState<string>('');

    useEffect(() => {
        const id = getUserId();
        if (id) {
            setUserId(id);
            ensureUserExists(id);
        }
    }, []);

    async function ensureUserExists(id: string) {
        try {
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('id', id)
                .single();

            if (!data) {
                await supabase.from('users').insert({
                    id,
                    device_name: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) : 'Server',
                });
            }
        } catch (err) {
            console.error('Ensure user exists error:', err);
        }
    }

    // ── TASKS ─────────────────────────────────────────────
    async function syncTasks(tasks: unknown[]) {
        if (!userId) return;
        setSyncing(true);
        try {
            // Delete all existing tasks for user and re-insert
            await supabase.from('tasks').delete().eq('user_id', userId);
            if (tasks.length > 0) {
                await supabase.from('tasks').insert(
                    tasks.map((t: unknown) => ({ ...(t as object), user_id: userId }))
                );
            }
            setLastSync(new Date().toTimeString().slice(0, 5));
            setSyncError('');
        } catch (err) {
            setSyncError('Sync failed — working offline');
            console.error('Task sync error:', err);
        } finally {
            setSyncing(false);
        }
    }

    async function loadTasks() {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('time', { ascending: true });
        if (error) { console.error(error); return []; }
        return data || [];
    }

    // ── HABITS ────────────────────────────────────────────
    async function syncHabits(habits: unknown[]) {
        if (!userId) return;
        setSyncing(true);
        try {
            for (const habit of habits as Record<string, unknown>[]) {
                await supabase.from('habits').upsert({
                    user_id: userId,
                    habit_key: habit.id,
                    label: habit.label,
                    icon: habit.icon,
                    color: habit.color,
                    streak: habit.streak,
                    best_streak: habit.bestStreak,
                    today_done: habit.todayDone,
                    week_progress: habit.weekProgress,
                    total_days: habit.totalDays,
                    last_done: habit.lastDone || '',
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,habit_key' });
            }
            setLastSync(new Date().toTimeString().slice(0, 5));
            setSyncError('');
        } catch (err) {
            setSyncError('Sync failed — working offline');
            console.error('Habit sync error:', err);
        } finally {
            setSyncing(false);
        }
    }

    async function loadHabits() {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId);
        if (error) { console.error(error); return []; }
        return (data || []).map(h => ({
            id: h.habit_key,
            label: h.label,
            icon: h.icon,
            color: h.color,
            streak: h.streak,
            bestStreak: h.best_streak,
            todayDone: h.today_done,
            weekProgress: h.week_progress,
            totalDays: h.total_days,
            lastDone: h.last_done,
        }));
    }

    // ── SETTINGS ──────────────────────────────────────────
    async function syncSettings(settings: Record<string, unknown>, quitDate: string) {
        if (!userId) return;
        try {
            await supabase.from('settings').upsert({
                user_id: userId,
                name: settings.name,
                cigarettes_per_day: settings.cigarettesPerDay,
                cost_per_pack: settings.costPerPack,
                cigarettes_per_pack: settings.cigarettesPerPack,
                currency: settings.currency,
                quit_date: quitDate,
                goals: settings.goals,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
            setSyncError('');
        } catch (err) {
            console.error('Settings sync error:', err);
        }
    }

    async function loadSettings() {
        if (!userId) return null;
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) { return null; }
        return data;
    }

    // ── AI MEMORY ─────────────────────────────────────────
    async function saveAIMessage(role: string, content: string) {
        if (!userId) return;
        await supabase.from('ai_memory').insert({
            user_id: userId,
            role,
            content,
        });
    }

    async function loadAIMemory(limit = 20) {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('ai_memory')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) { return []; }
        return (data || []).reverse().map(m => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at).toTimeString().slice(0, 5),
        }));
    }

    async function clearAIMemory() {
        if (!userId) return;
        await supabase.from('ai_memory').delete().eq('user_id', userId);
    }

    // ── WEEKLY SCHEDULE ───────────────────────────────────
    async function syncSchedule(schedule: unknown) {
        if (!userId) return;
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];

        await supabase.from('weekly_schedule').upsert({
            user_id: userId,
            schedule_json: schedule,
            week_start: weekStartStr,
        }, { onConflict: 'user_id' });
    }

    async function loadSchedule() {
        if (!userId) return null;
        const { data } = await supabase
            .from('weekly_schedule')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        return data?.schedule_json || null;
    }

    return {
        userId,
        syncing,
        lastSync,
        syncError,
        syncTasks, loadTasks,
        syncHabits, loadHabits,
        syncSettings, loadSettings,
        saveAIMessage, loadAIMemory, clearAIMemory,
        syncSchedule, loadSchedule,
    };
}
