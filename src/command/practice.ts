import { Message } from 'oceanic.js';

import { client } from '../Client';
import { defineCommand } from '../Command';
import { PREFIX } from '../constants';
import { CodingQuestion, CodingTopic, getRandomCodingQuestion } from '../data/codingQuiz';
import { topicAliases } from '../data/learningMaterial';
import { TOPIC_NAMES } from '../stats/store';
import { reply } from '../utils';

interface ActivePracticeSession {
    userId: string;
    question: CodingQuestion;
    timer: NodeJS.Timeout;
}

const activePractices = new Map<string, ActivePracticeSession>();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.channel) return;
    const channelId = message.channel.id;

    const session = activePractices.get(channelId);
    if (!session || session.userId !== message.author.id) return;

    const content = message.content.trim();
    if (content.toLowerCase().startsWith(PREFIX)) return; // ignore bot commands

    clearTimeout(session.timer);
    activePractices.delete(channelId);

    const q = session.question;
    const cleaned = content.toLowerCase();
    const stripped = cleaned.replace(/^[([{<"']+|[)\]}>"'.:]+$/g, '').trim();

    const isCorrect = q.answer.some(a => {
        const lowerA = a.toLowerCase();
        return lowerA === cleaned || lowerA === stripped;
    }) || q.name.toLowerCase() === cleaned;

    return reply(message, {
        embeds: [{
            title: isCorrect ? 'Benar! (Correct)' : 'Salah! (Wrong)',
            description:
                (isCorrect ? `Jawabanmu benar: **${q.name}**` : `Jawaban yang benar adalah **${q.name}**`) +
                (q.explanation ? `\n\n**Penjelasan:**\n${q.explanation}` : ''),
            color: isCorrect ? 0x57F287 : 0xED4245,
            footer: {
                text: `Mode Latihan (Bebas risiko) | Ketik "${PREFIX} practice" untuk latihan soal berikutnya`
            }
        }]
    });
});

export async function startPracticeQuestion(message: Message, topic?: CodingTopic) {
    if (!message.channel) return;
    const channelId = message.channel.id;

    if (activePractices.has(channelId)) {
        return reply(message, 'Sedang ada soal latihan aktif di channel ini! Jawab terlebih dahulu atau tunggu hingga 30 detik.');
    }

    const question = getRandomCodingQuestion(topic);
    const qTopicName = TOPIC_NAMES[question.topic];

    const timer = setTimeout(() => {
        if (activePractices.has(channelId)) {
            activePractices.delete(channelId);
            reply(message, {
                embeds: [{
                    title: 'Waktu Latihan Habis!',
                    description:
                        `Jawaban yang benar adalah **${question.name}**` +
                        (question.explanation ? `\n\n**Penjelasan:**\n${question.explanation}` : ''),
                    color: 0xED4245,
                    footer: { text: `Ketik "${PREFIX} practice" untuk mencoba soal lain` }
                }]
            });
        }
    }, 30000);

    activePractices.set(channelId, { userId: message.author.id, question, timer });

    let contentDesc = `**${question.question}**\n\n`;
    if (question.type === 'mc' && question.options) {
        contentDesc += question.options.join('\n');
    } else {
        contentDesc += '*(Ketik jawaban langsung di chat)*';
    }

    const typeBadge = question.type === 'mc' ? '[Pilihan Ganda]' : '[Isian / Konversi]';
    const diffBadge = question.difficulty === 'hard' ? ' [SOAL HARD]' : '';

    return reply(message, {
        embeds: [{
            title: `Latihan Soal: ${qTopicName} (Practice Mode)`,
            description: `${typeBadge}${diffBadge}\n\n${contentDesc}`,
            color: 0x5865F2,
            footer: {
                text: 'Mode Latihan (Tidak mempengaruhi nilai ujian) | Waktu: 30 Detik'
            }
        }]
    });
}

defineCommand({
    name: 'practice',
    description: 'Latihan soal',
    aliases: ['latihan', 'codepractice', 'drill'],
    usages: ['', '[php-basic | php-advance | devops | hardware]'],
    async run(message, args) {
        const input = args[0]?.toLowerCase();

        if (input === 'php') {
            const sub = args[1]?.toLowerCase();
            if (sub === 'advance' || sub === 'advanced') {
                return startPracticeQuestion(message, 'php-advance');
            }
            return startPracticeQuestion(message, 'php-basic');
        }

        const canonical = input ? (topicAliases[input] as CodingTopic | undefined) : undefined;
        return startPracticeQuestion(message, canonical);
    }
});
