/**
 * Gamification System for CyberSched
 * Awards, badges, achievements, points, and leaderboard
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: string; // ISO date when achieved
}

export interface Badge {
  id: string;
  name: string;
  condition: string; // Description of how to earn
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
}

export const ACHIEVEMENTS = [
  { id: 'first-task', name: 'Task Master', description: 'Complete your first task', icon: '✅', points: 10 },
  { id: 'week-streak', name: '7-Day Streak', description: 'Maintain a 7-day habit streak', icon: '🔥', points: 50 },
  { id: 'month-streak', name: '30-Day Streak', description: 'Maintain any habit for 30 days', icon: '🎯', points: 100 },
  { id: 'smoke-free-week', name: 'Smoke-Free Week', description: 'Stay smoke-free for 7 days', icon: '🚭', points: 100 },
  { id: 'all-habits', name: 'All Clear', description: 'Complete all habits in one day', icon: '✨', points: 75 },
  { id: 'early-bird', name: 'Early Bird', description: 'Complete tasks before 9 AM', icon: '🌅', points: 25 },
  { id: 'night-owl', name: 'Night Owl', description: 'Complete tasks after 8 PM', icon: '🌙', points: 25 },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Achieve 100% completion for a week', icon: '💯', points: 150 },
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Complete 5 fun category tasks', icon: '🦋', points: 50 },
  { id: 'mind-over-matter', name: 'Mind Over Matter', description: 'Complete 10 mind category tasks', icon: '🧠', points: 50 },
];

export const BADGES = [
  {
    id: 'starter',
    name: 'Starter',
    condition: 'Create your first habit',
    icon: '🌱',
    color: '#00ff88',
    rarity: 'common' as const,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    condition: '21-day streak on any habit',
    icon: '🎖️',
    color: '#00f5ff',
    rarity: 'rare' as const,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    condition: '66-day streak on any habit',
    icon: '⚡',
    color: '#ff8c00',
    rarity: 'epic' as const,
  },
  {
    id: 'legendary',
    name: 'Legendary',
    condition: '100-day streak on any habit',
    icon: '👑',
    color: '#fbbf24',
    rarity: 'legendary' as const,
  },
  {
    id: 'multi-tasker',
    name: 'Multi-Tasker',
    condition: 'Have 5 active habits',
    icon: '🎯',
    color: '#34d399',
    rarity: 'rare' as const,
  },
  {
    id: 'collector',
    name: 'Collector',
    condition: 'Earn 10 achievements',
    icon: '🏆',
    color: '#a78bfa',
    rarity: 'epic' as const,
  },
];

// ── POINTS AND SCORING ──────────────────────────────

export function calculateDailyPoints(
  tasksCompleted: number,
  habitsCompleted: number,
  streakBonusHabits: number
): number {
  const taskPoints = tasksCompleted * 10; // 10 points per task
  const habitPoints = habitsCompleted * 50; // 50 points per habit
  const streakBonus = streakBonusHabits * 25; // 25 bonus per streak maintained

  return taskPoints + habitPoints + streakBonus;
}

export function calculateWeeklyLeaderboardScore(
  weeklyTaskCompletion: number,
  bestStreak: number,
  habitsCompleted: number
): number {
  const completionScore = weeklyTaskCompletion * 2; // 2 points per %
  const streakScore = bestStreak * 10; // 10 points per day of streak
  const habitScore = habitsCompleted * 100; // 100 points per habit type

  return completionScore + streakScore + habitScore;
}

// ── ACHIEVEMENT UNLOCKING ──────────────────────────

export function checkAchievements(
  tasks: any[],
  habits: any[],
  smokeStats: any,
  unlockedAchievements: Achievement[]
): Achievement[] {
  const newly = [...unlockedAchievements];
  const now = new Date().toISOString().split('T')[0];

  // Check first task
  if (tasks.some(t => t.done) && !newly.find(a => a.id === 'first-task')) {
    newly.push({ ...ACHIEVEMENTS[0], unlockedAt: now });
  }

  // Check 7-day streak
  const maxStreak = Math.max(...habits.map(h => h.streak), 0);
  if (maxStreak >= 7 && !newly.find(a => a.id === 'week-streak')) {
    newly.push({ ...ACHIEVEMENTS[1], unlockedAt: now });
  }

  // Check 30-day streak
  if (maxStreak >= 30 && !newly.find(a => a.id === 'month-streak')) {
    newly.push({ ...ACHIEVEMENTS[2], unlockedAt: now });
  }

  // Check smoke-free week
  if (smokeStats.days >= 7 && !newly.find(a => a.id === 'smoke-free-week')) {
    newly.push({ ...ACHIEVEMENTS[3], unlockedAt: now });
  }

  // Check all habits done today
  if (habits.every(h => h.todayDone) && !newly.find(a => a.id === 'all-habits')) {
    newly.push({ ...ACHIEVEMENTS[4], unlockedAt: now });
  }

  return newly;
}

// ── LEADERBOARD ────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  streak: number;
  habitsCompleted: number;
  achievements: number;
}

export function buildPersonalLeaderboard(
  currentName: string,
  currentScore: number,
  currentStreak: number,
  habitsCompleted: number,
  achievements: number
): LeaderboardEntry[] {
  // Generate historical self data (how you've improved)
  const historical: LeaderboardEntry[] = [
    { rank: 1, name: `${currentName} (Today)`, score: currentScore, streak: currentStreak, habitsCompleted, achievements },
    { rank: 2, name: `${currentName} (This Week)`, score: Math.max(0, currentScore - 200), streak: Math.max(0, currentStreak - 1), habitsCompleted, achievements },
    { rank: 3, name: `${currentName} (Last Week)`, score: Math.max(0, currentScore - 500), streak: Math.max(0, currentStreak - 5), habitsCompleted, achievements },
    { rank: 4, name: `${currentName} (Month Ago)`, score: Math.max(0, currentScore - 1500), streak: Math.max(0, currentStreak - 15), habitsCompleted, achievements },
    { rank: 5, name: `${currentName} (Started)`, score: 0, streak: 0, habitsCompleted: 0, achievements: 0 },
  ];

  return historical;
}

// ── UNLOCKABLES ────────────────────────────────────

export function getProgressToNextMilestone(
  currentStreak: number
): { nextMilestone: number; progress: number; label: string } {
  const milestones = [7, 21, 66, 100, 365];
  const next = milestones.find(m => m > currentStreak) || 365;
  const prev = milestones.filter(m => m <= currentStreak).pop() || 0;

  const progress = Math.round(((currentStreak - prev) / (next - prev)) * 100);

  return {
    nextMilestone: next,
    progress,
    label: `${currentStreak}/${next} days (${progress}%)`,
  };
}

export function getRewardsForMilestone(days: number): { name: string; reward: string }[] {
  const rewards: Record<number, { name: string; reward: string }[]> = {
    7: [{ name: '7-Day Streak', reward: '🏅 Weekly Warrior Badge' }],
    21: [{ name: '21-Day Streak', reward: '🎖️ Dedicated Badge + 100 points' }],
    66: [{ name: '66-Day Streak', reward: '⚡ Unstoppable Badge + 250 points' }],
    100: [{ name: '100-Day Streak', reward: '👑 Legendary Badge + 500 points' }],
    365: [{ name: 'One Year!', reward: '🌟 Immortal Badge + 1000 points + Hall of Fame' }],
  };

  return rewards[days] || [];
}
