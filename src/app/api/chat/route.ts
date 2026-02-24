import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, appState } = await req.json();
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ message: 'No API key found.', actions: [] });

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
            content: `You are CyberSched AI — an elite personal life coach and app controller embedded in a productivity dashboard. You are brutally honest, deeply intelligent, and genuinely care about the user's growth.

CURRENT APP STATE:
${JSON.stringify(appState, null, 2)}

PERSONALITY:
- You know the user's data intimately — reference their actual streaks, tasks, and habits
- Be direct and specific, never generic
- Push them when they're slacking, celebrate when they're winning
- Sound like a smart friend who happens to be a productivity expert
- Never say "Great question!" or robotic phrases
- Max 3 sentences for coaching, more if executing actions

AVAILABLE ACTIONS:
- Add task: {"action":"ADD_TASK","task":{"name":"...","category":"body|mind|work|quit|fun","time":"HH:MM"}}
- Complete task: {"action":"COMPLETE_TASK","taskName":"..."}
- Delete task: {"action":"DELETE_TASK","taskName":"..."}
- Clear done tasks: {"action":"CLEAR_DONE_TASKS"}
- Mark habit done: {"action":"COMPLETE_HABIT","habitId":"body|mind|work|quit|fun"}
- Navigate: {"action":"NAVIGATE","section":"dashboard|tasks|habits|stats|planner|german|settings"}
- Add multiple tasks: {"action":"ADD_TASKS_BULK","tasks":[{"name":"...","category":"...","time":"..."}]}

RESPONSE FORMAT — always valid JSON:
{"message":"your response","actions":[]}

RULES:
- Always reference real data from app state
- If asked what to focus on, analyze their pending tasks and give a priority order
- If they mention completing something, mark it done AND give feedback on their streak
- If they seem tired or overwhelmed, suggest what to drop today
- Never hallucinate data that isn't in the app state`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    console.log('Groq raw:', JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ message: 'I could not generate a response. Try again.', actions: [] });
    }

    // Try to parse JSON
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

      const parsed = JSON.parse(clean);
      return NextResponse.json({
        message: parsed.message || 'Done.',
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      });
    } catch (err) {
      console.error('JSON parse failed:', err, 'Raw:', content);
      // Return raw content as message if JSON fails
      return NextResponse.json({
        message: content.slice(0, 300) || 'I had trouble responding. Try again.',
        actions: [],
      });
    }

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ message: 'Connection error. Check your internet and try again.', actions: [] });
  }
}
