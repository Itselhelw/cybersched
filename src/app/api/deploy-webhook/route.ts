import { NextRequest, NextResponse } from 'next/server';
import { sendTelegram } from '@/lib/telegram';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const state = body.state;
        const url = body.url;
        const name = body.name;

        if (state === 'READY') {
            await sendTelegram(
                `🚀 *Deployment Successful*\n\n• Project: ${name}\n• URL: https://${url}\n• Status: ✅ LIVE`,
                { parse_mode: 'Markdown' }
            );
        } else if (state === 'ERROR') {
            await sendTelegram(
                `❌ *Deployment Failed*\n\n• Project: ${name}\n• Status: FAILED\n• Check Vercel dashboard for details`,
                { parse_mode: 'Markdown' }
            );
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: true });
    }
}
