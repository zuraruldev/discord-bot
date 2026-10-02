import { mkdir, readFile, statfs, writeFile } from 'fs/promises';
import type { EmbedOptions } from 'oceanic.js';
import os from 'os';

import { client } from '../Client';
import { send } from '../utils';

const MONITORING_FILE = './data/monitoring.json';
const DATA_DIR = './data';

export interface MonitoringConfig {
    channelId: string;
    messageId?: string;
}

export interface DiskStats {
    usedGb: number;
    totalGb: number;
    percent: number;
}

let updateInterval: NodeJS.Timeout | null = null;
let isUpdating = false;
let lastRamAlertTime = 0;
let lastDiskAlertTime = 0;

export async function getDiskStats(): Promise<DiskStats> {
    try {
        const s = await statfs('/');
        const total = Number(s.bsize) * Number(s.blocks);
        const free = Number(s.bsize) * Number(s.bfree);
        const used = total - free;
        const totalGb = total / 1073741824;
        const usedGb = used / 1073741824;
        const percent = total > 0 ? (used / total) * 100 : 0;
        return { usedGb, totalGb, percent };
    } catch {
        return { usedGb: 0, totalGb: 0, percent: 0 };
    }
}

async function checkSystemThresholds(ramPercent: number, diskPercent: number): Promise<void> {
    const now = Date.now();
    const cooldown = 15 * 60 * 1000;
    const logChannel = process.env.ERROR_LOG_CHANNEL_ID || process.env.BUG_CHANNEL_ID;
    if (!logChannel) return;

    if (ramPercent >= 90 && now - lastRamAlertTime > cooldown) {
        lastRamAlertTime = now;
        await send(logChannel, {
            embeds: [{
                title: 'High RAM Usage Warning',
                description: `VPS RAM usage has reached **${ramPercent.toFixed(1)}%**!`,
                color: 0xED4245,
                timestamp: new Date().toISOString()
            }]
        }).catch(err => {
            console.error('[Monitoring] Failed to send RAM alert:', err);
        });
    }

    if (diskPercent >= 90 && now - lastDiskAlertTime > cooldown) {
        lastDiskAlertTime = now;
        await send(logChannel, {
            embeds: [{
                title: 'High Disk Usage Warning',
                description: `VPS Disk usage has reached **${diskPercent.toFixed(1)}%**!`,
                color: 0xED4245,
                timestamp: new Date().toISOString()
            }]
        }).catch(err => {
            console.error('[Monitoring] Failed to send Disk alert:', err);
        });
    }
}

async function ensureDataDir(): Promise<void> {
    try {
        await mkdir(DATA_DIR, { recursive: true });
    } catch {
        return;
    }
}

export async function loadMonitoringConfig(): Promise<MonitoringConfig> {
    await ensureDataDir();
    const envChannel = process.env.STATUS_CHANNEL_ID || process.env.MONITORING_CHANNEL_ID || process.env.SERVER_MONITORING_CHANNEL_ID || '';
    try {
        const raw = await readFile(MONITORING_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.channelId && envChannel) {
            parsed.channelId = envChannel;
        }
        return parsed;
    } catch {
        return { channelId: envChannel };
    }
}

export async function saveMonitoringConfig(config: MonitoringConfig): Promise<void> {
    await ensureDataDir();
    await writeFile(MONITORING_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function setMonitoringChannel(channelId: string): Promise<MonitoringConfig> {
    const config = await loadMonitoringConfig();
    config.channelId = channelId;
    delete config.messageId;
    await saveMonitoringConfig(config);
    await updateStatusEmbed('online');
    return config;
}

function formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}

export function createStatusEmbed(status: 'online' | 'offline', reason?: string, disk?: DiskStats): EmbedOptions {
    const now = Math.floor(Date.now() / 1000);
    const hostname = os.hostname();
    const platform = `${os.type()} ${os.release()} (${os.arch()})`;
    const vpsUptime = formatDuration(os.uptime());
    const botUptime = formatDuration(process.uptime());

    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const usedRam = totalRam - freeRam;
    const ramPercent = (usedRam / totalRam) * 100;
    const mem = process.memoryUsage();

    const cpuModel = os.cpus()[0]?.model?.trim() || 'Unknown CPU';
    const cpuCores = os.cpus().length;
    const loadAvg = os.loadavg().map(n => n.toFixed(2)).join(', ');

    const latency = client.shards.get(0)?.latency ?? 0;
    const shardCount = client.shards.size || 1;

    if (status === 'offline') {
        return {
            title: 'Server & Bot Status [OFFLINE]',
            description: 'Discord Bot has shut down or disconnected from gateway.',
            color: 0xED4245,
            fields: [
                {
                    name: 'Host & Platform',
                    value: `Hostname: \`${hostname}\`\nOS: \`${platform}\``,
                    inline: false
                },
                {
                    name: 'Shutdown Reason',
                    value: reason || 'Process terminated or connection lost',
                    inline: false
                },
                {
                    name: 'Last Online',
                    value: `<t:${now}:F> (<t:${now}:R>)`,
                    inline: false
                }
            ],
            footer: {
                text: 'System Monitoring'
            },
            timestamp: new Date().toISOString()
        };
    }

    const fields = [
        {
            name: 'Host & Platform',
            value: `Hostname: \`${hostname}\`\nOS: \`${platform}\``,
            inline: true
        },
        {
            name: 'Uptime',
            value: `VPS: \`${vpsUptime}\`\nBot: \`${botUptime}\``,
            inline: true
        },
        {
            name: 'Gateway',
            value: `Latency: \`${latency} ms\`\nShards: \`${shardCount}\`\nGuilds: \`${client.guilds.size}\``,
            inline: true
        },
        {
            name: 'RAM Usage',
            value: `VPS: \`${(usedRam / 1073741824).toFixed(2)} / ${(totalRam / 1073741824).toFixed(2)} GB (${ramPercent.toFixed(1)}%)\`\nBot RSS: \`${(mem.rss / 1048576).toFixed(1)} MB\`\nHeap: \`${(mem.heapUsed / 1048576).toFixed(1)} / ${(mem.heapTotal / 1048576).toFixed(1)} MB\``,
            inline: false
        }
    ];

    if (disk && disk.totalGb > 0) {
        fields.push({
            name: 'Disk Space',
            value: `VPS: \`${disk.usedGb.toFixed(2)} / ${disk.totalGb.toFixed(2)} GB (${disk.percent.toFixed(1)}%)\``,
            inline: false
        });
    }

    fields.push(
        {
            name: 'CPU & Load',
            value: `Model: \`${cpuModel}\` (${cpuCores} cores)\nLoad Average (1m, 5m, 15m): \`${loadAvg}\``,
            inline: false
        },
        {
            name: 'Last Heartbeat',
            value: `<t:${now}:F> (<t:${now}:R>)`,
            inline: false
        }
    );

    return {
        title: 'Server & Bot Status [ONLINE]',
        description: 'VPS and Discord Bot are active and operational.',
        color: 0x57F287,
        fields,
        footer: {
            text: 'Live Status Monitor - Auto updates every 60s'
        },
        timestamp: new Date().toISOString()
    };
}

export async function updateStatusEmbed(status: 'online' | 'offline', reason?: string): Promise<void> {
    if (isUpdating && status === 'online') return;
    isUpdating = true;

    try {
        const config = await loadMonitoringConfig();
        const channelId = config.channelId || process.env.STATUS_CHANNEL_ID || process.env.MONITORING_CHANNEL_ID || process.env.SERVER_MONITORING_CHANNEL_ID;
        if (!channelId) return;

        const disk = await getDiskStats();
        const embed = createStatusEmbed(status, reason, disk);

        if (status === 'online') {
            const totalRam = os.totalmem();
            const freeRam = os.freemem();
            const usedRam = totalRam - freeRam;
            const ramPercent = totalRam > 0 ? (usedRam / totalRam) * 100 : 0;
            await checkSystemThresholds(ramPercent, disk.percent);
        }

        if (config.messageId) {
            try {
                await client.rest.channels.editMessage(channelId, config.messageId, {
                    embeds: [embed]
                });
                return;
            } catch {
                config.messageId = undefined;
            }
        }

        const msg = await client.rest.channels.createMessage(channelId, {
            embeds: [embed]
        });
        config.messageId = msg.id;
        config.channelId = channelId;
        await saveMonitoringConfig(config);
    } catch (err) {
        console.error('[Monitoring] Error updating status embed:', err);
    } finally {
        isUpdating = false;
    }
}

export function startMonitoring(): void {
    if (updateInterval) return;
    updateStatusEmbed('online').catch(err => {
        console.error('[Monitoring] Initial update failed:', err);
    });
    updateInterval = setInterval(() => {
        updateStatusEmbed('online').catch(err => {
            console.error('[Monitoring] Periodic update failed:', err);
        });
    }, 60000);
}

if (client.ready) {
    startMonitoring();
} else {
    client.once('ready', startMonitoring);
}

let isShuttingDown = false;
async function handleShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    try {
        await updateStatusEmbed('offline', `Process received ${signal}`);
    } catch {
        return;
    }
    process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
