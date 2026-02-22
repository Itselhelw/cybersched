/**
 * Supabase Cloud Sync Service for CyberSched
 * Handles data synchronization, backup, and restore
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface CloudBackup {
  id?: string;
  userId: string;
  tasks: any[];
  habits: any[];
  settings: any;
  quitDate: string;
  timestamp: string;
  deviceName: string;
}

// ── AUTH FUNCTIONS ──────────────────────────────────

export async function signUpUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

// ── SYNC FUNCTIONS ──────────────────────────────────

export async function syncDataToCloud(backup: Omit<CloudBackup, 'id'>) {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase.from('backups').insert([
      {
        user_id: user.id,
        tasks: backup.tasks,
        habits: backup.habits,
        settings: backup.settings,
        quit_date: backup.quitDate,
        device_name: backup.deviceName,
        created_at: backup.timestamp,
      },
    ]);

    if (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Sync exception:', err);
    return { success: false, error: 'Sync failed' };
  }
}

export async function getLatestBackup() {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { success: false, error: 'Not authenticated', data: null };
  }

  try {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // No backup found
      return { success: true, data: null };
    }

    if (error) {
      console.error('Get backup error:', error);
      return { success: false, error: error.message, data: null };
    }

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        tasks: data.tasks,
        habits: data.habits,
        settings: data.settings,
        quitDate: data.quit_date,
        timestamp: data.created_at,
        deviceName: data.device_name,
      },
    };
  } catch (err) {
    console.error('Get backup exception:', err);
    return { success: false, error: 'Failed to fetch backup', data: null };
  }
}

export async function getAllBackups() {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { success: false, error: 'Not authenticated', data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get backups error:', error);
      return { success: false, error: error.message, data: [] };
    }

    return {
      success: true,
      data: data.map(d => ({
        id: d.id,
        userId: d.user_id,
        tasks: d.tasks,
        habits: d.habits,
        settings: d.settings,
        quitDate: d.quit_date,
        timestamp: d.created_at,
        deviceName: d.device_name,
      })),
    };
  } catch (err) {
    console.error('Get backups exception:', err);
    return { success: false, error: 'Failed to fetch backups', data: [] };
  }
}

export async function deleteBackup(backupId: string) {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { error } = await supabase.from('backups').delete().eq('id', backupId).eq('user_id', user.id);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Delete exception:', err);
    return { success: false, error: 'Failed to delete backup' };
  }
}

// ── REAL-TIME SYNC LISTENER ──────────────────────────

export function subscribeToChanges(userId: string, callback: (backup: CloudBackup) => void) {
  const subscription = supabase
    .channel(`user-backups:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'backups', filter: `user_id=eq.${userId}` }, payload => {
      if (payload.new) {
        const newBackup = payload.new as any;
        callback({
          id: newBackup.id,
          userId: newBackup.user_id,
          tasks: newBackup.tasks,
          habits: newBackup.habits,
          settings: newBackup.settings,
          quitDate: newBackup.quit_date,
          timestamp: newBackup.created_at,
          deviceName: newBackup.device_name,
        });
      }
    })
    .subscribe();

  return subscription;
}
