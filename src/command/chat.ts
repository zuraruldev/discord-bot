import { askAlya } from '../chat/service';
import { client } from '../Client';
import { defineCommand } from '../Command';
import { PREFIX } from '../constants';
import { reply } from '../utils';

defineCommand({
    name: 'alya',
    description: 'Ngobrol santai atau bertanya tentang bot kepada Alya-san',
    aliases: ['ask', 'chat', 'a'],
    usages: ['<pertanyaan atau obrolan...>'],
    async run(message, args) {
        const allowedChannelId = process.env.CHAT_CHANNEL_ID || '1555508577945522206';
        if (message.channel?.id !== allowedChannelId) {
            return reply(message, `Ngobrol santai bareng Alya cuma bisa di channel <#${allowedChannelId}> yaa! Yuk pindah ke sana xixixi~ 🌸✨`);
        }

        const query = args.join(' ').trim();
        if (!query) {
            return reply(message, `Mau ngobrol apa nih? Gunakan: \`${PREFIX} alya <pesanmu>\`, mention aku, atau panggil namaku yaa! 🌸✨`);
        }

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
            if (refMessage?.content) {
                referencedContent = refMessage.content.slice(0, 1000);
            }
        }

        try {
            await message.channel?.sendTyping();
        } catch {
            // Typing indicator failed, continue
        }

        const userPrompt = referencedContent
            ? `[Konteks: Membalas pesan sebelumnya: "${referencedContent}"]\n\nPesan Pengguna: ${query}`
            : query;

        const answer = await askAlya(message.author.id, message.author.username, message.channel.id, userPrompt);
        return reply(message, answer);
    }
});
