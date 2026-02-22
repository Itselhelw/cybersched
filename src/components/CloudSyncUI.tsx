'use client';

import { useState, useEffect } from 'react';
import { supabase, getCurrentUser, signUpUser, signInUser, signOutUser, syncDataToCloud, getLatestBackup, getAllBackups, deleteBackup, type CloudBackup } from '@/services/syncService';

interface CloudSyncProps {
  tasks: any[];
  habits: any[];
  settings: any;
  quitDate: string;
  onRestore?: (tasks: any[], habits: any[], settings: any, quitDate: string) => void;
}

export default function CloudSyncUI({ tasks, habits, settings, quitDate, onRestore }: CloudSyncProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setsyncing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [syncStatus, setSyncStatus] = useState('');
  const [autoSync, setAutoSync] = useState(localStorage.getItem('cybersched-autosync') === 'true');
  const [backups, setBackups] = useState<CloudBackup[]>([]);
  const [showBackups, setShowBackups] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    const checkUser = async () => {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        fetchBackups();
      }
    };
    checkUser();
  }, []);

  // Auto-sync when data changes
  useEffect(() => {
    if (autoSync && user) {
      const timer = setTimeout(() => {
        handleSync();
      }, 5000); // Sync 5 seconds after last change
      return () => clearTimeout(timer);
    }
  }, [tasks, habits, settings, quitDate, autoSync, user]);

  const fetchBackups = async () => {
    const { data, success } = await getAllBackups();
    if (success) {
      setBackups(data || []);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (authMode === 'signup') {
        result = await signUpUser(email, password);
      } else {
        result = await signInUser(email, password);
      }

      if (result.error) {
        setSyncStatus(`Error: ${result.error.message}`);
      } else {
        setUser(result.data.user);
        setEmail('');
        setPassword('');
        setSyncStatus(`✓ ${authMode === 'signup' ? 'Account created' : 'Signed in'}`);
      }
    } catch (err) {
      setSyncStatus('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOutUser();
    if (!error) {
      setUser(null);
      setSyncStatus('Signed out');
    }
  };

  const handleSync = async () => {
    if (!user) {
      setSyncStatus('Error: Not authenticated');
      return;
    }

    setsyncing(true);
    setSyncStatus('Syncing...');

    const backup: Omit<CloudBackup, 'id'> = {
      userId: user.id,
      tasks,
      habits,
      settings,
      quitDate: quitDate || '',
      timestamp: new Date().toISOString(),
      deviceName: navigator.userAgent.split(' ').slice(-1)[0],
    };

    const { success, error } = await syncDataToCloud(backup);

    if (success) {
      setSyncStatus('✓ Synced to cloud');
      fetchBackups();
    } else {
      setSyncStatus(`✗ Sync failed: ${error}`);
    }

    setsyncing(false);
  };

  const handleRestore = async (backup: CloudBackup) => {
    if (onRestore) {
      onRestore(backup.tasks, backup.habits, backup.settings, backup.quitDate);
      setSyncStatus(`✓ Restored from ${new Date(backup.timestamp).toLocaleDateString()}`);
      setShowBackups(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    const { success } = await deleteBackup(backupId);
    if (success) {
      fetchBackups();
      setSyncStatus('✓ Backup deleted');
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('cybersched-autosync', newValue ? 'true' : 'false');
    setSyncStatus(newValue ? '✓ Auto-sync enabled' : '✓ Auto-sync disabled');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Auth Section */}
      {!user ? (
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">// Cloud Sync Setup</div>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">EMAIL</label>
              <input
                className="input-field"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">PASSWORD</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: authMode === 'login' ? 'linear-gradient(135deg, #00f5ff, #0099cc)' : 'linear-gradient(135deg, #00ff88, #00cc6a)',
                  color: '#0a0a1a',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '...' : authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              style={{
                background: 'transparent',
                color: '#00f5ff',
                border: '1px solid #00f5ff',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              {authMode === 'login' ? 'Create Account Instead' : 'Sign In Instead'}
            </button>
          </form>

          {syncStatus && (
            <div style={{ marginTop: 12, padding: 8, background: syncStatus.includes('✓') ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', borderRadius: 4, color: syncStatus.includes('✓') ? '#00ff88' : '#ff3366', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              {syncStatus}
            </div>
          )}
        </div>
      ) : (
        // Sync Controls
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">// Cloud Sync Active</div>
            <span style={{ color: '#00ff88', fontSize: 12, fontFamily: 'var(--font-mono)' }}>✓ {user.email}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #00f5ff, #0099cc)',
                color: '#0a0a1a',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: syncing ? 'default' : 'pointer',
                opacity: syncing ? 0.6 : 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
              }}
            >
              {syncing ? '⏳ SYNCING...' : '☁️ SYNC NOW'}
            </button>

            <button
              onClick={toggleAutoSync}
              style={{
                padding: '12px 16px',
                background: autoSync ? 'linear-gradient(135deg, #00ff88, #00cc6a)' : 'rgba(0,255,136,0.1)',
                color: autoSync ? '#0a0a1a' : '#00ff88',
                border: autoSync ? 'none' : '1px solid #00ff88',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
              }}
            >
              {autoSync ? '✓ AUTO-SYNC ON' : 'AUTO-SYNC OFF'}
            </button>

            <button
              onClick={() => setShowBackups(!showBackups)}
              style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #ff8c00, #ff6600)',
                color: '#0a0a1a',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
              }}
            >
              📋 {backups.length} BACKUPS
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '12px 16px',
                background: 'rgba(255,51,102,0.1)',
                color: '#ff3366',
                border: '1px solid #ff3366',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
              }}
            >
              SIGN OUT
            </button>
          </div>

          {syncStatus && (
            <div style={{ padding: 8, background: syncStatus.includes('✓') ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', borderRadius: 4, color: syncStatus.includes('✓') ? '#00ff88' : '#ff3366', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              {syncStatus}
            </div>
          )}
        </div>
      )}

      {/* Backups List */}
      {showBackups && user && backups.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">// Backup History</div>
            <span style={{ color: '#00f5ff', fontSize: 12 }}>{backups.length} backups</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {backups.map((backup, idx) => (
              <div key={backup.id} style={{ padding: 12, background: 'rgba(0,245,255,0.05)', borderRadius: 8, borderLeft: '3px solid #00f5ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#a0a0c0' }}>#{idx + 1} — {backup.deviceName}</div>
                    <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>{new Date(backup.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleRestore(backup)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                      color: '#0a0a1a',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    RESTORE
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(backup.id!)}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255,51,102,0.1)',
                      color: '#ff3366',
                      border: '1px solid #ff3366',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
