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
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ message: 'Focus on the work. The results will follow.' });
    }

    try {
      // Clean the response
      let clean = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // Fix unterminated strings — truncate to last valid JSON
      const lastBrace = clean.lastIndexOf('}');
      if (lastBrace !== -1) {
        clean = clean.slice(0, lastBrace + 1);
      }

      // If it's just raw text and not JSON, this might still fail JSON.parse
      // but the user asked for this specific wrapper across all routes.
      try {
        const parsed = JSON.parse(clean);
        return NextResponse.json({ message: parsed.message || clean });
      } catch {
        return NextResponse.json({ message: content });
      }
    } catch (err) {
      console.error('Motivate parse failed:', err, 'Raw:', content);
      return NextResponse.json({ message: 'Focus on the work. The results will follow.' });
    }
  } catch {
    return NextResponse.json({ message: 'Every day smoke-free is a war won. Keep going.' });
  }
}
