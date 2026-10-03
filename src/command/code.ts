import { Message } from 'oceanic.js';

import { client } from '../Client';
import { defineCommand } from '../Command';
import { PREFIX } from '../constants';
import { CodingQuestion, CodingTopic, getExamQuestions } from '../data/codingQuiz';
import { topicAliases } from '../data/learningMaterial';
import { getUserStats, recordExamResult, TOPIC_NAMES, TOPIC_TITLES } from '../stats/store';
import { reply } from '../utils';
import { startPracticeQuestion } from './practice';

interface PendingConfirmation {
    userId: string;
    topic: CodingTopic;
    timer: NodeJS.Timeout;
}

interface ActiveExamSession {
    userId: string;
    topic: CodingTopic;
    questions: CodingQuestion[];
    currentIndex: number;
    answers: {
        question: CodingQuestion;
        userAnswer: string;
        isCorrect: boolean;
    }[];
    correctCount: number;
    startTime: number;
    masterTimer: NodeJS.Timeout;
}

const pendingConfirmations = new Map<string, PendingConfirmation>();
const activeExams = new Map<string, ActiveExamSession>();

function formatRemainingTime(startTime: number): string {
    const elapsedMs = Date.now() - startTime;
    const remainingSec = Math.max(0, Math.floor((600000 - elapsedMs) / 1000));
    const minutes = Math.floor(remainingSec / 60);
    const seconds = remainingSec % 60;
    return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
}

async function sendQuestion(message: Message, session: ActiveExamSession) {
    if (!message.channel) return;
    const q = session.questions[session.currentIndex];
    const qNum = session.currentIndex + 1;
    const timeStr = formatRemainingTime(session.startTime);

    let contentDesc = `**${q.question}**\n\n`;
    if (q.type === 'mc' && q.options) {
        contentDesc += q.options.join('\n');
    } else {
        contentDesc += '*(Ketik jawaban langsung di chat)*';
    }

    const typeBadge = q.type === 'mc' ? '[Pilihan Ganda]' : '[Isian / Perhitungan]';
    const diffBadge = q.difficulty === 'hard' ? ' [SOAL HARD]' : '';

    return reply(message, {
        embeds: [{
            title: `Ujian ${TOPIC_NAMES[session.topic]} - Soal ${qNum} dari 20`,
            description: `${typeBadge}${diffBadge}\n\n${contentDesc}`,
            color: 0x5865F2,
            footer: {
                text: `Sisa Waktu: ${timeStr} | Soal ${qNum}/20 | Ketik "menyerah" untuk mengakhiri`
            }
        }]
    });
}

async function finishExam(message: Message, session: ActiveExamSession, isTimeout = false) {
    if (!message.channel) return;
    clearTimeout(session.masterTimer);
    activeExams.delete(message.channel.id);

    const totalQuestions = 20;
    const correctCount = session.correctCount;
    const timeTakenSec = Math.min(600, Math.floor((Date.now() - session.startTime) / 1000));
    const minutes = Math.floor(timeTakenSec / 60);
    const seconds = timeTakenSec % 60;

    const result = await recordExamResult(
        session.userId,
        session.topic,
        correctCount,
        totalQuestions,
        message.author.username
    );

    let note = '';
    if (result.passed) {
        if (result.isFirstTry) {
            note = 'Luar biasa! Kamu berhasil lulus pada percobaan pertama (First Try) dan meraih Grade S serta gelar sertifikasi resmi!';
        } else {
            note = `Selamat! Kamu berhasil lulus melalui ujian ulang (Retake ke-${result.attemptNumber}). Gelar sertifikasi telah terbuka dengan Grade B (Retake Pass).`;
        }
    } else {
        if (result.isFirstTry) {
            note = `Kamu belum mencapai standar kelulusan 90%. Percobaan pertama dicatat. Pelajari kembali materi dengan "${PREFIX} learn ${session.topic}" sebelum mengambil ujian ulang.`;
        } else {
            note = `Kamu belum mencapai standar kelulusan 90% pada percobaan ke-${result.attemptNumber}. Pelajari materi dengan "${PREFIX} learn ${session.topic}" dan coba kembali.`;
        }
    }

    if (isTimeout) {
        note = `Waktu 10 menit telah habis! ${note}`;
    }

    return reply(message, {
        embeds: [{
            title: `Hasil Akhir Ujian: ${TOPIC_NAMES[session.topic]}`,
            description: `Ringkasan performa ujian kamu:\n════════════════════════════════════\n${note}`,
            color: result.passed ? 0x57F287 : 0xED4245,
            fields: [
                {
                    name: 'Status Kelulusan',
                    value: result.passed ? 'LULUS (PASSED)' : 'TIDAK LULUS (FAILED)',
                    inline: true
                },
                {
                    name: 'Skor Akhir',
                    value: `**${correctCount} / ${totalQuestions}** (${result.percentage}%)`,
                    inline: true
                },
                {
                    name: 'Standar Lulus',
                    value: 'Minimal 18 Benar (90%)',
                    inline: true
                },
                {
                    name: 'Grade Pencapaian',
                    value: `**${result.grade}**`,
                    inline: true
                },
                {
                    name: 'Gelar / Title Sertifikasi',
                    value: result.title ? `**${result.title}**` : '(Belum diraih - Butuh >= 90%)',
                    inline: true
                },
                {
                    name: 'Waktu Pengerjaan',
                    value: `${minutes} menit ${seconds} detik (Maks 10 menit)`,
                    inline: true
                }
            ],
            footer: {
                text: `Lihat profil lengkap dan semua gelarmu dengan: ${PREFIX} stats`
            },
            timestamp: new Date().toISOString()
        }]
    });
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.channel) return;
    const channelId = message.channel.id;
    const content = message.content.trim();

    // 1. Check for Pending Confirmation
    const pending = pendingConfirmations.get(channelId);
    if (pending && pending.userId === message.author.id) {
        const lower = content.toLowerCase();
        if (['batal', 'cancel', 'tidak', 'no'].includes(lower)) {
            clearTimeout(pending.timer);
            pendingConfirmations.delete(channelId);
            return reply(message, {
                embeds: [{
                    title: 'Ujian Dibatalkan',
                    description: 'Kamu membatalkan ujian. Statistikmu aman dan tidak berubah.',
                    color: 0x5865F2
                }]
            });
        }

        if (['mulai', 'lanjut', 'ya', 'yes', 'start', 'ok', 'oke'].includes(lower)) {
            clearTimeout(pending.timer);
            pendingConfirmations.delete(channelId);

            const questions = getExamQuestions(pending.topic);
            const masterTimer = setTimeout(() => {
                const active = activeExams.get(channelId);
                if (active) {
                    finishExam(message, active, true);
                }
            }, 600000); // 10 minutes

            const session: ActiveExamSession = {
                userId: message.author.id,
                topic: pending.topic,
                questions,
                currentIndex: 0,
                answers: [],
                correctCount: 0,
                startTime: Date.now(),
                masterTimer
            };

            activeExams.set(channelId, session);

            await reply(message, {
                embeds: [{
                    title: `Ujian Dimulai: ${TOPIC_NAMES[pending.topic]}`,
                    description:
                        'Waktu 10 Menit telah berjalan!\n' +
                        'Ujian berisi **20 soal (10 Pilihan Ganda & 10 Isian/Konversi)**.\n' +
                        'Jawablah setiap soal sebaik mungkin. Ketik `menyerah` jika ingin berhenti.',
                    color: 0x57F287
                }]
            });

            return sendQuestion(message, session);
        }

        return; // wait for confirmation or timeout
    }

    // 2. Check for Active Exam
    const session = activeExams.get(channelId);
    if (!session || session.userId !== message.author.id) return;

    if (content.toLowerCase().startsWith(PREFIX)) return; // ignore bot commands

    const lower = content.toLowerCase();
    if (['menyerah', 'surrender', 'quit', 'keluar', 'batal'].includes(lower)) {
        return finishExam(message, session, false);
    }

    const currentQ = session.questions[session.currentIndex];
    const cleaned = lower.trim();
    const stripped = cleaned.replace(/^[([{<"']+|[)\]}>"'.:]+$/g, '').trim();

    const isCorrect = currentQ.answer.some(a => {
        const lowerA = a.toLowerCase();
        return lowerA === cleaned || lowerA === stripped;
    }) || currentQ.name.toLowerCase() === cleaned;

    session.answers.push({
        question: currentQ,
        userAnswer: content,
        isCorrect
    });

    if (isCorrect) {
        session.correctCount++;
    }

    session.currentIndex++;

    if (session.currentIndex >= 20) {
        return finishExam(message, session, false);
    }

    return sendQuestion(message, session);
});

async function initiateExam(message: Message, topic: CodingTopic) {
    if (!message.channel) return;
    const channelId = message.channel.id;

    if (activeExams.has(channelId)) {
        return reply(message, 'Sedang ada sesi ujian aktif yang berlangsung di channel ini! Tunggu hingga selesai.');
    }

    if (pendingConfirmations.has(channelId)) {
        return reply(message, 'Sedang ada konfirmasi ujian yang menunggu di channel ini. Ketik `mulai` atau `batal`.');
    }

    const userStats = getUserStats(message.author.id, message.author.username);
    const prevExam = userStats.exams[topic];
    const isFirstTry = prevExam.attempts === 0;

    let warningText = '';
    if (isFirstTry) {
        warningText =
            '• **PERINGATAN PERCOBAAN PERTAMA (FIRST TRY)**:\n' +
            '  Ujian pertama kali bernilai sangat prestisius (**Grade S / Summa Cum Laude**).\n' +
            '  Jika kamu gagal pada percobaan pertama, ujian ulang berikutnya maksimal hanya akan mendapatkan **Grade B (Retake Pass)**!\n' +
            '  Pastikan kamu sudah mempelajari materi dengan matang sebelum mengonfirmasi!';
    } else {
        warningText =
            `• **CATATAN UJIAN ULANG (RETAKE KE-${prevExam.attempts + 1})**:\n` +
            `  Skor tertinggi kamu sebelumnya: **${prevExam.bestScore}%** (Status: ${prevExam.passed ? 'Sudah Lulus' : 'Belum Lulus'}).\n` +
            '  Karena ini adalah ujian ulang, grade tertinggi yang bisa diraih adalah **Grade B (Retake Pass)**.';
    }

    const timer = setTimeout(() => {
        if (pendingConfirmations.has(channelId)) {
            pendingConfirmations.delete(channelId);
            reply(message, {
                embeds: [{
                    title: 'Konfirmasi Ujian Kedaluwarsa',
                    description: 'Waktu konfirmasi 60 detik telah habis. Ujian dibatalkan secara otomatis.',
                    color: 0xED4245
                }]
            });
        }
    }, 60000);

    pendingConfirmations.set(channelId, { userId: message.author.id, topic, timer });

    return reply(message, {
        embeds: [{
            title: `Konfirmasi Memulai Ujian: ${TOPIC_NAMES[topic]}`,
            description:
                `Kamu akan memulai sesi ujian resmi **${TOPIC_NAMES[topic]}**.\n\n` +
                '**Spesifikasi Ujian:**\n' +
                '• Durasi Waktu: **10 Menit (600 Detik)**\n' +
                '• Jumlah Soal: **20 Soal** (10 Pilihan Ganda & 10 Isian / Perhitungan Konversi)\n' +
                '• Komposisi: 16 Soal Standar & **4 Soal HARD (20%)**\n' +
                '• Syarat Kelulusan: **Minimal 90% (18/20 Benar)** untuk lulus dan meraih gelar **' + TOPIC_TITLES[topic] + '**\n\n' +
                warningText + '\n\n' +
                `Belum siap? Pelajari materi terlebih dahulu dengan: \`${PREFIX} learn ${topic}\`\n\n` +
                'Ketik **`mulai`** atau **`ya`** untuk memulai sekarang.\n' +
                'Ketik **`batal`** untuk membatalkan.',
            color: 0xFEE75C,
            footer: {
                text: 'Konfirmasi berlaku selama 60 detik'
            }
        }]
    });
}

function showExamMenu(message: Message) {
    return reply(message, {
        embeds: [{
            title: 'Coding Quiz & Exam System',
            description:
                'Sistem ujian kompetensi pemrograman, DevOps, dan hardware komputer.\n' +
                'Format ujian: **10 Menit | 20 Soal (50% PG & 50% Isian) | Syarat Lulus >= 90%**.\n' +
                'Lulus pada percobaan pertama (First Try) bernilai **Grade S**!\n\n' +
                'Pilih topik ujian yang ingin kamu ikuti:',
            color: 0x5865F2,
            fields: [
                {
                    name: '1. PHP Dasar (Basic)',
                    value: `Variabel, perulangan, array, built-in functions, superglobals.\nGelar: \`${TOPIC_TITLES['php-basic']}\`\nPerintah: \`${PREFIX} code php-basic\` atau \`${PREFIX} php basic\``,
                    inline: false
                },
                {
                    name: '2. PHP Lanjutan (Advance)',
                    value: `Match expression, nullsafe (?->), traits, magic methods, PDO, PSR-4, OPcache.\nGelar: \`${TOPIC_TITLES['php-advance']}\`\nPerintah: \`${PREFIX} code php-advance\` atau \`${PREFIX} php advance\``,
                    inline: false
                },
                {
                    name: '3. DevOps & Jaringan Server',
                    value: `Konversi biner IPv4, subnetting CIDR, IPv6, port SSH/HTTPS, systemd, Docker, Kubernetes.\nGelar: \`${TOPIC_TITLES['devops']}\`\nPerintah: \`${PREFIX} code devops\` atau \`${PREFIX} devops\``,
                    inline: false
                },
                {
                    name: '4. Computer Hardware',
                    value: `Arsitektur CPU (ALU, SRAM cache), SATA III (6.0 Gb/s), NVMe PCIe, RAM (SO-DIMM, ECC), motherboard, CR2032.\nGelar: \`${TOPIC_TITLES['hardware']}\`\nPerintah: \`${PREFIX} code hardware\` atau \`${PREFIX} hardware\``,
                    inline: false
                },
                {
                    name: '5. Mode Latihan Bebas Risiko (Practice Mode)',
                    value: `Latihan 1 soal acak seperti kuis geografi tanpa memicu ujian dan tidak mempengaruhi statistik:\nPerintah: \`${PREFIX} practice [topik]\` atau \`${PREFIX} code practice [topik]\``,
                    inline: false
                },
                {
                    name: 'Pusat Materi Belajar',
                    value: `Sangat disarankan membaca materi sebelum ujian: \`${PREFIX} learn [topik]\``,
                    inline: false
                }
            ],
            footer: { text: `Contoh: ${PREFIX} code php-basic` }
        }]
    });
}

defineCommand({
    name: 'code',
    description: 'Code quiz',
    aliases: ['coding', 'quizcode', 'exam'],
    usages: ['', 'php-basic', 'php-advance', 'devops', 'hardware', 'list'],
    async run(message, args) {
        const input = args[0]?.toLowerCase();

        if (!input || input === 'list' || input === 'help') {
            return showExamMenu(message);
        }

        if (input === 'practice' || input === 'latihan') {
            const sub = args[1]?.toLowerCase();
            const canonical = sub ? (topicAliases[sub] as CodingTopic | undefined) : undefined;
            return startPracticeQuestion(message, canonical);
        }

        // Support "code php basic" or "code php advance"
        if (input === 'php') {
            const sub = args[1]?.toLowerCase();
            if (sub === 'advance' || sub === 'advanced') {
                return initiateExam(message, 'php-advance');
            }
            return initiateExam(message, 'php-basic');
        }

        const canonical = topicAliases[input] as CodingTopic | undefined;
        if (canonical && TOPIC_NAMES[canonical]) {
            return initiateExam(message, canonical);
        }

        return reply(message, {
            embeds: [{
                title: 'Topik Ujian Tidak Ditemukan',
                description:
                    `Topik \`${args[0]}\` tidak valid.\n\n` +
                    'Topik ujian yang tersedia:\n' +
                    '• `php-basic` (atau `php basic`)\n' +
                    '• `php-advance` (atau `php advance`)\n' +
                    '• `devops`\n' +
                    '• `hardware`\n\n' +
                    `Gunakan \`${PREFIX} code\` untuk melihat daftar lengkap, atau \`${PREFIX} learn\` untuk belajar terlebih dahulu.`,
                color: 0xED4245
            }]
        });
    }
});

defineCommand({
    name: 'php',
    description: 'PHP quiz',
    aliases: ['phpquiz'],
    usages: ['', 'basic', 'advance'],
    async run(message, args) {
        const sub = args[0]?.toLowerCase();
        if (sub === 'advance' || sub === 'advanced') {
            return initiateExam(message, 'php-advance');
        }
        return initiateExam(message, 'php-basic');
    }
});

defineCommand({
    name: 'devops',
    description: 'DevOps quiz',
    aliases: ['devopsquiz'],
    usages: [''],
    async run(message) {
        return initiateExam(message, 'devops');
    }
});

defineCommand({
    name: 'hardware',
    description: 'Computer hardware quiz',
    aliases: ['hw', 'computer', 'hardwarequiz'],
    usages: [''],
    async run(message) {
        return initiateExam(message, 'hardware');
    }
});
