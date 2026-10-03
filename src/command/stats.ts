import { Message } from 'oceanic.js';

import { client } from '../Client';
import { defineCommand } from '../Command';
import { PREFIX } from '../constants';
import { getUserStats, TOPIC_NAMES } from '../stats/store';
import { ExamTopic } from '../stats/types';
import { reply } from '../utils';
import { getUserInfo } from '../wordle/store';

export async function createUnifiedStatsEmbed(targetUserId: string, targetUsername: string, avatarUrl?: string) {
    const userStats = getUserStats(targetUserId, targetUsername);
    const wordleUser = getUserInfo(targetUserId, targetUsername);

    // 1. Coding & Exam Section
    const topics: ExamTopic[] = ['php-basic', 'php-advance', 'devops', 'hardware'];
    const examLines = topics.map(t => {
        const rec = userStats.exams[t];
        const name = TOPIC_NAMES[t];
        if (rec.attempts === 0) {
            return `• **${name}**: Belum pernah mengambil ujian`;
        }
        const statusText = rec.passed ? 'LULUS' : 'BELUM LULUS';
        const firstTryStr = rec.firstTryScore !== null ? `${rec.firstTryScore}%` : '-';
        return (
            `• **${name}** [${statusText}]\n` +
            `  Skor Terbaik: **${rec.bestScore}%** | First Try: **${firstTryStr}**\n` +
            `  Grade: **${rec.grade}** | Total Percobaan: **${rec.attempts}**`
        );
    });

    const titlesDisplay = userStats.titles.length > 0
        ? userStats.titles.map(t => `\`${t}\``).join(' ')
        : '*(Belum ada gelar — Lulus ujian dengan skor >= 90% untuk membuka gelar)*';

    // 2. Wordle Section
    const wStats = wordleUser.stats;
    const totalWordle = wStats.wins + wStats.losses + wStats.surrenders;
    const wordleWinRate = totalWordle > 0 ? Math.round((wStats.wins / totalWordle) * 100) : 0;
    const wordleLangs = Object.entries(wStats.games)
        .map(([lang, count]) => `${lang.toUpperCase()}: ${count}`)
        .join(' | ');

    // 3. Geography Section
    const gStats = userStats.geography;
    const geoAcc = gStats.totalAnswered > 0 ? Math.round((gStats.correct / gStats.totalAnswered) * 100) : 0;

    return {
        title: `Profil & Statistik Kuis — ${targetUsername}`,
        description:
            `**Gelar Sertifikasi Terbuka:**\n${titlesDisplay}\n` +
            '════════════════════════════════════',
        color: 0x5865F2,
        thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
        fields: [
            {
                name: `Ujian Coding & Hardware (${userStats.totalExamsPassed}/4 Ujian Lulus)`,
                value: examLines.join('\n'),
                inline: false
            },
            {
                name: 'Wordle & Katla Quiz',
                value:
                    `• Menang: **${wStats.wins}** | Kalah: **${wStats.losses}** | Menyerah: **${wStats.surrenders}**\n` +
                    `• Total Game: **${totalWordle}** | Win Rate: **${wordleWinRate}%**\n` +
                    `• Bahasa: ${wordleLangs || 'Belum ada data'}`,
                inline: false
            },
            {
                name: 'Geography Trivia Quiz',
                value:
                    `• Soal Dijawab: **${gStats.totalAnswered}**\n` +
                    `• Benar: **${gStats.correct}** | Salah: **${gStats.wrong}**\n` +
                    `• Akurasi: **${geoAcc}%**`,
                inline: false
            }
        ],
        footer: {
            text: `Ujian: ${PREFIX} code | Belajar: ${PREFIX} learn | Wordle: ${PREFIX} wordy | Trivia: ${PREFIX} flag`
        },
        timestamp: new Date().toISOString()
    };
}

defineCommand({
    name: 'stats',
    description: 'Lihat statistik terpadu kuis coding, wordle, dan geografi',
    aliases: ['profil', 'profile', 'stat'],
    usages: ['', '[@user]'],
    async run(message: Message, args: string[]) {
        let targetUserId = message.author.id;
        let targetUsername = message.author.username;
        let avatarUrl = message.author.avatarURL('png');

        if (args[0]) {
            const mentionMatch = args[0].match(/<@!?(\d+)>/) || args[0].match(/^(\d{17,20})$/);
            if (mentionMatch) {
                const id = mentionMatch[1];
                const foundUser = client.users.get(id);
                if (foundUser) {
                    targetUserId = foundUser.id;
                    targetUsername = foundUser.username;
                    avatarUrl = foundUser.avatarURL('png');
                } else {
                    targetUserId = id;
                    targetUsername = `User (${id})`;
                }
            }
        }

        const embed = await createUnifiedStatsEmbed(targetUserId, targetUsername, avatarUrl);
        return reply(message, { embeds: [embed] });
    }
});
