import { Message } from 'oceanic.js';

import { askAlya } from '../chat/service';
import { extractImagesFromMessage } from '../chat/vision';
import { client } from '../Client';
import { isAllowedChatChannel, PREFIX } from '../constants';
import { clearAfkUser, getAfkUser } from '../tools/discord/communication';
import { reply } from '../utils';

const NAME_TRIGGER_REGEX = /\b(alya|kujou|kujo|alisa)\b/i;

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;
    if (!client.ready) return;

    if (!message.channel || !isAllowedChatChannel(message.channel.id)) return;

    if (clearAfkUser(message.author.id)) {
        await reply(message, `Welcome back, <@${message.author.id}>! Status AFK-mu telah dimatikan yaa~ 🌸✨`).catch(err => {
            void err;
        });
    }

    const mentions = message.content.match(/<@!?(\d+)>/g);
    if (mentions) {
        for (const m of mentions) {
            const targetId = m.replace(/[<@!>]/g, '');
            if (targetId === message.author.id) continue;
            const afkData = getAfkUser(targetId);
            if (afkData) {
                await reply(message, `ℹ️ <@${targetId}> sedang AFK: "${afkData.reason}"`).catch(err => {
                    void err;
                });
            }
        }
    }

    const trimmed = message.content.trim().toLowerCase();
    if (trimmed.startsWith(PREFIX)) return;

    const botId = client.user.id;
    const botMention = `<@${botId}>`;
    const botNickMention = `<@!${botId}>`;
    const isMentioned = message.content.includes(botMention) || message.content.includes(botNickMention);

    let isReplyToBot = false;
    let referencedContent = '';
    let refMessage: Message | null = null;

    if (message.messageReference?.messageID) {
        refMessage = message.channel?.messages.get(message.messageReference.messageID) || null;
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

    const images = await extractImagesFromMessage(message, refMessage);

    let cleanContent = message.content
        .replace(new RegExp(`<@!?${botId}>`, 'g'), '')
        .trim();

    if (!cleanContent) {
        if (images.length > 0) {
            cleanContent = 'Tolong perhatikan dan baca isi gambar ini, lalu jelaskan atau tanggapi isinya secara ramah, detail, dan ceria.';
        } else {
            return reply(message, 'Halo! Ada apa manggil Alya nih? Mau ngobrol atau butuh bantuan? xixixi~ 🌸✨');
        }
    }

    try {
        await message.channel?.sendTyping();
    } catch {
        // Typing indicator failed, continue
    }

    const userPrompt = referencedContent
        ? `[Konteks: Membalas pesan sebelumnya: "${referencedContent}"]\n\nPesan Pengguna: ${cleanContent}`
        : cleanContent;

    const answer = await askAlya(message.author.id, message.author.username, message.channel?.id || 'dm', userPrompt, images);
    return reply(message, answer);
});
