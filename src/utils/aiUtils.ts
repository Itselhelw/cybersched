/**
 * Advanced AI Utilities for CyberSched
 * Builds context, generates summaries, and makes predictions
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
  estimatedTime?: number;
  actualTime?: number;
}

interface Habit {
  id: string;
  label: string;
  streak: number;
  todayDone: boolean;
  weekProgress: number;
}

interface Settings {
  name: string;
}

// ── CONTEXT BUILDER ──────────────────────────────────

export function buildAIContext(
  tasks: Task[],
  habits: Habit[],
  settings: Settings,
  smokeStats: { days: number },
  weeklyStats?: { completed: number; total: number }
) {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today);
  const todayDone = todayTasks.filter(t => t.done).length;

  // Calculate streaks
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  const habitsToday = habits.filter(h => h.todayDone).length;

  // Category breakdown
  const categories: Record<string, { done: number; total: number }> = {
    body: { done: 0, total: 0 },
    mind: { done: 0, total: 0 },
    work: { done: 0, total: 0 },
    quit: { done: 0, total: 0 },
    fun: { done: 0, total: 0 },
  };

  tasks.forEach(task => {
    if (categories[task.category]) {
      categories[task.category].total += 1;
      if (task.done) categories[task.category].done += 1;
    }
  });

  // Identify weak areas
  const weakAreas = Object.entries(categories)
    .filter(([_, stats]) => stats.total > 0 && stats.done / stats.total < 0.5)
    .map(([cat]) => cat);

  // High priority pending
  const highPending = tasks.filter(t => t.priority === 'high' && !t.done && t.date === today);

  return {
    userName: settings.name,
    today: {
      tasksCompleted: todayDone,
      tasksTotal: todayTasks.length,
      habitsCompleted: habitsToday,
      habitsTotal: habits.length,
      completionPercent: todayTasks.length > 0 ? Math.round((todayDone / todayTasks.length) * 100) : 0,
    },
    habits: {
      list: habits.map(h => ({
        name: h.label,
        streak: h.streak,
        weekProgress: h.weekProgress,
        doneToday: h.todayDone,
      })),
      bestStreak,
      averageStreak: Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length || 0),
    },
    categories,
    weakAreas,
    priorities: {
      highPending: highPending.map(t => t.name),
      overdue: tasks.filter(t => !t.done && t.date < today).map(t => t.name),
    },
    smokeFree: {
      days: smokeStats.days,
      milestone: smokeStats.days >= 90 ? '90-day goal reached! 🎉' : smokeStats.days >= 30 ? '30-day milestone passed!' : smokeStats.days >= 7 ? 'First week complete!': '',
    },
    weeklyStats,
  };
}

// ── WEEKLY SUMMARY GENERATOR ────────────────────────

export async function generateWeeklySummary(
  apiKey: string,
  context: ReturnType<typeof buildAIContext>
): Promise<{
  insights: string[];
  recommendations: string[];
  score: number;
  message: string;
}> {
  const systemPrompt = `You are an AI life coach analyzing weekly CyberSched data for ${context.userName}.

USER'S PROGRESS:
- Task completion: ${context.today.tasksCompleted}/${context.today.tasksTotal} today (${context.today.completionPercent}%)
- Habits: ${context.today.habitsCompleted}/${context.today.habitsTotal} completed today
- Best streak: ${context.habits.bestStreak} days
- Smoke-free: ${context.weeklyStats ? `${context.weeklyStats.completed}/${context.weeklyStats.total} days completed this week` : 'N/A'}

CATEGORY BREAKDOWN:
${Object.entries(context.categories)
  .map(([cat, stats]) => `- ${cat}: ${stats.done}/${stats.total}`)
  .join('\n')}

WEAK AREAS: ${context.weakAreas.length > 0 ? context.weakAreas.join(', ') : 'None identified'}
HIGH PRIORITY PENDING: ${context.priorities.highPending.length > 0 ? context.priorities.highPending.join(', ') : 'All caught up!'}

Provide a JSON response ONLY with this structure:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"],
  "score": 75,
  "message": "Your focused message here"
}

Be specific, reference actual data, and provide actionable advice.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return {
        insights: ['Great week ahead!'],
        recommendations: ['Keep up the momentum'],
        score: 75,
        message: 'Review your weekly progress.',
      };
    }

    return JSON.parse(content);
  } catch (err) {
    console.error('Summary generation failed:', err);
    return {
      insights: ['Review your weekly data'],
      recommendations: ['Focus on consistency'],
      score: 0,
      message: 'Check your progress manually.',
    };
  }
}

// ── PREDICTIVE SUGGESTIONS ──────────────────────────

export function generatePredictions(
  tasks: Task[],
  habits: Habit[],
  context: ReturnType<typeof buildAIContext>
): {
  suggestedTasks: { name: string; reason: string; priority: string }[];
  optimizationTips: string[];
  nextGoal: string;
} {
  const suggestions = {
    suggestedTasks: [] as { name: string; reason: string; priority: string }[],
    optimizationTips: [] as string[],
    nextGoal: '',
  };

  // Predict task needs based on patterns
  if (context.weeklyStats && context.weeklyStats.completed < context.weeklyStats.total * 0.7) {
    suggestions.suggestedTasks.push({
      name: 'Schedule fewer high-priority tasks today',
      reason: 'Your completion rate is below 70%',
      priority: 'high',
    });
  }

  // Predict habit needs
  const lowStreakHabits = habits.filter(h => h.streak < 5);
  if (lowStreakHabits.length > 0) {
    suggestions.suggestedTasks.push({
      name: `Focus on rebuilding: ${lowStreakHabits.map(h => h.label).join(', ')}`,
      reason: 'These habits need attention to build momentum',
      priority: 'medium',
    });
  }

  // Weak area suggestions
  if (context.weakAreas.length > 0) {
    const weakestArea = context.weakAreas[0];
    suggestions.optimizationTips.push(
      `Your ${weakestArea} category is at ${context.categories[weakestArea]?.done || 0}/${context.categories[weakestArea]?.total || 1}. Try adding one focused task tomorrow.`
    );
  }

  // Smoke-free milestone prediction
  if (context.smokeFree.days > 0) {
    const daysTo90 = 90 - context.smokeFree.days;
    if (daysTo90 > 0) {
      suggestions.nextGoal = `${daysTo90} days until 90-day goal!`;
    } else {
      suggestions.nextGoal = '🎉 90-day goal achieved! Maintain this momentum!';
    }
  }

  // Best streak prediction
  if (context.habits.bestStreak > 0) {
    suggestions.optimizationTips.push(
      `Your best streak is ${context.habits.bestStreak} days. Can you push one habit to ${context.habits.bestStreak + 7} days?`
    );
  }

  // Time optimization
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.done).length;
  if (highPriorityCount > 5) {
    suggestions.optimizationTips.push(
      'You have many high-priority tasks. Consider breaking them into smaller subtasks or spreading them across days.'
    );
  }

  return {
    suggestedTasks: suggestions.suggestedTasks.slice(0, 3),
    optimizationTips: suggestions.optimizationTips.slice(0, 2),
    nextGoal: suggestions.nextGoal,
  };
}

// ── TREND ANALYSIS ──────────────────────────────────

export function analyzeTrends(
  weeklyData: Array<{ day: string; completed: number; total: number }>
): {
  trend: 'improving' | 'declining' | 'stable';
  momentum: number;
  bestDay: string;
  worstDay: string;
} {
  const completionRates = weeklyData.map(d => (d.total > 0 ? d.completed / d.total : 0));
  const firstHalf = completionRates.slice(0, Math.floor(completionRates.length / 2));
  const secondHalf = completionRates.slice(Math.floor(completionRates.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (avgSecond > avgFirst + 0.1) trend = 'improving';
  if (avgSecond < avgFirst - 0.1) trend = 'declining';

  const momentum = Math.round((avgSecond - avgFirst) * 100);
  const bestDay = weeklyData.reduce((best, d) =>
    d.total > 0 && d.completed / d.total > (best.total > 0 ? best.completed / best.total : 0) ? d : best
  ).day;
  const worstDay = weeklyData.reduce((worst, d) =>
    d.total > 0 && d.completed / d.total < (worst.total > 0 ? worst.completed / worst.total : 1) ? d : worst
  ).day;

  return { trend, momentum, bestDay, worstDay };
}
