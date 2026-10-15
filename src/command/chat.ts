import { askAlya } from '../chat/service';
import { extractImagesFromMessage } from '../chat/vision';
import { client } from '../Client';
import { defineCommand } from '../Command';
import { getAllowedChatChannelIds, isAllowedChatChannel, PREFIX } from '../constants';
import { reply } from '../utils';

defineCommand({
    name: 'alya',
    description: 'Ngobrol santai atau bertanya tentang bot kepada Alya-san',
    aliases: ['ask', 'chat', 'a'],
    usages: ['<pertanyaan atau obrolan...>'],
    async run(message, args) {
        if (!isAllowedChatChannel(message.channel?.id)) {
            const channels = getAllowedChatChannelIds().map(id => `<#${id}>`).join(' atau ');
            return reply(message, `Ngobrol santai bareng Alya cuma bisa di channel ${channels} yaa! Yuk pindah ke sana xixixi~ 🌸✨`);
        }

        let referencedContent = '';
        let refMessage: import('oceanic.js').Message | null = null;
        if (message.messageReference?.messageID) {
            refMessage = message.channel?.messages.get(message.messageReference.messageID) || null;
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

        const images = await extractImagesFromMessage(message, refMessage);

        let query = args.join(' ').trim();
        if (!query && images.length === 0) {
            return reply(message, `Mau ngobrol apa nih? Gunakan: \`${PREFIX} alya <pesanmu>\`, mention aku, atau kirim gambar yaa! 🌸✨`);
        }

        if (!query) {
            query = 'Tolong perhatikan dan baca isi gambar ini, lalu jelaskan atau tanggapi isinya secara ramah, detail, dan ceria.';
        }

        try {
            await message.channel?.sendTyping();
        } catch {
            // Typing indicator failed, continue
        }

        const userPrompt = referencedContent
            ? `[Konteks: Membalas pesan sebelumnya: "${referencedContent}"]\n\nPesan Pengguna: ${query}`
            : query;

        const answer = await askAlya(message.author.id, message.author.username, message.channel.id, userPrompt, images);
        return reply(message, answer);
    }
});
