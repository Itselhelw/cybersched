
export async function sendTelegram(text: string, options?: {
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: object;
}) {
    const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!chatId) {
        console.error('sendTelegram: TELEGRAM_CHAT_ID is not set');
        return;
    }

    try {
        const res = await fetch(`${telegramApi}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: options?.parse_mode || 'Markdown',
                reply_markup: options?.reply_markup,
            }),
        });
        const data = await res.json();
        if (!data.ok) {
            console.error('Telegram API error:', JSON.stringify(data));
        }
    } catch (err) {
        console.error('Telegram send error:', err);
    }
}

export async function sendTelegramConfirmation(text: string, confirmId: string) {
    await sendTelegram(text, {
        reply_markup: {
            inline_keyboard: [[
                { text: '✅ YES — DO IT', callback_data: `confirm_${confirmId}` },
                { text: '❌ CANCEL', callback_data: `cancel_${confirmId}` },
            ]],
        },
    });
}

export function parseTelegramUpdate(body: Record<string, unknown>) {
    const message = (body.message || body.edited_message) as Record<string, unknown> | undefined;
    const callbackQuery = body.callback_query as Record<string, unknown> | undefined;

    if (callbackQuery) {
        return {
            type: 'callback' as const,
            text: callbackQuery.data as string,
            messageId: (callbackQuery.message as Record<string, unknown>)?.message_id as number,
        };
    }

    if (message) {
        return {
            type: 'message' as const,
            text: (message.text as string) || '',
            messageId: message.message_id as number,
        };
    }

    return null;
}
