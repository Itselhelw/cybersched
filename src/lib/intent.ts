import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type Intent =
    | 'app_control'      // add task, mark habit, check progress
    | 'code_edit'        // change UI, add feature, fix bug
    | 'read_progress'    // where am I in German/Cyber
    | 'generate_schedule'// make my week plan
    | 'general'          // unrelated question
    | 'destructive'      // delete all, clear everything
    | 'deploy_status';   // check vercel/github status

export interface ClassifiedIntent {
    intent: Intent;
    confidence: number;
    extractedData: {
        taskName?: string;
        category?: string;
        time?: string;
        habitId?: string;
        filePath?: string;
        changeDescription?: string;
        isDestructive?: boolean;
    };
    requiresConfirmation: boolean;
}

export async function classifyIntent(message: string, appState: unknown): Promise<ClassifiedIntent> {
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `You are an intent classifier for a productivity app called CyberSched.
Classify the user message into one of these intents:
- app_control: adding/editing/deleting tasks or habits
- code_edit: requests to modify app code, UI, or features
- read_progress: asking about German or cybersecurity learning progress
- generate_schedule: asking to create a weekly schedule
- destructive: deleting all data, clearing everything
- deploy_status: asking about GitHub or Vercel deployment
- general: anything unrelated to the app

Current app state summary: ${JSON.stringify(appState, null, 2)}

Respond ONLY with this JSON:
{
  "intent": "one of the above",
  "confidence": 0.95,
  "extractedData": {
    "taskName": "extracted task name if applicable",
    "category": "body|mind|work|quit|fun if applicable",
    "time": "HH:MM if mentioned",
    "habitId": "habit id if applicable",
    "filePath": "file path if code edit",
    "changeDescription": "what should be changed",
    "isDestructive": false
  },
  "requiresConfirmation": false
}`,
            },
            { role: 'user', content: message },
        ],
    });

    const raw = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(raw);
    return {
        intent: parsed.intent || 'general',
        confidence: parsed.confidence || 0.5,
        extractedData: parsed.extractedData || {},
        requiresConfirmation: parsed.requiresConfirmation || parsed.extractedData?.isDestructive || false,
    };
}
