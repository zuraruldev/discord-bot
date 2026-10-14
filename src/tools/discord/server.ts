import os from 'os';

import { client } from '../../Client';
import { getDiskStats } from '../../module/monitoring';
import { BotTool } from '../types';

export const serverInfoTool: BotTool = {
    name: 'server_info',
    description: 'Melihat statistik server Discord (member, channel, roles, ping bot). Khusus Admin juga menampilkan performa hardware VPS (CPU, RAM, Disk, Uptime).',
    parameters: {
        type: 'object',
        properties: {
            guild_id: {
                type: 'string',
                description: 'ID Guild / Server Discord (opsional, default: server saat ini)'
            }
        }
    },
    execute: async (args, context) => {
        const targetGuildId = String(args.guild_id || context.guildId || '');
        const guild = targetGuildId ? client.guilds.get(targetGuildId) : client.guilds.first();

        const ping = client.shards.first()?.latency ?? 0;
        const totalGuilds = client.guilds.size;
        const totalUsers = client.users.size;

        const result: Record<string, unknown> = {
            success: true,
            discord: {
                guildName: guild?.name || 'N/A',
                guildId: guild?.id || 'N/A',
                memberCount: guild?.memberCount || 0,
                channelsCount: guild?.channels.size || 0,
                rolesCount: guild?.roles.size || 0,
                botPingMs: Math.round(ping),
                cachedGuilds: totalGuilds,
                cachedUsers: totalUsers
            }
        };

        if (context.isAdmin) {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const ramPercent = (usedMem / totalMem) * 100;
            const uptimeSeconds = os.uptime();

            const cpus = os.cpus();
            const cpuModel = cpus[0]?.model || 'Unknown CPU';
            const cpuCores = cpus.length;

            const disk = await getDiskStats();

            result.vps = {
                platform: `${os.type()} ${os.release()} (${os.arch()})`,
                uptimeDays: (uptimeSeconds / 86400).toFixed(2),
                cpu: {
                    model: cpuModel,
                    cores: cpuCores,
                    loadAverage: os.loadavg()
                },
                ram: {
                    usedGb: (usedMem / 1073741824).toFixed(2),
                    totalGb: (totalMem / 1073741824).toFixed(2),
                    percent: ramPercent.toFixed(1)
                },
                disk: {
                    usedGb: disk.usedGb.toFixed(2),
                    totalGb: disk.totalGb.toFixed(2),
                    percent: disk.percent.toFixed(1)
                }
            };
        } else {
            result.vps = {
                status: 'Restricted (Admin Only)',
                message: 'Informasi spesifikasi hosting dan hardware VPS disembunyikan untuk menjaga keamanan server.'
            };
        }

        return result;
    }
};
