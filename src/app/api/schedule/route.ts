import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wakeTime, sleepTime, gymDays, workHours, goals, energyType, germanMonth } = body;

  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'GROQ_API_KEY not configured on server' }, { status: 500 });



  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an elite weekly schedule architect. You create highly optimized, realistic weekly schedules that balance productivity with recovery and prevent burnout.

USER PROFILE:
- Wake time: ${wakeTime}
- Sleep time: ${sleepTime}  
- Energy type: ${energyType}
- Work hours per day: ${workHours}
- Gym days per week: ${gymDays}
- Goals: ${goals}

SCHEDULING PRINCIPLES:
1. Respect biological rhythms — hardest tasks when energy peaks
2. Never schedule back-to-back heavy focus blocks without a break
3. Every day needs at least 60 min of genuine free time
4. Gym days should have lighter mental load
5. Distribute goals evenly — no topic two days in a row
6. Build in buffer time — life happens
7. Sunday is for preparation, not exhaustion

OUTPUT — respond with ONLY this exact JSON structure:
{
  "schedule": [
    {
      "day": "Monday",
      "blocks": [
        {
          "time": "09:00",
          "activity": "specific activity name",
          "category": "body|mind|work|quit|fun",
          "duration": 60,
          "notes": "why this is scheduled here"
        }
      ]
    }
  ]
}

Rules:
- Use 24-hour time format
- Every block needs a specific activity name, not generic labels
- Notes should explain the scheduling decision
- Include 7 days: Monday through Sunday
- Minimum 4 blocks per day, maximum 7
- Always include meals, breaks, and transition time`,
          },
          {
            role: 'user',
            content: 'Generate my highly optimized weekly schedule now based on these rules.',
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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

    try {
      let clean = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // Truncate to last valid closing brace if response was cut off
      const lastBrace = clean.lastIndexOf('}');
      const lastBracket = clean.lastIndexOf(']');
      const lastValid = Math.max(lastBrace, lastBracket);
      if (lastValid !== -1) clean = clean.slice(0, lastValid + 1);

      // Fix trailing comma issues
      clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      const parsed = JSON.parse(clean);
      // Normalize: LLM returns { schedule: [...] } but frontend expects { week: [...] }
      const normalized = {
        week: parsed.week || parsed.schedule || [],
        weekInsight: parsed.weekInsight || '',
      };
      return NextResponse.json(normalized);
    } catch (err) {
      console.error('Schedule parse error:', err);
      return NextResponse.json({
        error: 'Failed to parse schedule. Try generating again.',
        raw: content?.slice(0, 500),
      }, { status: 500 });
    }

  } catch (err) {
    console.error('Schedule error:', err);
    return NextResponse.json({ error: `Failed: ${err}` }, { status: 500 });
  }
}
