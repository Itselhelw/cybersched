import { NextResponse } from 'next/server';

export async function GET() {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    // Debug — show what token the server is actually using
    if (!token) {
        return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set on server' });
    }

    return NextResponse.json({
        tokenFound: true,
        tokenStart: token.slice(0, 15),
        tokenEnd: token.slice(-6),
        tokenLength: token.length,
    });
}
