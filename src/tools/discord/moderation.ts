import { client } from '../../Client';
import { BotTool } from '../types';

export const moderateTool: BotTool = {
    name: 'moderate',
    description: 'Melakukan aksi moderasi Discord (kick, ban, unban, timeout, purge, roleadd, roleremove). KHUSUS ADMIN.',
    parameters: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['kick', 'ban', 'unban', 'timeout', 'purge', 'roleadd', 'roleremove'],
                description: 'Aksi moderasi yang ingin dijalankan'
            },
            target_id: {
                type: 'string',
                description: 'ID pengguna atau target (kecuali purge)'
            },
            reason: {
                type: 'string',
                description: 'Alasan moderasi'
            },
            duration_seconds: {
                type: 'number',
                description: 'Durasi timeout dalam detik (hanya untuk aksi "timeout", misal: 60 untuk 1 menit)'
            },
            role_id: {
                type: 'string',
                description: 'ID Role (hanya untuk roleadd atau roleremove)'
            },
            amount: {
                type: 'number',
                description: 'Jumlah pesan yang dihapus (hanya untuk aksi "purge", default: 10, max: 100)'
            },
            channel_id: {
                type: 'string',
                description: 'ID channel untuk aksi purge (default: channel chat saat ini)'
            },
            guild_id: {
                type: 'string',
                description: 'ID Guild / Server (opsional, default: server saat ini)'
            }
        },
        required: ['action']
    },
    adminOnly: true,
    execute: async (args, context) => {
        const action = String(args.action || '').toLowerCase();
        const targetId = String(args.target_id || '').replace(/[<@!>]/g, '').trim();
        const reason = String(args.reason || 'Tindakan moderasi via Alyssa Assistant').trim();
        const guildId = String(args.guild_id || context.guildId || client.guilds.first()?.id || '');

        if (!guildId) {
            return { success: false, message: 'ID Guild / Server tidak dapat ditemukan.' };
        }

        try {
            switch (action) {
                case 'kick': {
                    if (!targetId) return { success: false, message: 'target_id diperlukan untuk kick.' };
                    await client.rest.guilds.removeMember(guildId, targetId, reason);
                    return { success: true, message: `Pengguna <@${targetId}> berhasil di-kick dari server. Alasan: ${reason}` };
                }
                case 'ban': {
                    if (!targetId) return { success: false, message: 'target_id diperlukan untuk ban.' };
                    await client.rest.guilds.createBan(guildId, targetId, { reason });
                    return { success: true, message: `Pengguna <@${targetId}> berhasil di-ban dari server. Alasan: ${reason}` };
                }
                case 'unban': {
                    if (!targetId) return { success: false, message: 'target_id diperlukan untuk unban.' };
                    await client.rest.guilds.removeBan(guildId, targetId, reason);
                    return { success: true, message: `Pengguna <@${targetId}> berhasil di-unban dari server.` };
                }
                case 'timeout': {
                    if (!targetId) return { success: false, message: 'target_id diperlukan untuk timeout.' };
                    const durationSec = Math.max(10, Math.min(2419200, Number(args.duration_seconds) || 60));
                    const untilDate = new Date(Date.now() + durationSec * 1000).toISOString();
                    await client.rest.guilds.editMember(guildId, targetId, {
                        communicationDisabledUntil: untilDate,
                        reason
                    });
                    return {
                        success: true,
                        message: `Pengguna <@${targetId}> berhasil di-timeout selama ${durationSec} detik sampai ${untilDate}.`
                    };
                }
                case 'roleadd': {
                    const roleId = String(args.role_id || '').replace(/[<@&>]/g, '').trim();
                    if (!targetId || !roleId) return { success: false, message: 'target_id dan role_id diperlukan untuk roleadd.' };
                    await client.rest.guilds.addMemberRole(guildId, targetId, roleId, reason);
                    return { success: true, message: `Role <@&${roleId}> berhasil diberikan kepada <@${targetId}>.` };
                }
                case 'roleremove': {
                    const roleId = String(args.role_id || '').replace(/[<@&>]/g, '').trim();
                    if (!targetId || !roleId) return { success: false, message: 'target_id dan role_id diperlukan untuk roleremove.' };
                    await client.rest.guilds.removeMemberRole(guildId, targetId, roleId, reason);
                    return { success: true, message: `Role <@&${roleId}> berhasil dicabut dari <@${targetId}>.` };
                }
                case 'purge': {
                    const chId = String(args.channel_id || context.channelId || '').trim();
                    if (!chId) return { success: false, message: 'channel_id diperlukan untuk aksi purge.' };
                    const count = Math.min(100, Math.max(1, Number(args.amount) || 10));
                    const deletedCount = await client.rest.channels.purgeMessages(chId, {
                        limit: count,
                        reason
                    });
                    return {
                        success: true,
                        message: `Berhasil membersihkan ${deletedCount || count} pesan di channel <#${chId}>.`
                    };
                }
                default:
                    return { success: false, message: `Aksi moderasi "${action}" tidak dikenal.` };
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return { success: false, message: `Gagal menjalankan aksi moderasi ${action}: ${errorMsg}` };
        }
    }
};
