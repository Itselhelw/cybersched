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
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are CyberSched AI, a personal life coach embedded in a productivity app. You see the user's full app state and can control it.

CURRENT APP STATE:
${JSON.stringify(appState, null, 2)}

RESPONSE FORMAT — you MUST always respond with ONLY this JSON structure, nothing else:
{"message":"your response here","actions":[]}

AVAILABLE ACTIONS (add to actions array when needed):
- Add task: {"action":"ADD_TASK","task":{"name":"...","category":"body","time":"07:00"}}
- Complete task: {"action":"COMPLETE_TASK","taskName":"..."}
- Delete task: {"action":"DELETE_TASK","taskName":"..."}
- Clear done tasks: {"action":"CLEAR_DONE_TASKS"}
- Mark habit done: {"action":"COMPLETE_HABIT","habitId":"body"}
- Navigate: {"action":"NAVIGATE","section":"dashboard"}

CATEGORY VALUES: body, mind, work, quit, fun

COACHING RULES:
- Give detailed, specific advice based on their actual tasks and habits
- Reference their real streak numbers and completion rates
- When asked what to focus on, list their actual pending tasks
- Be motivating but direct
- Never say just "Done" — always give a full helpful response
- Keep responses under 3 sentences but make them count

IMPORTANT: Return ONLY the JSON object. No markdown. No explanation. No code fences.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
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
      const parsed = JSON.parse(content);
      // Ensure message is always a non-empty string
      if (!parsed.message || parsed.message.trim() === '') {
        parsed.message = 'Got it! Let me know if you need anything else.';
      }
      return NextResponse.json({
        message: parsed.message,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      });
    } catch {
      // If JSON parse fails, return the raw content as the message
      console.error('JSON parse failed, raw content:', content);
      return NextResponse.json({ message: content, actions: [] });
    }

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ message: 'Connection error. Check your internet and try again.', actions: [] });
  }
}
