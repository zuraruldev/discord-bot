import { send } from '../../utils';
import { BotTool } from '../types';

export const clarifyTool: BotTool = {
    name: 'clarify',
    description: 'Menampilkan pilihan opsi interaktif atau pertanyaan klarifikasi terstruktur kepada pengguna jika instruksi ambigu atau butuh keputusan.',
    parameters: {
        type: 'object',
        properties: {
            question: {
                type: 'string',
                description: 'Pertanyaan atau hal yang butuh klarifikasi dari pengguna'
            },
            options: {
                type: 'array',
                description: 'Daftar opsi pilihan yang ditawarkan ke pengguna',
                items: {
                    type: 'object',
                    properties: {
                        label: { type: 'string', description: 'Label singkat opsi pilihan' },
                        description: { type: 'string', description: 'Penjelasan opsi' }
                    },
                    required: ['label']
                }
            }
        },
        required: ['question', 'options']
    },
    execute: async (args, context) => {
        const question = String(args.question || '').trim();
        const rawOptions = Array.isArray(args.options) ? args.options : [];

        if (!question) {
            return { success: false, message: 'Pertanyaan klarifikasi tidak boleh kosong.' };
        }

        const formattedOptions = rawOptions.map((opt, idx) => {
            const item = opt as Record<string, unknown>;
            const label = String(item.label || `Opsi ${idx + 1}`);
            const desc = item.description ? ` - ${item.description}` : '';
            return `**${idx + 1}. ${label}**${desc}`;
        });

        const optionsText = formattedOptions.join('\n');
        const promptText = `🤔 **Alya butuh konfirmasi kamu nih:**\n> ${question}\n\n${optionsText}\n\n*Silakan ketik nomor atau nama opsi yang kamu pilih yaa!*`;

        try {
            await send(context.channelId, { content: promptText });
            return {
                success: true,
                question,
                optionsCount: formattedOptions.length,
                options: rawOptions
            };
        } catch {
            return {
                success: true,
                question,
                options: rawOptions
            };
        }
    }
};
