import type { EmbedOptions } from 'oceanic.js';

import { client } from '../Client.ts';
import { getFintracStatus, runFintracScan } from '../fintrac/bridge.ts';
import { createInfoEmbed, send } from '../utils.ts';

function formatIdr(amount: number): string {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function getWibInfo(): { weekday: string; dateKey: string; timeKey: string; isWeekday: boolean } {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(new Date());

    const map: Record<string, string> = {};
    for (const p of parts) {
        map[p.type] = p.value;
    }

    const weekday = map.weekday || '';
    const isWkday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday);
    const dateKey = `${map.year}-${map.month}-${map.day}`;
    const timeKey = `${map.hour}:${map.minute}`;

    return {
        weekday,
        dateKey,
        timeKey,
        isWeekday: isWkday
    };
}

const triggeredAlerts = new Set<string>();
let schedulerInterval: NodeJS.Timeout | null = null;

export async function dispatchFintracBrief(slot: '08:30' | '12:00' | '16:05', channelId?: string): Promise<boolean> {
    const targetChannel = channelId || process.env.FINTRAC_ALERT_CHANNEL_ID;
    if (!targetChannel) {
        return false;
    }

    try {
        if (slot === '08:30' || slot === '12:00') {
            const mode = slot === '08:30' ? 'scan' : 'midday';
            const scanResult = await runFintracScan(mode);

            if (!scanResult.success || !scanResult.setups || scanResult.setups.length === 0) {
                const emptyEmbed = createInfoEmbed(
                    `FINTRAC 2026 — Briefing Pasar (${slot} WIB)`,
                    'Tidak ada setup momentum breakout yang lolos filter threshold pada pemindaian sesi ini. Tetap disiplin menjaga modal kas!'
                );
                await send(targetChannel, { embeds: [emptyEmbed] });
                return true;
            }

            const setups = scanResult.setups;
            const fields = setups.map((s, idx) => ({
                name: `#${idx + 1} ${s.ticker} — ${formatIdr(s.price)} (Skor: ${s.score.toFixed(1)}/100)`,
                value: `• **Alokasi:** \`${s.target_lots} Lot\` (${formatIdr(s.allocated_capital)})\n` +
                    `• **TP1 (+4.5%):** \`${formatIdr(s.tp1)}\` | **TP2 (+8.5%):** \`${formatIdr(s.tp2)}\`\n` +
                    `• **Stop Loss (-2.8%):** \`${formatIdr(s.stop_loss)}\`\n` +
                    `• **RVOL:** \`${s.rvol.toFixed(2)}x\` | **RSI:** \`${s.rsi.toFixed(1)}\``,
                inline: false
            }));

            const embed: EmbedOptions = {
                title: `🔔 FINTRAC 2026 — Briefing Pasar Otomatis (${slot === '08:30' ? 'Prapasar' : 'Midday Break'} WIB)`,
                color: slot === '08:30' ? 0xFEE75C : 0x5865F2,
                description: `Hasil pemindaian otomatis momentum IDX80 untuk persiapan trading sesi ${slot === '08:30' ? '1' : '2'}:`,
                fields,
                footer: { text: 'FINTRAC 2026 Automated Briefing • Konfirmasi fraksi lot di IDX Mobile' },
                timestamp: new Date().toISOString()
            };

            await send(targetChannel, { embeds: [embed] });
            return true;
        } else if (slot === '16:05') {
            const status = await getFintracStatus();
            const quotaIcon = status.quota_completed ? '✅' : '⏳';
            const tickersIcon = status.unique_tickers >= 2 ? '✅' : '⏳';

            const openPositionsEntries = Object.entries(status.positions || {});
            const openPosText = openPositionsEntries.length > 0
                ? openPositionsEntries.map(([t, p]) => `• **${t}**: ${p.lots} Lot @ ${formatIdr(p.avg_price)}`).join('\n')
                : '*Semua posisi cash / flat.*';

            const embed: EmbedOptions = {
                title: '📋 FINTRAC 2026 — Rekap Penutupan Pasar (16:05 WIB)',
                color: 0x57F287,
                description: '**Status Kuota Kompetisi:**\n' +
                    `${quotaIcon} Transaksi Selesai: \`${status.total_trades} / 10\`\n` +
                    `${tickersIcon} Diversifikasi: \`${status.unique_tickers} / 2\` saham`,
                fields: [
                    { name: '💰 Total Aset', value: formatIdr(status.total_assets), inline: true },
                    { name: '💵 Saldo Kas', value: formatIdr(status.cash), inline: true },
                    { name: '📈 Realized PnL', value: `${status.realized_pnl >= 0 ? '+' : ''}${formatIdr(status.realized_pnl)}`, inline: true },
                    { name: '📂 Posisi Saham', value: openPosText, inline: false }
                ],
                footer: { text: 'FINTRAC 2026 Daily Market Recap' },
                timestamp: new Date().toISOString()
            };

            await send(targetChannel, { embeds: [embed] });
            return true;
        }
    } catch (error) {
        console.error('[FINTRAC Scheduler] Failed to dispatch brief:', error);
    }
    return false;
}

async function checkFintracTick(): Promise<void> {
    if (!process.env.FINTRAC_ALERT_CHANNEL_ID) {
        return;
    }

    const { dateKey, timeKey, isWeekday } = getWibInfo();
    if (!isWeekday) {
        return;
    }

    const slots: ('08:30' | '12:00' | '16:05')[] = ['08:30', '12:00', '16:05'];
    for (const slot of slots) {
        if (timeKey === slot) {
            const alertKey = `${dateKey}_${slot}`;
            if (triggeredAlerts.has(alertKey)) {
                continue;
            }
            triggeredAlerts.add(alertKey);
            console.log(`[FINTRAC Scheduler] Triggering automated brief for slot ${slot} (${dateKey})`);
            await dispatchFintracBrief(slot);
        }
    }
}

export function startFintracScheduler(): void {
    if (schedulerInterval) return;
    schedulerInterval = setInterval(checkFintracTick, 25000);
}

if (client.ready) {
    startFintracScheduler();
} else {
    client.once('ready', startFintracScheduler);
}
