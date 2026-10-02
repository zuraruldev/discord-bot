import { defineCommand } from '../Command';
import { isAdmin, PREFIX } from '../constants';
import {
    createStatusEmbed,
    getDiskStats,
    loadMonitoringConfig,
    setMonitoringChannel,
    updateStatusEmbed
} from '../module/monitoring';
import { reply } from '../utils';

defineCommand({
    name: 'status',
    description: 'Monitor VPS and bot status',
    aliases: ['monitor', 'vps'],
    usages: ['', 'setchannel [channelId]', 'refresh'],
    adminOnly: true,
    hidden: true,
    async run(message, args) {
        if (!isAdmin(message.author.id)) {
            return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
        }

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'setchannel' || subCommand === 'channel') {
            const targetChannelId = args[1]?.replace(/[<#>]/g, '') || message.channel?.id;
            if (!targetChannelId) {
                return reply(message, 'Channel tidak valid.');
            }

            await setMonitoringChannel(targetChannelId);
            return reply(message, {
                embeds: [{
                    title: 'Channel Monitoring Diperbarui',
                    description: `Channel monitoring live status diatur ke <#${targetChannelId}> (\`${targetChannelId}\`).\nEmbed status online/offline akan diperbarui secara otomatis setiap 60 detik.`,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (subCommand === 'refresh') {
            const config = await loadMonitoringConfig();
            const channelId = config.channelId || process.env.STATUS_CHANNEL_ID || process.env.MONITORING_CHANNEL_ID;
            if (!channelId) {
                return reply(message, `Channel monitoring belum diatur. Gunakan \`${PREFIX} status setchannel\`.`);
            }

            await updateStatusEmbed('online');
            return reply(message, {
                embeds: [{
                    title: 'Status Refreshed',
                    description: `Embed status di <#${channelId}> telah diperbarui.`,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        const disk = await getDiskStats();
        const embed = createStatusEmbed('online', undefined, disk);
        return reply(message, { embeds: [embed] });
    }
});
