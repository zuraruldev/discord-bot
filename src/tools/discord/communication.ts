import { promises as fs } from 'fs';
import path from 'path';

import { client } from '../../Client';
import { send } from '../../utils';
import { BotTool } from '../types';

const CREATOR_USER_ID = '910785829549539338';
const AFK_FILE = path.resolve(process.cwd(), 'data/afk.json');

interface AfkEntry {
    userId: string;
    username: string;
    reason: string;
    timestamp: number;
}

const afkStore = new Map<string, AfkEntry>();

async function initAfkStore(): Promise<void> {
    try {
        const raw = await fs.readFile(AFK_FILE, 'utf-8');
        const data = JSON.parse(raw) as Record<string, AfkEntry>;
        for (const [id, entry] of Object.entries(data)) {
            afkStore.set(id, entry);
        }
    } catch {
        // file doesn't exist yet
    }
}

async function persistAfkStore(): Promise<void> {
    try {
        await fs.mkdir(path.dirname(AFK_FILE), { recursive: true });
        const obj = Object.fromEntries(afkStore.entries());
        await fs.writeFile(AFK_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {
        // ignore
    }
}

initAfkStore().catch(err => {
    void err;
});

export function getAfkUser(userId: string): AfkEntry | undefined {
    return afkStore.get(userId);
}

export function clearAfkUser(userId: string): boolean {
    if (afkStore.has(userId)) {
        afkStore.delete(userId);
        persistAfkStore().catch(err => {
            void err;
        });
        return true;
    }
    return false;
}

export const setAfkTool: BotTool = {
    name: 'set_afk',
    description: 'Memasang status AFK (Away From Keyboard) untuk pengguna yang sedang chat saat ini beserta alasannya.',
    parameters: {
        type: 'object',
        properties: {
            reason: {
                type: 'string',
                description: 'Alasan AFK (misal: "Makan siang", "Tidur", "Lagi di jalan")'
            }
        }
    },
    execute: async (args, context) => {
        const reason = String(args.reason || 'Sedang AFK').trim();
        const entry: AfkEntry = {
            userId: context.userId,
            username: context.authorName,
            reason,
            timestamp: Date.now()
        };

        afkStore.set(context.userId, entry);
        await persistAfkStore();

        return {
            success: true,
            message: `Status AFK berhasil dipasang untuk ${context.authorName}. Alasan: "${reason}".`,
            entry
        };
    }
};

export const setReminderTool: BotTool = {
    name: 'set_reminder',
    description: 'Memasang pengingat / alarm untuk pengguna setelah durasi tertentu (misal: 10 menit, 1 jam, 30 detik).',
    parameters: {
        type: 'object',
        properties: {
            duration_minutes: {
                type: 'number',
                description: 'Durasi dalam menit (misal: 15 untuk 15 menit, 0.5 untuk 30 detik, 60 untuk 1 jam)'
            },
            message: {
                type: 'string',
                description: 'Pesan pengingat yang akan dikirim'
            },
            channel_id: {
                type: 'string',
                description: 'Channel tujuan pengingat (opsional, default: channel saat ini)'
            }
        },
        required: ['duration_minutes', 'message']
    },
    execute: async (args, context) => {
        const minutes = Number(args.duration_minutes) || 1;
        const reminderMsg = String(args.message || '').trim();
        const channelId = String(args.channel_id || context.channelId);

        if (minutes <= 0) {
            return { success: false, message: 'Durasi pengingat harus lebih dari 0 menit.' };
        }
        if (!reminderMsg) {
            return { success: false, message: 'Pesan pengingat tidak boleh kosong.' };
        }

        const ms = Math.round(minutes * 60 * 1000);
        const triggerTime = new Date(Date.now() + ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        setTimeout(async () => {
            try {
                await send(channelId, {
                    content: `⏰ <@${context.userId}> **Pengingat Waktu Telah Tiba!**\n> ${reminderMsg}`
                });
            } catch {
                try {
                    const dm = await client.rest.users.createDM(context.userId);
                    await send(dm.id, {
                        content: `⏰ <@${context.userId}> **Pengingat Waktu Telah Tiba!**\n> ${reminderMsg}`
                    });
                } catch {
                    // ignore
                }
            }
        }, ms);

        return {
            success: true,
            message: `Pengingat berhasil diatur untuk ${minutes} menit lagi (sekitar pukul ${triggerTime} WIB): "${reminderMsg}".`,
            triggerTime
        };
    }
};

export const sendDmTool: BotTool = {
    name: 'send_dm',
    description: 'Mengirimkan pesan pribadi (Direct Message / DM) ke pengguna Discord tertentu.',
    parameters: {
        type: 'object',
        properties: {
            user_id: {
                type: 'string',
                description: 'ID pengguna Discord tujuan'
            },
            message: {
                type: 'string',
                description: 'Isi pesan yang ingin dikirimkan via DM'
            }
        },
        required: ['user_id', 'message']
    },
    adminOnly: true,
    execute: async (args) => {
        const targetUserId = String(args.user_id || '').replace(/[<@!>]/g, '').trim();
        const messageContent = String(args.message || '').trim();

        if (!targetUserId || !messageContent) {
            return { success: false, message: 'user_id dan message wajib diisi.' };
        }

        try {
            const dmChannel = await client.rest.users.createDM(targetUserId);
            await send(dmChannel.id, {
                content: `📬 **Pesan Masuk dari Alyssa Assistant:**\n\n${messageContent}`
            });
            return {
                success: true,
                message: `Pesan DM berhasil dikirim ke pengguna <@${targetUserId}>.`
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal mengirim DM ke <@${targetUserId}>: ${errorMsg} (Mungkin DM ditutup atau diblokir).`
            };
        }
    }
};

export const askOwnerTool: BotTool = {
    name: 'ask_owner',
    description: 'Jalur darurat: mengirimkan laporan, konfirmasi penting, atau pertanyaan langsung ke Creator/Owner bot via DM.',
    parameters: {
        type: 'object',
        properties: {
            question: {
                type: 'string',
                description: 'Pertanyaan atau hal penting yang ingin ditanyakan ke Owner bot'
            },
            context: {
                type: 'string',
                description: 'Konteks tambahan / ringkasan pembicaraan terkait'
            }
        },
        required: ['question']
    },
    execute: async (args, context) => {
        const question = String(args.question || '').trim();
        const additionalContext = String(args.context || '').trim();

        if (!question) {
            return { success: false, message: 'Pertanyaan untuk owner tidak boleh kosong.' };
        }

        try {
            const dm = await client.rest.users.createDM(CREATOR_USER_ID);
            const content = '🚨 **Panggilan Jalur Darurat Alyssa**\n' +
                `• **Dari Pengguna**: ${context.authorName} (<@${context.userId}>)\n` +
                `• **Channel ID**: \`${context.channelId}\`\n` +
                (additionalContext ? `• **Konteks**: ${additionalContext}\n` : '') +
                `• **Pertanyaan/Laporan**:\n>>> ${question}`;

            await send(dm.id, { content });
            return {
                success: true,
                message: `Pertanyaan dan laporan darurat berhasil diteruskan ke Creator bot (<@${CREATOR_USER_ID}>).`
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal mengirimkan pesan darurat ke Creator: ${errorMsg}`
            };
        }
    }
};
