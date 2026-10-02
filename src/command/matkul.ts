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
    name: 'matkul',
    description: 'Lihat atau kelola jadwal mata kuliah',
    aliases: ['jadwal', 'kuliah', 'schedule', 'classes'],
    usages: [
        '',
        '[hari]',
        'list',
        'send [hari]',
        'add <hari> <waktu> <ruang> <nama_matkul...>',
        'remove <hari> <index>',
        'clear <hari>',
        'setchannel [channelId]'
    ],
    async run(message, args) {
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'setchannel' || subCommand === 'channel') {
            if (!isAdmin(message.author.id)) {
                return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
            }

            const channelId = args[1]?.replace(/[<#>]/g, '') || message.channel?.id;
            if (!channelId) {
                return reply(message, 'Channel tidak valid.');
            }

            await setReminderChannel(channelId);
            return reply(message, {
                embeds: [{
                    title: 'Channel Matkul Diperbarui',
                    description: `Channel jadwal matkul diatur ke <#${channelId}> (\`${channelId}\`).\nSetiap jam 5:00 AM (Senin - Jumat) pesan jadwal otomatis dikirim ke channel ini.`,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (subCommand === 'add') {
            if (!isAdmin(message.author.id)) {
                return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
            }

            const day = args[1];
            const timeRaw = args[2];
            const tempat = args[3];
            const matkul = args.slice(4).join(' ');

            if (!day || !timeRaw || !tempat || !matkul) {
                return reply(message, `Gunakan: \`${PREFIX} matkul add <hari> <waktu> <ruang> <nama_matkul...>\`\nContoh: \`${PREFIX} matkul add senin 08:00-10:00 Lab-1 Pemrograman Web\``);
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
            if (!isAdmin(message.author.id)) {
                return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
            }

            const day = args[1];
            const index = parseInt(args[2], 10);

            if (!day || isNaN(index)) {
                return reply(message, `Gunakan: \`${PREFIX} matkul remove <hari> <nomor_index>\`\nContoh: \`${PREFIX} matkul remove senin 1\``);
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
            if (!isAdmin(message.author.id)) {
                return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
            }

            const day = args[1];
            if (!day) {
                return reply(message, `Gunakan: \`${PREFIX} matkul clear <hari>\`\nContoh: \`${PREFIX} matkul clear senin\``);
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

        if (subCommand === 'send') {
            if (!isAdmin(message.author.id)) {
                return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
            }

            const db = await loadScheduleDb();

            let targetDay: string | undefined;
            if (args[1]) {
                const norm = normalizeDayName(args[1]);
                if (!norm || !isWeekday(norm)) {
                    return reply(message, `Hari \`${args[1]}\` tidak valid untuk pengiriman reminder.`);
                }
                targetDay = norm;
            }

            const targetChannelId = process.env.MATKUL_CHANNEL_ID || process.env.REMINDER_CHANNEL_ID || db.channelId || message.channel?.id;
            if (!targetChannelId) {
                return reply(message, 'Channel target belum diatur.');
            }

            const result = await sendDailyReminder({
                channelId: targetChannelId,
                day: targetDay,
                forced: true
            });

            if (!result.success) {
                return reply(message, `Gagal mengirim reminder: ${result.error}`);
            }

            return reply(message, {
                embeds: [{
                    title: 'Reminder Terkirim',
                    description: `Pesan jadwal kuliah hari **${result.dayKey}** telah dikirim ke <#${targetChannelId}>.`,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (subCommand === 'list' || subCommand === 'all') {
            const db = await loadScheduleDb();
            const timeZone = (process.env.REMINDER_TIMEZONE || db.timezone || 'Asia/Jakarta') as string;
            const timeInfo = getDayTimeInfo(new Date(), timeZone);
            const targetChannelId = process.env.MATKUL_CHANNEL_ID || process.env.REMINDER_CHANNEL_ID || db.channelId;

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
                    title: 'Jadwal Perkuliahan Mingguan (Senin - Jumat)',
                    description: `> Channel: ${targetChannelId ? `<#${targetChannelId}>` : '*Belum diatur*'} | Timezone: \`${timeZone}\``,
                    fields,
                    color: 0x5865F2,
                    footer: { text: `Gunakan "${PREFIX} matkul [hari]" untuk melihat hari tertentu` },
                    timestamp: new Date().toISOString()
                }]
            });
        }

        const db = await loadScheduleDb();
        const timeZone = (process.env.REMINDER_TIMEZONE || db.timezone || 'Asia/Jakarta') as string;
        const timeInfo = getDayTimeInfo(new Date(), timeZone);

        if (subCommand) {
            const normalized = normalizeDayName(subCommand);
            if (!normalized) {
                return reply(message, `Hari \`${subCommand}\` tidak dikenali.\nPilihan: senin, selasa, rabu, kamis, jumat, atau list.`);
            }

            if (!isWeekday(normalized)) {
                return reply(message, {
                    embeds: [{
                        title: 'Tidak Ada Perkuliahan',
                        description: `> Hari **${subCommand}** adalah akhir pekan.\n> Tidak ada jadwal kuliah pada hari Sabtu dan Minggu.`,
                        color: 0x5865F2,
                        timestamp: new Date().toISOString()
                    }]
                });
            }

            const items = getScheduleForDay(db, normalized);
            const capitalizedDay = normalized.charAt(0).toUpperCase() + normalized.slice(1);
            const description = items.length > 0
                ? items.map((it, idx) => `> **${idx + 1}. ${it.matkul}**\n> Waktu: ${it.time}\n> Tempat: ${it.tempat}`).join('\n\n')
                : '> *Tidak ada jadwal mata kuliah pada hari ini.*';

            return reply(message, {
                embeds: [{
                    title: `Jadwal Kuliah - ${capitalizedDay}`,
                    description,
                    color: 0x5865F2,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (!isWeekday(timeInfo.dayKey)) {
            return reply(message, {
                embeds: [{
                    title: `Jadwal Kuliah - ${timeInfo.calendarStr}`,
                    description: `> Hari ini akhir pekan. Tidak ada jadwal perkuliahan.\n>\n> Gunakan \`${PREFIX} matkul list\` untuk melihat jadwal mingguan atau \`${PREFIX} matkul senin\` untuk hari tertentu.`,
                    color: 0x5865F2,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        const items = getScheduleForDay(db, timeInfo.dayKey);
        const description = items.length > 0
            ? items.map((it, idx) => `> **${idx + 1}. ${it.matkul}**\n> Waktu: ${it.time}\n> Tempat: ${it.tempat}`).join('\n\n')
            : '> *Tidak ada jadwal mata kuliah hari ini.*';

        return reply(message, {
            embeds: [{
                title: `Jadwal Kuliah Hari Ini - ${timeInfo.calendarStr}`,
                description,
                color: 0x5865F2,
                footer: { text: `Gunakan "${PREFIX} matkul list" untuk melihat jadwal satu minggu` },
                timestamp: new Date().toISOString()
            }]
        });
    }
});
