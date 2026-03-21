'use client';

import React, { useState, useEffect, memo } from 'react';

interface Notification {
  id: string;
  type: 'task' | 'habit' | 'milestone' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  tasks: any[];
  habits: any[];
  settings: any;
}

/**
 * NotificationCenter: Manages and displays application notifications and reminders.
 * Wrapped in memo() to prevent redundant re-renders from the dashboard's per-second clock.
 */
const NotificationCenter = memo(function NotificationCenter({ tasks, habits, settings }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'tasks' | 'habits'>('all');
  const [showSettings, setShowSettings] = useState(false);

  const [reminderSettings, setReminderSettings] = useState({
    enableTaskReminders: true,
    enableHabitReminders: true,
    enableMilestoneNotifications: true,
    taskReminderTime: '09:00',
    habitReminderTime: '20:00',
    soundEnabled: true,
  });

  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem('cybersched-notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }

    // Load reminder settings
    const storedSettings = localStorage.getItem('cybersched-reminder-settings');
    if (storedSettings) {
      setReminderSettings(JSON.parse(storedSettings));
    }
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.setItem('cybersched-notifications', JSON.stringify([]));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('cybersched-reminder-settings', JSON.stringify(reminderSettings));
    setShowSettings(false);
  };

  // Add test notification
  const handleAddTestNotification = () => {
    const testNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: 'task',
      title: 'Morning Workout Ready! 💪',
      message: 'Time to complete your gym session.',
      timestamp: new Date().toTimeString().slice(0, 5),
      read: false,
    };
    setNotifications(prev => [testNotif, ...prev]);
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'tasks') return n.type === 'task';
    if (filter === 'habits') return n.type === 'habit';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'fixed',
          bottom: 100,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: showPanel ? 'var(--bg-card)' : 'var(--orange)',
          border: `2px solid ${showPanel ? 'var(--border-bright)' : 'var(--orange)'}`,
          color: showPanel ? 'var(--orange)' : '#000',
          fontSize: 22,
          cursor: 'pointer',
          zIndex: 450,
          boxShadow: '0 0 30px rgba(255,140,0,0.3)',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#ff3366',
              color: '#fff',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 28,
            width: 400,
            maxHeight: 600,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-bright)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 449,
            boxShadow: '0 0 60px rgba(255,140,0,0.1)',
            animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--orange)', letterSpacing: 2 }}>NOTIFICATIONS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{unreadCount} unread</div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ⚙️
            </button>
          </div>

          {/* Settings */}
          {showSettings && (
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', overflowY: 'auto', flex: 1 }}>
              <div className="input-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a0a0c0' }}>
                  <input
                    type="checkbox"
                    checked={reminderSettings.enableTaskReminders}
                    onChange={e => setReminderSettings(p => ({ ...p, enableTaskReminders: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  TASK REMINDERS
                </label>
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a0a0c0' }}>
                  <input
                    type="checkbox"
                    checked={reminderSettings.enableHabitReminders}
                    onChange={e => setReminderSettings(p => ({ ...p, enableHabitReminders: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  HABIT REMINDERS
                </label>
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a0a0c0' }}>
                  <input
                    type="checkbox"
                    checked={reminderSettings.enableMilestoneNotifications}
                    onChange={e => setReminderSettings(p => ({ ...p, enableMilestoneNotifications: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  MILESTONE ALERTS
                </label>
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a0a0c0' }}>
                  <input
                    type="checkbox"
                    checked={reminderSettings.soundEnabled}
                    onChange={e => setReminderSettings(p => ({ ...p, soundEnabled: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  SOUND ENABLED
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSaveSettings}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--cyan)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  SAVE
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  CLOSE
                </button>
              </div>

              <button
                onClick={handleAddTestNotification}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--orange)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  marginTop: 12,
                }}
              >
                + TEST NOTIFICATION
              </button>
            </div>
          )}

          {/* Filters */}
          {!showSettings && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'unread', 'tasks', 'habits'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: `1px solid ${filter === f ? 'var(--cyan)' : 'var(--border)'}`,
                    background: filter === f ? 'var(--cyan)15' : 'transparent',
                    color: filter === f ? 'var(--cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* Notifications List */}
          {!showSettings && (
            <>
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  No notifications
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                  {filtered.map(notif => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '12px',
                        background: notif.read ? 'transparent' : 'rgba(0,245,255,0.05)',
                        borderLeft: `3px solid ${notif.type === 'task' ? '#00ff88' : notif.type === 'habit' ? '#00f5ff' : '#ff8c00'}`,
                        marginBottom: 8,
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handleMarkAsRead(notif.id)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,245,255,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(0,245,255,0.05)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: notif.read ? 'var(--text-secondary)' : 'var(--cyan)' }}>
                            {notif.title}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                            {notif.message}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                            {notif.timestamp}
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDismiss(notif.id); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: 14,
                            cursor: 'pointer',
                            padding: '0 4px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
              {filtered.length > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--cyan)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    READ ALL
                  </button>
                  <button
                    onClick={handleClearAll}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'rgba(255,51,102,0.15)',
                      color: '#ff3366',
                      border: '1px solid #ff3366',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    CLEAR
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
});

export default NotificationCenter;
