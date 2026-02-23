import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasKey: !!process.env.GROQ_API_KEY,
        keyStart: process.env.GROQ_API_KEY?.slice(0, 8) || 'NOT FOUND',
    });
}
