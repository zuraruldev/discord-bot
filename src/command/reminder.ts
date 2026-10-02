import { defineCommand } from '../Command';
import { isAdmin, PREFIX } from '../constants';
import { sendDailyReminder } from '../module/reminder';
import {
    addScheduleItem,
    clearScheduleDay,
    getDayTimeInfo,
    getScheduleForDay,
    isWeekday,
    loadScheduleDb,
    normalizeDayName,
    removeScheduleItem,
    setReminderChannel,
    WEEKDAYS
} from '../schedule/store';
import { reply } from '../utils';

defineCommand({
    name: 'reminder',
    description: 'Force run class reminder or manage schedule',
    aliases: ['remind'],
    usages: ['', '[day]', 'setchannel', 'list', 'add <day> <time> <ruang> <matkul...>', 'remove <day> <index>', 'clear <day>'],
    adminOnly: true,
    hidden: true,
    async run(message, args) {
        if (!isAdmin(message.author.id)) {
            return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
        }

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'setchannel' || subCommand === 'channel') {
            if (!message.channel) return;
            const channelId = message.channel.id;
            await setReminderChannel(channelId);
            console.log(`[Reminder Debug] Reminder channel set to ${channelId} by ${message.author.tag} (${message.author.id})`);
            return reply(message, {
                embeds: [{
                    title: 'Channel Reminder Diperbarui',
                    description: `Channel reminder berhasil diatur ke <#${channelId}> (\`${channelId}\`).\nSetiap jam 5:00 AM (Senin - Jumat) pesan jadwal akan dikirim ke channel ini.`,
                    color: 0x57F287
                }]
            });
        }

        if (subCommand === 'add') {
            const day = args[1];
            const timeRaw = args[2];
            const tempat = args[3];
            const matkul = args.slice(4).join(' ');

            if (!day || !timeRaw || !tempat || !matkul) {
                return reply(message, `Gunakan: \`${PREFIX} reminder add <day> <time> <ruang> <matkul...>\`\nContoh: \`${PREFIX} reminder add senin 08:00-10:00 Lab-1 Pemrograman Web\``);
            }

            const timeParts = timeRaw.split('-');
            const timeStarted = timeParts[0] || timeRaw;
            const timeEnded = timeParts[1] || '';

            const res = await addScheduleItem(day, {
                matkul,
                time: timeRaw,
                timeStarted,
                timeEnded,
                tempat
            });

            if (!res.success) {
                return reply(message, `Gagal menambahkan jadwal: ${res.error}`);
            }

            return reply(message, {
                embeds: [{
                    title: 'Jadwal Ditambahkan',
                    description: `Mata kuliah **${matkul}** berhasil ditambahkan ke hari **${res.dayKey}**.\nWaktu: \`${timeRaw}\` | Ruang: \`${tempat}\``,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (subCommand === 'remove' || subCommand === 'rm' || subCommand === 'del') {
            const day = args[1];
            const index = parseInt(args[2], 10);

            if (!day || isNaN(index)) {
                return reply(message, `Gunakan: \`${PREFIX} reminder remove <day> <nomor_index>\`\nContoh: \`${PREFIX} reminder remove senin 1\``);
            }

            const res = await removeScheduleItem(day, index);
            if (!res.success) {
                return reply(message, `Gagal menghapus jadwal: ${res.error}`);
            }

            return reply(message, {
                embeds: [{
                    title: 'Jadwal Dihapus',
                    description: `Jadwal no **${index}** (${res.removed?.matkul || '-'}) pada hari **${res.dayKey}** telah dihapus.`,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (subCommand === 'clear') {
            const day = args[1];
            if (!day) {
                return reply(message, `Gunakan: \`${PREFIX} reminder clear <day>\`\nContoh: \`${PREFIX} reminder clear senin\``);
            }

            const res = await clearScheduleDay(day);
            if (!res.success) {
                return reply(message, `Gagal membersihkan jadwal: ${res.error}`);
            }

            return reply(message, {
                embeds: [{
                    title: 'Jadwal Dibersihkan',
                    description: `Semua jadwal untuk hari **${res.dayKey}** telah dibersihkan.`,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
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
                    ? items.map((it, idx) => `> **${idx + 1}. ${it.matkul}**\n> Waktu: ${it.time} | Tempat: ${it.tempat}`).join('\n\n')
                    : '> *Tidak ada jadwal*';

                return {
                    name: `${capitalizedDay}${isToday ? ' (Hari Ini)' : ''} [${items.length}/3 Matkul]`,
                    value: text,
                    inline: false
                };
            });

            return reply(message, {
                embeds: [{
                    title: 'Jadwal Pembelajaran Mingguan (Senin - Jumat)',
                    description: `> Channel: ${db.channelId ? `<#${db.channelId}>` : `*Belum diatur (gunakan \`${PREFIX} reminder setchannel\`)*`} | Timezone: \`${timeZone}\``,
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
                        title: 'Hari Tidak Valid',
                        description: `Hari \`${subCommand}\` tidak dikenali.\n\nPilihan hari belajar (Senin - Jumat):\n\`monday\`, \`tuesday\`, \`wednesday\`, \`thursday\`, \`friday\`\natau: \`senin\`, \`selasa\`, \`rabu\`, \`kamis\`, \`jumat\`.`,
                        color: 0xED4245
                    }]
                });
            }

            if (!isWeekday(normalized)) {
                return reply(message, {
                    embeds: [{
                        title: 'Tidak Ada Study Jam',
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
                        title: 'Hari Ini Akhir Pekan',
                        description: `Hari ini **${timeInfo.calendarStr}** tidak memiliki study jam (jadwal kuliah hanya Senin sampai Jumat).\n\nUntuk mengetes hari kerja, gunakan:\n\`${PREFIX} reminder monday\`\n\`${PREFIX} reminder selasa\``,
                        color: 0x5865F2
                    }]
                });
            }
        }

        const configuredChannelId = process.env.MATKUL_CHANNEL_ID || process.env.REMINDER_CHANNEL_ID || db.channelId;
        const targetChannelId = configuredChannelId || message.channel?.id;

        if (!targetChannelId) {
            return reply(message, 'Channel tidak ditemukan.');
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
                    title: 'Gagal Mengirim Reminder',
                    description: `Terjadi error: \`${result.error}\`\nSilakan cek log terminal untuk detail.`,
                    color: 0xED4245
                }]
            });
        }

        if (message.channel && message.channel.id !== targetChannelId) {
            await reply(message, {
                embeds: [{
                    title: 'Reminder Berhasil Terkirim (Force Run)',
                    description: `Pesan reminder untuk hari **${result.dayKey}** telah dikirim ke <#${targetChannelId}>.\nLog debugging telah dicetak ke console.`,
                    color: 0x57F287
                }]
            });
        }
    }
});
