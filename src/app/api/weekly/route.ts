import { NextRequest, NextResponse } from 'next/server';
import { buildAIContext, generateWeeklySummary } from '@/utils/aiUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tasks = [], habits = [], name = 'Legend', smokeDays = 0, weeklyStats } = body;
    const key = process.env.GROQ_API_KEY;
    if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 });

    const context = buildAIContext(tasks, habits, { name }, { days: smokeDays }, weeklyStats);
    const summary = await generateWeeklySummary(key, context as any);
    return NextResponse.json(summary);
  } catch (err) {
    console.error('Weekly summary route error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
