import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, smokeDays, gymStreak, completionPct, goals } = await req.json();
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 });


  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a world-class life coach — part Navy SEAL mental trainer, part sports psychologist. You know exactly what to say to push someone forward without breaking them.

USER DATA:
- Name: ${name}
- Days smoke-free: ${smokeDays}
- Gym streak: ${gymStreak} days
- Task completion: ${completionPct}%
- Goals: ${goals}

Write exactly 2 sentences of personalized motivation:
- Sentence 1: Reference one specific stat and reframe it powerfully
- Sentence 2: Give one precise action they should take in the next 60 minutes

Rules:
- No emojis
- No generic phrases like "keep going" or "you got this"
- Sound like someone who genuinely knows them
- Be specific to their numbers
- If completion is low, be direct about it without being cruel
- If streaks are high, raise the bar for them

Respond with ONLY the two sentences, nothing else.`,
          },
          { role: 'user', content: 'Give me my daily push.' },
        ],
        temperature: 0.9,
        max_tokens: 150,
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
