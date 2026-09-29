import { defineCommand } from '../Command';
import { DEFAULT_REMINDER_USER_ID, PREFIX } from '../constants';
import { sendDailyReminder } from '../module/reminder';
import {
    getDayTimeInfo,
    getScheduleForDay,
    isWeekday,
    loadScheduleDb,
    normalizeDayName,
    setReminderChannel,
    WEEKDAYS
} from '../schedule/store';
import { reply } from '../utils';

defineCommand({
    name: 'reminder',
    description: 'Force run class reminder or manage schedule',
    aliases: ['remind', 'jadwal', 'schedule'],
    usages: ['', '[day]', 'setchannel', 'list'],
    async run(message, args) {
        if (message.author.id !== DEFAULT_REMINDER_USER_ID) {
            return reply(message, `❌ Command ini hanya dapat digunakan oleh <@${DEFAULT_REMINDER_USER_ID}>.`);
        }

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'setchannel' || subCommand === 'channel') {
            if (!message.channel) return;
            const channelId = message.channel.id;
            await setReminderChannel(channelId);
            console.log(`[Reminder Debug] Reminder channel set to ${channelId} by ${message.author.tag} (${message.author.id})`);
            return reply(message, {
                embeds: [{
                    title: '✅ Channel Reminder Diperbarui',
                    description: `Channel reminder berhasil diatur ke <#${channelId}> (\`${channelId}\`).\nSetiap jam 5:00 AM (Senin - Jumat) pesan jadwal akan dikirim ke channel ini.`,
                    color: 0x57F287
                }]
            });
        }

        if (subCommand === 'list' || subCommand === 'all') {
            const db = await loadScheduleDb();
            const timeZone = (process.env.REMINDER_TIMEZONE || db.timezone || 'Asia/Jakarta') as string;
            const timeInfo = getDayTimeInfo(new Date(), timeZone);

            const fields = WEEKDAYS.map(day => {
                const items = getScheduleForDay(db, day);
                const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
                const isToday = timeInfo.dayKey === day;

                const text = items.length > 0
                    ? items.map((it, idx) => `**${idx + 1}. ${it.matkul}**\n⏰ ${it.time} | 📍 ${it.tempat}`).join('\n\n')
                    : '*Tidak ada jadwal*';

                return {
                    name: `${isToday ? '👉 ' : ''}${capitalizedDay}${isToday ? ' (Hari Ini)' : ''} [${items.length}/3 Matkul]`,
                    value: text,
                    inline: false
                };
            });

            return reply(message, {
                embeds: [{
                    title: '📋 Jadwal Pembelajaran Mingguan (Senin - Jumat)',
                    description: `Channel: ${db.channelId ? `<#${db.channelId}>` : '*Belum diatur (gunakan `geo reminder setchannel`)*'}\nSabtu & Minggu: *Tidak ada study jam*\nMaksimal matkul per hari: 3\nTimezone: \`${timeZone}\``,
                    fields,
                    color: 0x5865F2,
                    footer: { text: `Gunakan "${PREFIX} reminder [hari]" untuk force test` }
                }]
            });
        }

        const db = await loadScheduleDb();
        const timeZone = (process.env.REMINDER_TIMEZONE || db.timezone || 'Asia/Jakarta') as string;
        const timeInfo = getDayTimeInfo(new Date(), timeZone);

        let targetDay: string | undefined;
        if (subCommand) {
            const normalized = normalizeDayName(subCommand);
            if (!normalized) {
                return reply(message, {
                    embeds: [{
                        title: '❌ Hari Tidak Valid',
                        description: `Hari \`${subCommand}\` tidak dikenali.\n\nPilihan hari belajar (Senin - Jumat):\n\`monday\`, \`tuesday\`, \`wednesday\`, \`thursday\`, \`friday\`\natau: \`senin\`, \`selasa\`, \`rabu\`, \`kamis\`, \`jumat\`.`,
                        color: 0xED4245
                    }]
                });
            }

            if (!isWeekday(normalized)) {
                return reply(message, {
                    embeds: [{
                        title: 'ℹ️ Tidak Ada Study Jam',
                        description: `Hari **${subCommand}** adalah akhir pekan. Tidak ada study jam pada hari Sabtu dan Minggu (hanya Senin sampai Jumat).`,
                        color: 0xED4245
                    }]
                });
            }

            targetDay = normalized;
        } else {
            if (!isWeekday(timeInfo.dayKey)) {
                return reply(message, {
                    embeds: [{
                        title: 'ℹ️ Hari Ini Akhir Pekan',
                        description: `Hari ini **${timeInfo.calendarStr}** tidak memiliki study jam (jadwal kuliah hanya Senin sampai Jumat).\n\nUntuk mengetes hari kerja, gunakan:\n\`${PREFIX} reminder monday\`\n\`${PREFIX} reminder selasa\``,
                        color: 0x5865F2
                    }]
                });
            }
        }

        const configuredChannelId = process.env.REMINDER_CHANNEL_ID || db.channelId;
        const targetChannelId = configuredChannelId || message.channel?.id;

        if (!targetChannelId) {
            return reply(message, '❌ Channel tidak ditemukan.');
        }

        console.log(`[Reminder Debug] Manual force-run triggered by ${message.author.tag} (${message.author.id})`);
        const result = await sendDailyReminder({
            channelId: targetChannelId,
            day: targetDay,
            forced: true
        });

        if (!result.success) {
            return reply(message, {
                embeds: [{
                    title: '❌ Gagal Mengirim Reminder',
                    description: `Terjadi error: \`${result.error}\`\nSilakan cek log terminal untuk detail.`,
                    color: 0xED4245
                }]
            });
        }

        if (message.channel && message.channel.id !== targetChannelId) {
            await reply(message, {
                embeds: [{
                    title: '✅ Reminder Berhasil Terkirim (Force Run)',
                    description: `Pesan reminder untuk hari **${result.dayKey}** telah dikirim ke <#${targetChannelId}>.\nLog debugging telah dicetak ke console.`,
                    color: 0x57F287
                }]
            });
        }
    }
});
