import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wakeTime, sleepTime, gymDays, workHours, goals, energyType } = body;

  // Debug: confirm key is loaded
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'API key not found in environment. Check .env.local' }, { status: 500 });
  }

  const prompt = `You are CyberSched, an AI life coach. Generate a 7-day schedule for:
- Wake time: ${wakeTime}
- Sleep time: ${sleepTime}
- Gym days per week: ${gymDays}
- Work/study hours per day: ${workHours}
- Energy type: ${energyType}
- Goals: ${goals}

Return ONLY valid JSON, no markdown, no explanation, just the JSON object:
{
  "week": [
    {
      "day": "Monday",
      "theme": "Focus",
      "blocks": [
        { "time": "07:00", "duration": "45min", "activity": "Morning workout", "category": "body", "notes": "Start strong" }
      ]
    }
  ],
  "weekInsight": "One sentence strategy for this week."
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'CyberSched',
      },
      body: JSON.stringify({
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    // Debug: log full response to terminal
    console.log('OpenRouter status:', response.status);
    console.log('OpenRouter response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({ error: `OpenRouter error: ${data.error?.message || response.status}` }, { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: `Empty response. Full data: ${JSON.stringify(data)}` }, { status: 500 });
    }

    const clean = content.replace(/```json|```/g, '').trim();
    const schedule = JSON.parse(clean);
    return NextResponse.json(schedule);

  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: `Exception: ${err}` }, { status: 500 });
  }
}
