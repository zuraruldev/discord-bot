import type { EmbedOptions } from 'oceanic.js';

import { defineCommand } from '../Command.ts';
import { isAdmin, PREFIX } from '../constants.ts';
import { allowFintracUser, getFintracAuthorizedUsers, isFintracAuthorized, revokeFintracUser } from '../fintrac/auth.ts';
import { getFintracQuote, getFintracStatus, logFintracTrade, runFintracScan } from '../fintrac/bridge.ts';
import { createErrorEmbed, createInfoEmbed, createSuccessEmbed, reply } from '../utils.ts';

function formatIdr(amount: number): string {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

defineCommand({
    name: 'fintrac',
    description: 'FINTRAC 2026 IDX80 Momentum Screener & Portfolio Manager',
    aliases: ['ft', 'idx80', 'screener'],
    usages: [
        'scan [--capital <idr>] [--positions <num>]',
        'midday [--capital <idr>] [--positions <num>]',
        'quote <ticker>',
        'status',
        'log <buy|sell> <ticker> <lots> <price>',
        'allow <@user | id>',
        'revoke <@user | id>',
        'users'
    ],
    async run(message, args) {
        if (!isFintracAuthorized(message.author.id)) {
            const embed = createErrorEmbed(
                '🔒 Akses FINTRAC 2026 Ditolak',
                'Fitur screener dan portfolio manager FINTRAC ini dikunci khusus untuk Admin dan peserta resmi yang terdaftar.\n' +
                'Silakan hubungi Admin bot untuk meminta izin akses.'
            );
            return reply(message, { embeds: [embed] });
        }

        const subCommand = args[0]?.toLowerCase();

        // 1. Admin user management
        if (subCommand === 'allow' || subCommand === 'revoke' || subCommand === 'users') {
            if (!isAdmin(message.author.id)) {
                return reply(message, {
                    embeds: [createErrorEmbed('Akses Terbatas', 'Perintah manajemen user FINTRAC hanya dapat dijalankan oleh Admin.')]
                });
            }

            if (subCommand === 'users') {
                const users = getFintracAuthorizedUsers();
                const list = users.length > 0 ? users.map(id => `• <@${id}> (\`${id}\`)`).join('\n') : 'Belum ada pengguna khusus yang ditambahkan.';
                return reply(message, {
                    embeds: [createInfoEmbed('👥 Daftar Pengguna Resmi FINTRAC', list)]
                });
            }

            const target = args[1]?.replace(/[<@!>]/g, '');
            if (!target) {
                return reply(message, `Gunakan format: \`${PREFIX}fintrac ${subCommand} <@user | ID>\``);
            }

            if (subCommand === 'allow') {
                allowFintracUser(target);
                return reply(message, {
                    embeds: [createSuccessEmbed('Akses Diberikan', `Pengguna <@${target}> berhasil ditambahkan ke daftar resmi screener FINTRAC 2026.`)]
                });
            } else {
                revokeFintracUser(target);
                return reply(message, {
                    embeds: [createSuccessEmbed('Akses Dicabut', `Akses FINTRAC untuk pengguna <@${target}> telah dicabut.`)]
                });
            }
        }

        // 2. Quote Single Ticker
        if (subCommand === 'quote' || subCommand === 'q') {
            const ticker = args[1];
            if (!ticker) {
                return reply(message, `Masukkan kode saham! Contoh: \`${PREFIX}fintrac quote BBCA\``);
            }

            const quote = await getFintracQuote(ticker);
            if (!quote.success || !quote.price) {
                return reply(message, {
                    embeds: [createErrorEmbed('Gagal Mengambil Quote', quote.error || `Data saham ${ticker} tidak ditemukan.`)]
                });
            }

            const embed: EmbedOptions = {
                title: `📈 Setup Momentum FINTRAC: ${quote.ticker}`,
                color: (quote.score ?? 0) >= 60 ? 0x57F287 : 0x5865F2,
                fields: [
                    { name: '💵 Harga Terkini', value: formatIdr(quote.price), inline: true },
                    { name: '🎯 Target Alokasi', value: `${quote.target_lots} Lot (${formatIdr(quote.allocated_capital || 0)})`, inline: true },
                    { name: '📊 Skor Momentum', value: `${quote.score?.toFixed(1)} / 100`, inline: true },
                    { name: '🚀 Take Profit 1 (+4.5%)', value: formatIdr(quote.tp1 || 0), inline: true },
                    { name: '🚀 Take Profit 2 (+8.5%)', value: formatIdr(quote.tp2 || 0), inline: true },
                    { name: '🛑 Stop Loss (-2.8%)', value: formatIdr(quote.stop_loss || 0), inline: true },
                    { name: '🌊 Relative Volume (RVOL)', value: `${quote.rvol?.toFixed(2)}x (vs 20d avg)`, inline: true },
                    { name: '⚡ RSI (14)', value: `${quote.rsi?.toFixed(1)}`, inline: true }
                ],
                footer: { text: 'FINTRAC 2026 IDX Mobile • Lot size disesuaikan dengan fraksi harga BEI' },
                timestamp: new Date().toISOString()
            };

            return reply(message, { embeds: [embed] });
        }

        // 3. Status & Quota
        if (subCommand === 'status' || subCommand === 's' || !subCommand) {
            try {
                const status = await getFintracStatus();
                const quotaIcon = status.quota_completed ? '✅' : '⏳';
                const tickersIcon = status.unique_tickers >= 2 ? '✅' : '⏳';

                const openPositionsEntries = Object.entries(status.positions || {});
                const openPosText = openPositionsEntries.length > 0
                    ? openPositionsEntries.map(([t, p]) => `• **${t}**: ${p.lots} Lot @ ${formatIdr(p.avg_price)}`).join('\n')
                    : '*Tidak ada posisi saham terbuka saat ini.*';

                const embed: EmbedOptions = {
                    title: '💼 FINTRAC 2026 — Portofolio & Progres Kuota',
                    color: 0x5865F2,
                    description: '**Status Kuota Lomba (1 Minggu):**\n' +
                        `${quotaIcon} **Total Transaksi:** \`${status.total_trades} / 10\`\n` +
                        `${tickersIcon} **Diversifikasi Saham:** \`${status.unique_tickers} / 2\` saham berbeda\n` +
                        '*(Syarat juara: Minimal 10 transaksi dan minimal 2 saham berbeda)*',
                    fields: [
                        { name: '💰 Total Aset', value: formatIdr(status.total_assets), inline: true },
                        { name: '💵 Saldo Kas (Cash)', value: formatIdr(status.cash), inline: true },
                        { name: '📊 Nilai Saham (Portfolio)', value: formatIdr(status.portfolio_value), inline: true },
                        { name: '📈 Realized PnL', value: `${status.realized_pnl >= 0 ? '+' : ''}${formatIdr(status.realized_pnl)}`, inline: true },
                        { name: '📂 Posisi Saham Terbuka', value: openPosText, inline: false }
                    ],
                    footer: { text: 'FINTRAC 2026 Virtual Trading Tournament' },
                    timestamp: new Date().toISOString()
                };

                return reply(message, { embeds: [embed] });
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return reply(message, {
                    embeds: [createErrorEmbed('Gagal Mengambil Status Portofolio', msg)]
                });
            }
        }

        // 4. Log Trade Execution
        if (subCommand === 'log') {
            const action = args[1]?.toLowerCase();
            const ticker = args[2]?.toUpperCase();
            const lots = parseInt(args[3] || '0', 10);
            const price = parseFloat(args[4] || '0');

            if (!action || (action !== 'buy' && action !== 'sell') || !ticker || lots <= 0 || price <= 0) {
                return reply(
                    message,
                    `Format salah! Gunakan: \`${PREFIX}fintrac log <buy|sell> <ticker> <lots> <price>\`\nContoh: \`${PREFIX}fintrac log buy BBCA 100 10200\``
                );
            }

            const result = await logFintracTrade(action, ticker, lots, price);
            if (!result.success || !result.trade) {
                return reply(message, {
                    embeds: [createErrorEmbed('Gagal Mencatat Transaksi', result.error || 'Terjadi kesalahan sistem.')]
                });
            }

            const embed: EmbedOptions = {
                title: `📝 Transaksi FINTRAC Dicatat: ${action.toUpperCase()} ${ticker}`,
                color: action === 'buy' ? 0x5865F2 : 0x57F287,
                fields: [
                    { name: 'Aksi', value: action.toUpperCase(), inline: true },
                    { name: 'Saham', value: ticker, inline: true },
                    { name: 'Volume', value: `${lots} Lot (${lots * 100} lembar)`, inline: true },
                    { name: 'Harga Eksekusi', value: formatIdr(price), inline: true },
                    { name: 'Total Nilai', value: formatIdr(result.trade.value), inline: true },
                    { name: 'Sisa Saldo Kas', value: formatIdr(result.status?.cash ?? 0), inline: true },
                    { name: 'Total Transaksi', value: `${result.status?.total_trades} / 10`, inline: true }
                ],
                footer: { text: 'Transaksi disimpan di trades.json' },
                timestamp: new Date().toISOString()
            };

            return reply(message, { embeds: [embed] });
        }

        // 5. Scan & Midday
        if (subCommand === 'scan' || subCommand === 'midday') {
            const mode = subCommand as 'scan' | 'midday';
            const progressMsg = await reply(
                message,
                `🔍 **Alya sedang memindai seluruh konstituen IDX80 untuk setup momentum ${mode.toUpperCase()}...**\n*Proses ini memakan waktu ~10-25 detik via live market chart.* ⏳`
            );

            const result = await runFintracScan(mode);
            if (!result.success || !result.setups) {
                const errEmbed = createErrorEmbed('Gagal Memindai Pasar', result.error || 'Gagal mengeksekusi screener.');
                return progressMsg ? progressMsg.edit({ content: '', embeds: [errEmbed] }) : reply(message, { embeds: [errEmbed] });
            }

            const setups = result.setups;
            if (setups.length === 0) {
                const emptyEmbed = createInfoEmbed(
                    'Tidak Ada Setup High Conviction',
                    'Tidak ada saham IDX80 yang memenuhi kriteria breakout momentum saat ini. Pertahankan cash untuk menjaga modal!'
                );
                return progressMsg ? progressMsg.edit({ content: '', embeds: [emptyEmbed] }) : reply(message, { embeds: [emptyEmbed] });
            }

            const fields = setups.map((s, idx) => ({
                name: `#${idx + 1} ${s.ticker} — ${formatIdr(s.price)} (Skor: ${s.score.toFixed(1)}/100)`,
                value: `• **Alokasi:** \`${s.target_lots} Lot\` (${formatIdr(s.allocated_capital)})\n` +
                    `• **TP1 (+4.5%):** \`${formatIdr(s.tp1)}\` (Jual 50%)\n` +
                    `• **TP2 (+8.5%):** \`${formatIdr(s.tp2)}\` (Jual sisa 50%)\n` +
                    `• **Stop Loss (-2.8%):** \`${formatIdr(s.stop_loss)}\`\n` +
                    `• **RVOL:** \`${s.rvol.toFixed(2)}x\` | **RSI:** \`${s.rsi.toFixed(1)}\``,
                inline: false
            }));

            const embed: EmbedOptions = {
                title: `🔥 Top Momentum Setups IDX80 (${mode === 'scan' ? 'Prapasar 1D' : 'Midday Review 60M'})`,
                color: 0xFEE75C,
                description: `Peluang momentum swing FINTRAC 2026. Alokasi modal dihitung terkonsentrasi untuk ${setups.length} posisi:`,
                fields,
                footer: { text: 'FINTRAC 2026 • Gunakan lot sizing ketat & trailing stop di IDX Mobile' },
                timestamp: new Date().toISOString()
            };

            return progressMsg ? progressMsg.edit({ content: '', embeds: [embed] }) : reply(message, { embeds: [embed] });
        }

        return reply(
            message,
            `Subcommand tidak dikenal! Gunakan: \`${PREFIX}fintrac <scan | midday | quote | status | log | allow | revoke | users>\``
        );
    }
});
