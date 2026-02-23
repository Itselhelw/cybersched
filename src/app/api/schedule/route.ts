import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wakeTime, sleepTime, gymDays, workHours, goals, energyType, germanMonth } = body;

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'GROQ_API_KEY not found in .env.local' }, { status: 500 });
  }

  const prompt = `You are CyberSched, an AI life coach. Generate a 7-day schedule for someone with these details:
- Wake time: ${wakeTime}
- Sleep time: ${sleepTime}
- Gym days per week: ${gymDays}
- Work/study hours per day: ${workHours}
- Energy type: ${energyType}
- Goals: ${goals}
- German Learning Month: ${germanMonth || 1}

Return ONLY a valid JSON object. No markdown, no explanation, no code fences. Just raw JSON:
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
}

Rules:
- category must be one of: body, mind, work, quit, fun
- Spread gym days, never consecutive
- Always include quit-smoking support activities
- ALWAYS include exactly 2 German study blocks (45m each) per day
- Include all 7 days`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity AI. You only respond with valid JSON. Never use markdown code fences. Never add explanation text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();

    console.log('Groq status:', response.status);
    console.log('Groq response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({ error: `Groq error: ${data.error?.message || response.status}` }, { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty response from Groq' }, { status: 500 });
    }

    const clean = content.replace(/```json|```/g, '').trim();
    const schedule = JSON.parse(clean);
    return NextResponse.json(schedule);

  } catch (err) {
    console.error('Schedule error:', err);
    return NextResponse.json({ error: `Failed: ${err}` }, { status: 500 });
  }
}
