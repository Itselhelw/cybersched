import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wakeTime, sleepTime, gymDays, workHours, goals, energyType } = body;

  const prompt = `You are CyberSched, an elite AI life coach. Generate a detailed 7-day schedule for someone with these specifics:

- Wake time: ${wakeTime}
- Sleep time: ${sleepTime}  
- Gym days per week: ${gymDays}
- Work/study hours per day: ${workHours}
- Energy type: ${energyType}
- Current goals: ${goals}

Return ONLY a valid JSON object in this exact format, no other text:
{
  "week": [
    {
      "day": "Monday",
      "theme": "one word theme",
      "blocks": [
        { "time": "07:00", "duration": "45min", "activity": "activity name", "category": "body|mind|work|quit|fun", "notes": "brief tip" }
      ]
    }
  ],
  "weekInsight": "one sentence about this week's strategy"
}

Rules:
- Gym days must be spread out, not consecutive
- Always include quit-smoking support activities
- Balance all 5 categories across the week
- Hardest cognitive work goes in peak energy hours
- Keep entertainment blocks to 1.5h max per day`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cybersched.vercel.app',
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Strip markdown code fences if model wraps JSON in them
    const clean = content.replace(/```json|```/g, '').trim();
    const schedule = JSON.parse(clean);

    return NextResponse.json(schedule);
  } catch (err) {
    console.error('Schedule generation error:', err);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
