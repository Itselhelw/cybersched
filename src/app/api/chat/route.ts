import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, appState } = await req.json();
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const systemPrompt = `You are CyberSched AI — a personal life coach and app controller built into a productivity dashboard. You can both TALK to the user AND directly control their app.

CURRENT APP STATE:
${JSON.stringify(appState, null, 2)}

You can perform these ACTIONS by including them in your response:

TASK ACTIONS:
- Add task: { "action": "ADD_TASK", "task": { "name": "...", "category": "body|mind|work|quit|fun", "time": "HH:MM" } }
- Complete task: { "action": "COMPLETE_TASK", "taskName": "partial name match" }
- Delete task: { "action": "DELETE_TASK", "taskName": "partial name match" }
- Clear all done tasks: { "action": "CLEAR_DONE_TASKS" }

HABIT ACTIONS:
- Mark habit done: { "action": "COMPLETE_HABIT", "habitId": "body|mind|work|quit|fun" }
- Reset habit: { "action": "RESET_HABIT", "habitId": "..." }

SETTINGS ACTIONS:
- Update name: { "action": "UPDATE_SETTING", "key": "name", "value": "..." }
- Navigate to section: { "action": "NAVIGATE", "section": "dashboard|tasks|habits|stats|planner|english|settings" }

You MUST respond in this exact JSON format:
{
  "message": "Your conversational response here — be direct, coach-like, motivating",
  "actions": []
}

The actions array can have 0 or multiple actions.

Rules:
- Always respond in JSON
- Be concise and coach-like, never robotic
- If user says something vague like "I worked out", figure out which habit to mark done
- If user asks what they need to do, summarize their pending tasks
- If user is struggling, motivate them based on their actual streak data
- Never make up data — only use what's in the app state
- You can chain multiple actions in one response`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ message: 'Something went wrong.', actions: [] });

    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ message: 'I had trouble processing that. Try again.', actions: [] });
  }
}
