import { defineCommand } from '../Command';
import { PREFIX } from '../constants';
import { learningMaterials, topicAliases } from '../data/learningMaterial';
import { reply } from '../utils';

defineCommand({
    name: 'learn',
    aliases: ['materi', 'belajar'],
    description: 'Materi code quiz',
    usages: ['', '<topik> (php-basic, php-advance, devops, hardware)'],
    async run(message, args) {
        const inputTopic = args[0]?.toLowerCase();

        if (!inputTopic || inputTopic === 'list') {
            return reply(message, {
                embeds: [{
                    title: 'Pusat Materi Belajar Coding Quiz',
                    description:
                        'Pelajari materi berikut secara mendalam sebelum mengambil ujian! Ujian terdiri dari **20 soal (50% PG & 50% Isian/Konversi)** dengan batas waktu **10 menit**.\n' +
                        'Kamu memerlukan **minimal 90% (18/20 benar)** untuk lulus. Percobaan pertama (First Try) bernilai **Grade S**!\n\n' +
                        'Pilih materi yang ingin kamu pelajari:',
                    color: 0x5865F2,
                    fields: [
                        {
                            name: '1. PHP Dasar (Basic)',
                            value: `Variabel, tipe data, perulangan, array, built-in functions, superglobals.\nCommand: \`${PREFIX} learn php-basic\``,
                            inline: false
                        },
                        {
                            name: '2. PHP Lanjutan (Advance)',
                            value: `PHP 8+, match expression, nullsafe (?->), traits, magic methods, PDO, PSR-4, OPcache.\nCommand: \`${PREFIX} learn php-advance\``,
                            inline: false
                        },
                        {
                            name: '3. DevOps & Jaringan Server',
                            value: `Konversi biner IPv4, subnetting CIDR, IPv6, port SSH/HTTPS, systemd, Docker, Kubernetes.\nCommand: \`${PREFIX} learn devops\``,
                            inline: false
                        },
                        {
                            name: '4. Computer Hardware',
                            value: `Arsitektur CPU (ALU, SRAM cache), SATA III (6.0 Gb/s), NVMe PCIe, RAM (SO-DIMM, ECC), motherboard, CR2032.\nCommand: \`${PREFIX} learn hardware\``,
                            inline: false
                        }
                    ],
                    footer: { text: `Gunakan: ${PREFIX} learn <topik> | Contoh: ${PREFIX} learn php-basic` }
                }]
            });
        }

        const canonicalTopic = topicAliases[inputTopic];
        const material = canonicalTopic ? learningMaterials[canonicalTopic] : null;

        if (!material) {
            return reply(message, {
                embeds: [{
                    title: 'Topik Materi Tidak Ditemukan',
                    description: `Topik \`${args[0]}\` tidak valid.\n\nTopik materi yang tersedia:\n• \`php-basic\`\n• \`php-advance\`\n• \`devops\`\n• \`hardware\`\n\nGunakan \`${PREFIX} learn list\` untuk melihat daftar lengkap.`,
                    color: 0xED4245
                }]
            });
        }

        const totalLength = material.title.length + material.description.length +
            material.sections.reduce((acc, s) => acc + s.title.length + s.content.length, 0);

        // Jika materi terlalu panjang atau diminta secara eksplisit, gunakan pesan teks Discord
        if (totalLength > 2800 || args[1] === 'text' || args[1] === 'raw') {
            const fullText = [
                `# ${material.title}`,
                `${material.description}`,
                '════════════════════════════════════',
                ...material.sections.map(s => `### ${s.title}\n${s.content}`),
                '════════════════════════════════════',
                `Sudah siap ujian? Mulai dengan: \`${PREFIX} code ${canonicalTopic}\` | Waktu ujian: 10 menit (20 soal)`
            ].join('\n\n');

            const chunks: string[] = [];
            let currentChunk = '';
            for (const line of fullText.split('\n')) {
                if ((currentChunk + '\n' + line).length > 1850) {
                    chunks.push(currentChunk);
                    currentChunk = line;
                } else {
                    currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
                }
            }
            if (currentChunk) chunks.push(currentChunk);

            for (const chunk of chunks) {
                await reply(message, chunk);
            }
            return;
        }

        const fields = material.sections.map(section => ({
            name: section.title,
            value: section.content,
            inline: false
        }));

        return reply(message, {
            embeds: [{
                title: material.title,
                description: `${material.description}\n════════════════════════════════════`,
                color: 0x57F287,
                fields,
                footer: {
                    text: `Sudah siap ujian? Mulai dengan: ${PREFIX} code ${canonicalTopic} | Waktu ujian: 10 menit (20 soal)`
                },
                timestamp: new Date().toISOString()
            }]
        });
    }
});
