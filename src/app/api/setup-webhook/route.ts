import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = 'https://cybersched.vercel.app/api/telegram';

  const res = await fetch(
    'https://api.telegram.org/bot' + token + '/setWebhook',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }),
    }
  );

  const data = await res.json();
  return NextResponse.json({ ...data, attempted_url: webhookUrl });
}
