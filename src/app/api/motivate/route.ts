import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, smokeDays, gymStreak, completionPct, goals } = await req.json();
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const prompt = `You are CyberSched, a brutal but caring AI life coach. Write a short daily motivational message for ${name}.

Their stats today:
- Smoke free: ${smokeDays} days
- Gym streak: ${gymStreak} days  
- Task completion: ${completionPct}%
- Their goals: ${goals || 'become the best version of themselves'}

Rules:
- Max 2 sentences
- Be direct, specific to their stats, not generic
- Reference actual numbers when impressive
- If stats are low, push them hard but with belief
- Tone: like a coach who genuinely believes in them
- No emojis
- Return ONLY the message text, nothing else`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 100,
      }),
    });
    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ message: message || 'Show up today. That is enough.' });
  } catch {
    return NextResponse.json({ message: 'Every day smoke-free is a war won. Keep going.' });
  }
}
