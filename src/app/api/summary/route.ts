import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { context } = await req.json();
  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return NextResponse.json({ error: 'No API key found' }, { status: 500 });
  }

  const systemPrompt = `You are an AI life coach analyzing weekly CyberSched data for ${context.userName}.

USER'S PROGRESS THIS WEEK:
- Task completion: ${context.weeklyStats ? `${context.weeklyStats.completed}/${context.weeklyStats.total} days` : 'Pending'}
- Habits: ${context.today.habitsCompleted}/${context.today.habitsTotal} completed today, Best streak: ${context.habits.bestStreak} days
- Smoke-free: ${context.smokeFree.days} days
- Overall week score: Approximately ${Math.round((context.weeklyStats?.completed || 0) / (context.weeklyStats?.total || 1) * 100)}%

CATEGORY BREAKDOWN:
${Object.entries(context.categories)
  .map(([cat, stats]: [string, any]) => {
    const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    return `- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${stats.done}/${stats.total} (${pct}%)`;
  })
  .join('\n')}

WEAK AREAS: ${context.weakAreas && context.weakAreas.length > 0 ? context.weakAreas.join(', ') : 'None - excellent balance!'}

RESPOND WITH VALID JSON ONLY:
{
  "insights": [
    "specific insight 1 referencing actual data",
    "specific insight 2 about their progress",
    "specific insight 3 with pattern analysis"
  ],
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2",
    "actionable recommendation 3"
  ],
  "score": 85,
  "message": "Your one-sentence summary of the week"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
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
      return NextResponse.json({
        insights: ['Great week ahead!'],
        recommendations: ['Keep up the momentum'],
        score: 75,
        message: 'Review your weekly progress.',
      });
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        insights: ['Your data shows good progress'],
        recommendations: ['Continue with consistent effort'],
        score: 70,
        message: 'Strong execution this week.',
      });
    }
  } catch (err) {
    console.error('Summary error:', err);
    return NextResponse.json({
      insights: ['Review your weekly data'],
      recommendations: ['Focus on consistency'],
      score: 0,
      message: 'Check your progress manually.',
    });
  }
}
