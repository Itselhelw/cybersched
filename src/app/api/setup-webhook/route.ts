import { NextResponse } from 'next/server';

export async function GET() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = `https://cybersched.vercel.app/api/telegram`;

    console.log('Setting webhook to:', webhookUrl);
    console.log('Token starts with:', token?.slice(0, 10));

    const res = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                allowed_updates: ['message', 'callback_query'],
            }),
        }
    );

    const data = await res.json();
    console.log('Webhook response:', data);
    return NextResponse.json(data);
}
