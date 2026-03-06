import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { sendTelegram, sendTelegramConfirmation, parseTelegramUpdate } from '@/lib/telegram';
import { classifyIntent } from '@/lib/intent';
import { getFile, updateFile, getRepoStructure, getLatestCommit } from '@/lib/github';

// Pending confirmations store (in-memory, resets on cold start)
const pendingConfirmations = new Map<string, {
    action: string;
    data: unknown;
    timestamp: number;
}>();


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const update = parseTelegramUpdate(body);
        if (!update) return NextResponse.json({ ok: true });

        // Handle confirmation callbacks
        if (update.type === 'callback') {
            return handleCallback(update.text);
        }

        const message = update.text.trim();
        if (!message) return NextResponse.json({ ok: true });

        // Show typing indicator
        await sendTelegram('⏳ Processing...');

        // Get app state from Telegram message context (passed via special format)
        // State is sent as JSON in message starting with STATE:
        let appState = {};
        let userMessage = message;

        if (message.startsWith('STATE:')) {
            const lines = message.split('\n');
            try { appState = JSON.parse(lines[0].replace('STATE:', '')); } catch { }
            userMessage = lines.slice(1).join('\n').trim();
        }

        // Classify intent
        const classified = await classifyIntent(userMessage, appState);

        // Route to handler
        switch (classified.intent) {
            case 'app_control':
                return handleAppControl(userMessage, appState, classified.extractedData);

            case 'code_edit':
                if (classified.requiresConfirmation) {
                    return handleCodeEditConfirmation(userMessage, classified.extractedData);
                }
                return handleCodeEdit(userMessage, classified.extractedData);

            case 'read_progress':
                return handleReadProgress(appState);

            case 'generate_schedule':
                return handleGenerateSchedule(userMessage, appState);

            case 'destructive':
                return handleDestructiveConfirmation(userMessage);

            case 'deploy_status':
                return handleDeployStatus();

            default:
                return handleGeneral(userMessage, appState);
        }
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('Telegram webhook error:', errMsg);
        try {
            await sendTelegram(`❌ Error: ${errMsg.slice(0, 200)}`);
        } catch (e) {
            console.error('Failed to send error to Telegram:', e);
        }
        return NextResponse.json({ ok: true, debug_error: errMsg });
    }
}

// ── APP CONTROL ───────────────────────────────────────────────────────────────
async function handleAppControl(message: string, appState: unknown, extracted: Record<string, unknown>) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `You are CyberSched AI controlling a productivity app via Telegram.
Current app state: ${JSON.stringify(appState, null, 2)}

Generate the appropriate app state changes. Respond with JSON:
{
  "message": "What you did in plain language",
  "actions": [
    {"action": "ADD_TASK", "task": {"name": "...", "category": "body|mind|work|quit|fun", "time": "HH:MM"}},
    {"action": "COMPLETE_TASK", "taskName": "..."},
    {"action": "DELETE_TASK", "taskName": "..."},
    {"action": "COMPLETE_HABIT", "habitId": "body|mind|work|quit|fun"},
    {"action": "CLEAR_DONE_TASKS"}
  ],
  "stateUpdate": null
}`,
            },
            { role: 'user', content: message },
        ],
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    const actionsText = parsed.actions?.map((a: Record<string, unknown>) => `• ${a.action}: ${JSON.stringify(a.task || a.taskName || a.habitId || '')}`).join('\n') || '';

    await sendTelegram(
        `✅ *${parsed.message}*\n\n${actionsText ? `Actions queued:\n${actionsText}\n\n` : ''}Open CyberSched to see changes reflected automatically.`,
        { parse_mode: 'Markdown' }
    );

    return NextResponse.json({ ok: true, actions: parsed.actions });
}

// ── READ PROGRESS ─────────────────────────────────────────────────────────────
async function handleReadProgress(appState: Record<string, unknown>) {
    const state = appState as {
        germanMonth?: number;
        germanWords?: number;
        germanStreak?: number;
        cyberMonth?: number;
        cyberHours?: number;
        cyberStreak?: number;
        completedTopics?: string[];
        completedSkills?: string[];
        habits?: { label: string; streak: number; todayDone: boolean }[];
        smokeFree?: { days: number; moneySaved: number };
    };

    const report = `📊 *CyberSched Progress Report*

🇩🇪 *German Learning*
- Month: ${state.germanMonth || 1} / 12
- Words learned: ${state.germanWords || 0}
- Study streak: ${state.germanStreak || 0} days
- Grammar topics done: ${state.completedTopics?.length || 0}

🔐 *Cybersecurity*
- Month: ${state.cyberMonth || 1} / 12
- Hours logged: ${state.cyberHours || 0}h
- Study streak: ${state.cyberStreak || 0} days
- Skills mastered: ${state.completedSkills?.length || 0}

🎯 *Habits Today*
${state.habits?.map((h: { label: string; streak: number; todayDone: boolean }) => `• ${h.todayDone ? '✅' : '⬜'} ${h.label} — ${h.streak}d streak`).join('\n') || 'No habit data'}

🚭 *Smoke Free*
- ${state.smokeFree?.days || 0} days clean
- $${state.smokeFree?.moneySaved || 0} saved`;

    await sendTelegram(report, { parse_mode: 'Markdown' });
    return NextResponse.json({ ok: true });
}

// ── GENERATE SCHEDULE ─────────────────────────────────────────────────────────
async function handleGenerateSchedule(message: string, appState: unknown) {
    await sendTelegram('🗓️ Generating your weekly schedule — give me 10 seconds...');

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        messages: [
            {
                role: 'system',
                content: `You are an elite weekly schedule architect for CyberSched.
App state: ${JSON.stringify(appState, null, 2)}
Create a realistic, anti-burnout 7-day schedule.
Format response as a clean readable text schedule (not JSON) for Telegram.
Max 50 words per day. Include times and emojis.`,
            },
            { role: 'user', content: message },
        ],
    });

    const schedule = response.choices[0].message.content || 'Could not generate schedule.';
    await sendTelegram(`🗓️ *Your Week Plan*\n\n${schedule}`, { parse_mode: 'Markdown' });
    return NextResponse.json({ ok: true });
}

// ── CODE EDIT CONFIRMATION ────────────────────────────────────────────────────
async function handleCodeEditConfirmation(message: string, extracted: Record<string, unknown>) {
    const confirmId = Date.now().toString();
    pendingConfirmations.set(confirmId, {
        action: 'code_edit',
        data: { message, extracted },
        timestamp: Date.now(),
    });

    await sendTelegramConfirmation(
        `⚠️ *Code Edit Request*\n\n"${message}"\n\nThis will:\n• Modify files in GitHub\n• Auto-deploy to Vercel\n• Go live immediately\n\nAre you sure?`,
        confirmId
    );
    return NextResponse.json({ ok: true });
}

// ── CODE EDIT ─────────────────────────────────────────────────────────────────
async function handleCodeEdit(message: string, extracted: Record<string, unknown>) {
    await sendTelegram('💻 Reading codebase...');

    // Get repo structure
    const files = await getRepoStructure();
    const commit = await getLatestCommit();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    // Find the most relevant file
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `Given this file list from a Next.js app: ${files.join(', ')}
Which single file is most relevant for this request: "${message}"?
Respond with JSON: {"filePath": "src/app/page.tsx", "reason": "why"}`,
            },
            { role: 'user', content: message },
        ],
    });

    const fileChoice = JSON.parse(response.choices[0].message.content || '{}');
    const filePath = fileChoice.filePath || 'src/app/page.tsx';

    await sendTelegram(`📂 Editing \`${filePath}\`...`);

    // Read the file
    const file = await getFile(filePath);
    if (!file) {
        await sendTelegram(`❌ Could not read \`${filePath}\`. Aborting.`);
        return NextResponse.json({ ok: true });
    }

    // Generate the edit
    const editResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 8000,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `You are an expert TypeScript/Next.js developer.
Make MINIMAL targeted changes to this file.
Only change what is necessary. Preserve all existing functionality.
Current file content:
\`\`\`
${file.content.slice(0, 15000)}
\`\`\`

Respond with JSON:
{
  "newContent": "complete updated file content",
  "commitMessage": "feat: brief description of change",
  "summary": "what was changed in plain English"
}`,
            },
            { role: 'user', content: `Change request: ${message}` },
        ],
    });

    const edit = JSON.parse(editResponse.choices[0].message.content || '{}');
    if (!edit.newContent) {
        await sendTelegram('❌ AI could not generate the edit. Try being more specific.');
        return NextResponse.json({ ok: true });
    }

    // Push to GitHub
    await sendTelegram('📤 Pushing to GitHub...');
    const success = await updateFile(filePath, edit.newContent, edit.commitMessage);

    if (success) {
        await sendTelegram(
            `✅ *Code Updated Successfully*\n\n📂 File: \`${filePath}\`\n📝 Change: ${edit.summary}\n💬 Commit: ${edit.commitMessage}\n🚀 Vercel is deploying now...\n⏱️ Live in ~2 minutes at cybersched.vercel.app`,
            { parse_mode: 'Markdown' }
        );
    } else {
        await sendTelegram('❌ GitHub push failed. Check your token permissions.');
    }

    return NextResponse.json({ ok: true });
}

// ── DESTRUCTIVE CONFIRMATION ──────────────────────────────────────────────────
async function handleDestructiveConfirmation(message: string) {
    const confirmId = Date.now().toString();
    pendingConfirmations.set(confirmId, {
        action: 'destructive',
        data: { message },
        timestamp: Date.now(),
    });

    await sendTelegramConfirmation(
        `⚠️ *Destructive Action*\n\n"${message}"\n\nThis cannot be undone. Confirm?`,
        confirmId
    );
    return NextResponse.json({ ok: true });
}

// ── DEPLOY STATUS ─────────────────────────────────────────────────────────────
async function handleDeployStatus() {
    const commit = await getLatestCommit();
    await sendTelegram(
        `🚀 *Deployment Status*\n\n• GitHub: \`${process.env.GITHUB_REPO}\` on \`main\`\n• Latest commit: \`${commit}\`\n• Vercel: Auto-deploy on push\n• Live URL: cybersched.vercel.app`,
        { parse_mode: 'Markdown' }
    );
    return NextResponse.json({ ok: true });
}

// ── GENERAL ASSISTANT ─────────────────────────────────────────────────────────
async function handleGeneral(message: string, appState: unknown) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
            {
                role: 'system',
                content: `You are CyberSched AI — a smart personal assistant for a productivity app user.
Current app context: ${JSON.stringify(appState, null, 2)}
Answer helpfully and concisely. You can reference the user's app data if relevant.
Keep responses under 200 words for Telegram readability.`,
            },
            { role: 'user', content: message },
        ],
    });

    const reply = response.choices[0].message.content || 'I could not generate a response.';
    await sendTelegram(reply);
    return NextResponse.json({ ok: true });
}

// ── CALLBACK HANDLER ──────────────────────────────────────────────────────────
async function handleCallback(data: string) {
    if (data.startsWith('confirm_')) {
        const confirmId = data.replace('confirm_', '');
        const pending = pendingConfirmations.get(confirmId);

        if (!pending) {
            await sendTelegram('⚠️ Confirmation expired. Please resend your command.');
            return NextResponse.json({ ok: true });
        }

        pendingConfirmations.delete(confirmId);

        if (pending.action === 'code_edit') {
            const { message, extracted } = pending.data as { message: string; extracted: Record<string, unknown> };
            return handleCodeEdit(message, extracted);
        }

        await sendTelegram('✅ Action confirmed and executed.');
    }

    if (data.startsWith('cancel_')) {
        const confirmId = data.replace('cancel_', '');
        pendingConfirmations.delete(confirmId);
        await sendTelegram('❌ Action cancelled. Nothing was changed.');
    }

    return NextResponse.json({ ok: true });
}
