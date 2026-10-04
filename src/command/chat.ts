import { askAlya } from '../chat/service';
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

        try {
            await message.channel?.sendTyping();
        } catch {
            // Typing indicator failed, continue
        }

        const answer = await askAlya(message.author.id, message.author.username, message.channel.id, query);
        return reply(message, answer);
    }
});
