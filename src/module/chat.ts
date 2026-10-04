import { Message } from 'oceanic.js';

import { askAlya } from '../chat/service';
import { client } from '../Client';
import { PREFIX } from '../constants';
import { reply } from '../utils';

const ALLOWED_CHAT_CHANNEL_ID = process.env.CHAT_CHANNEL_ID || '1555508577945522206';
const NAME_TRIGGER_REGEX = /\b(alya|kujou|kujo|alisa)\b/i;

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;
    if (!client.ready) return;

    if (!message.channel || message.channel.id !== ALLOWED_CHAT_CHANNEL_ID) return;

    const trimmed = message.content.trim().toLowerCase();
    if (trimmed.startsWith(PREFIX)) return;

    const botId = client.user.id;
    const botMention = `<@${botId}>`;
    const botNickMention = `<@!${botId}>`;
    const isMentioned = message.content.includes(botMention) || message.content.includes(botNickMention);

    let isReplyToBot = false;
    let referencedContent = '';

    if (message.messageReference?.messageID) {
        let refMessage = message.channel?.messages.get(message.messageReference.messageID);
        if (!refMessage && message.channel) {
            try {
                refMessage = await client.rest.channels.getMessage(message.channel.id, message.messageReference.messageID);
            } catch {
                // Ignore fetch error
            }
        }

        if (refMessage) {
            if (refMessage.author.id === botId) {
                isReplyToBot = true;
            }
            if (refMessage.content) {
                referencedContent = refMessage.content.slice(0, 1000);
            }
        }
    }

    const hasNameKeyword = NAME_TRIGGER_REGEX.test(message.content);

    if (!isMentioned && !isReplyToBot && !hasNameKeyword) return;

    const cleanContent = message.content
        .replace(new RegExp(`<@!?${botId}>`, 'g'), '')
        .trim();

    if (!cleanContent) {
        return reply(message, 'Halo! Ada apa manggil Alya nih? Mau ngobrol atau butuh bantuan? xixixi~ 🌸✨');
    }

    try {
        await message.channel?.sendTyping();
    } catch {
        // Typing indicator failed, continue
    }

    const userPrompt = referencedContent
        ? `[Konteks: Membalas pesan sebelumnya: "${referencedContent}"]\n\nPesan Pengguna: ${cleanContent}`
        : cleanContent;

    const answer = await askAlya(message.author.id, message.author.username, message.channel?.id || 'dm', userPrompt);
    return reply(message, answer);
});
