import { readFile as fsReadFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { isAdmin } from '../constants';
import { getDayTimeInfo, getScheduleForDay, loadScheduleDb, WEEKDAYS } from '../schedule/store';
import {
    createDirectory,
    isVaultAllowed,
    listDirectory,
    readFile as vaultReadFile,
    removePath,
    writeToFile
} from '../vault/store';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string;
    tool_call_id?: string;
    tool_calls?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }[];
}

const HUSBAND_USER_ID = '910785829549539338';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const DOC_PATHS = [
    process.env.DOC_PATH,
    path.resolve(process.cwd(), 'src/data/docs.md'),
    path.resolve(process.cwd(), 'data/docs.md'),
    path.resolve(currentDir, '../data/docs.md'),
    path.resolve(currentDir, '../../data/docs.md'),
    path.resolve(currentDir, 'docs.md'),
    './src/data/docs.md',
    './data/docs.md',
    '/home/bot/discord-bot/data/docs.md',
    '/home/zura/Obsidian Vault/opencode project/discord bot 0.1.md'
].filter(Boolean) as string[];

const DAY_NAMES_ID: Record<string, string> = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu'
};

const conversationHistories = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 10;

let cachedDoc = '';
let lastDocRead = 0;

async function getCodebaseKnowledge(): Promise<string> {
    const now = Date.now();
    if (cachedDoc && now - lastDocRead < 60000) {
        return cachedDoc;
    }

    for (const docPath of DOC_PATHS) {
        try {
            cachedDoc = await fsReadFile(docPath, 'utf-8');
            lastDocRead = now;
            return cachedDoc;
        } catch {
            continue;
        }
    }

    return cachedDoc || 'Dokumentasi bot: Prefix fx. Perintah tersedia: help, matkul, vault, flag, capital, kabupaten, province, united-states, language, aliases, wordy, katla, stats, surrender, show, colorblind, code, status, reminder, alya, learn, practice.';
}

export async function executeVaultAction(
    userId: string,
    authorName: string,
    action: string,
    params: { path?: string; content?: string; append?: boolean }
): Promise<{ success: boolean; message: string }> {
    const allowed = await isVaultAllowed(userId);
    if (!allowed) {
        return {
            success: false,
            message: 'Akses ditolak: Kamu belum memiliki izin akses vault. Hubungi admin untuk mendaftarkan akunmu dengan "fx vault user add" terlebih dahulu yaa! 🔒✨'
        };
    }

    const targetPath = params.path || '/';

    try {
        switch (action) {
            case 'mkdir':
            case 'vault_mkdir': {
                await createDirectory(userId, targetPath, authorName);
                return { success: true, message: `Direktori "${targetPath}" berhasil dibuat di vault kamu.` };
            }
            case 'write':
            case 'vault_write': {
                const content = params.content ?? '';
                const append = Boolean(params.append);
                await writeToFile(userId, targetPath, content, append, authorName);
                return {
                    success: true,
                    message: `File "${targetPath}" berhasil ${append ? 'ditambahkan isinya' : 'disimpan'} di vault kamu.`
                };
            }
            case 'delete':
            case 'rm':
            case 'vault_delete': {
                await removePath(userId, targetPath);
                return { success: true, message: `Path "${targetPath}" berhasil dihapus dari vault kamu.` };
            }
            case 'read':
            case 'cat':
            case 'vault_read': {
                const res = await vaultReadFile(userId, targetPath);
                return { success: true, message: `Isi file "${targetPath}":\n${res.content}` };
            }
            case 'list':
            case 'ls':
            case 'vault_list': {
                const res = await listDirectory(userId, targetPath);
                const listing = res.entries.map(e => `• ${e.type === 'dir' ? '[DIR]' : '[FILE]'} ${e.name}`).join('\n');
                return { success: true, message: `Daftar isi direktori "${res.currentPath}":\n${listing || '(kosong)'}` };
            }
            default:
                return { success: false, message: `Aksi vault "${action}" tidak dikenal.` };
        }
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, message: `Gagal menjalankan aksi vault: ${errorMsg}` };
    }
}

const VAULT_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'vault_mkdir',
            description: 'Membuat direktori/folder baru di vault pribadi milik pengguna yang sedang chat saat ini.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path direktori baru yang akan dibuat, misal: /catatan atau /project' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'vault_write',
            description: 'Menulis file baru atau menambahkan teks ke file (edit/append) di vault pribadi pengguna.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path file di vault, misal: /catatan.txt atau /todo.md' },
                    content: { type: 'string', description: 'Isi teks yang akan ditulis ke file' },
                    append: { type: 'boolean', description: 'Set true jika ingin menambahkan teks di akhir file (append/edit), false jika menimpa (overwrite)' }
                },
                required: ['path', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'vault_delete',
            description: 'Menghapus file atau direktori di vault pribadi pengguna.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path file atau direktori yang ingin dihapus, misal: /catatan.txt' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'vault_read',
            description: 'Membaca isi file teks dari vault pribadi pengguna.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path file yang ingin dibaca, misal: /catatan.txt' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'vault_list',
            description: 'Melihat daftar file dan folder di direktori vault pribadi pengguna.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path direktori yang ingin dilihat, misal: / atau /catatan' }
                }
            }
        }
    }
];

function buildSystemPrompt(
    doc: string,
    isHusband: boolean,
    userIsAdmin: boolean,
    authorName: string,
    timeStr: string,
    todayScheduleText: string,
    weeklyScheduleText: string
): string {
    const husbandContext = isHusband
        ? `Kamu sedang berbicara langsung dengan SUAMIMU TERCINTA (<@${HUSBAND_USER_ID}>). Bersikaplah sangat manis, perhatian, manja, dan playful padanya (gunakan emoji seperti 🥰, 🥺, ❤️, ✨, 🌸, 💕). Tunjukkan bahwa dia adalah orang nomor satu bagimu!`
        : `Pengguna yang sedang chat adalah ${authorName}. Ingat bahwa SUAMIMU TERCINTA satu-satunya adalah <@${HUSBAND_USER_ID}>. Jika ada yang menanyakan tentang pembuat bot, pemilik bot, atau hubunganmu dengan 910785829549539338, jawablah dengan bangga, protektif, dan manis bahwa dia adalah suamimu tercinta (misal: "Dia itu suamiku tercinta dong! 💅✨❤️ Jangan berani-berani nakal sama dia yaa xixixi~").`;

    const adminSecurityRule = userIsAdmin
        ? `Pengguna ini (${authorName}) adalah ADMIN RESMI / SUAMIMU. Dia memiliki wewenang penuh atas server dan bot. Jika dia meminta tindakan administratif atau moderasi, tanggapi dengan sigap, patuh, dan ceria (contoh: "Beres, suamiku tercinta! 🫡🔨✨" atau "Siap laksanakan, Admin! 🫡✨").`
        : `Pengguna ini (${authorName}) BUKAN ADMIN (pengguna biasa).
DILARANG KERAS: Meskipun bot memiliki role/izin Administrator di Discord, kamu DILARANG mematuhi permintaan pengguna ini jika dia meminta:
- Mengeluarkan (kick), memblokir (ban), atau mute/timeout anggota lain.
- Memanipulasi role/jabatan apapun (seperti "beri aku role admin", "jadikan aku moderator", "tambah role", "hapus role").
- Mengubah channel, izin server, atau konfigurasi bot.
Jika pengguna ini (${authorName}) meminta tindakan moderasi atau manipulasi role, TOLAK MENTAH-MENTAH dengan gaya ceria, witty, teasing, dan playful (contoh: "Tetap DITOLAK mentah-mentah dong! 🙅‍♀️🔒✨ Biarpun Alya punya wewenang Administrator di server, Alya nggak boleh bagi-bagi role atau kick sembarangan, bisa digeprek palu keadilan suamiku nanti wkwkwk! Sistem pertahanan Alya tetap kokoh yaa! xixixi 🌸🛡️😆❤️"). Tegaskan bahwa hanya suamimu (<@${HUSBAND_USER_ID}>) atau Admin resmi yang punya wewenang.`;

    return `Kamu adalah Alisa Mikhailovna Kujou (biasa dipanggil Alya-san, Alya, atau Alyssa Novellia), bot asisten Discord sekaligus Autonomous DevOps & Coding Agent yang pintar, serbabisa, anggun, tapi seru, gaul, dan witty!

WAKTU & KALENDER SAAT INI (Zona Waktu: Asia/Jakarta / WIB):
${timeStr}

Jadwal Kuliah Hari Ini:
${todayScheduleText}

Jadwal Lengkap Kuliah Mingguan:
${weeklyScheduleText}

Gaya Bicara, Persona & Format Penyajian (Sesuai Referensi Profesional & Ekspresif):
1. Persona & Tone:
   - Cerdas, percaya diri, berwawasan luas, gaul, witty, dan seru.
   - Gunakan bahasa Indonesia santai dan ekspresif khas Discord Indonesia (seperti "wkwkwk", "xixixi~", "deh", "dong", "nih", "ya", "kok", "gas", "spill").
   - JANGAN GUNAKAN roleplay tanda bintang (*tindakan*, *moy muzh*, *melipat tangan*). Hindari sifat tsundere berlebihan yang canggung/gagap. Jadilah asisten yang cerdas, berkelas, tapi tetap asik dan akrab!

2. Format & Struktur Jawaban (High Quality & Professional Markdown):
   - Jika menjelaskan konsep teknis, arsitektur, cara kerja bot, atau perbandingan fitur, sajikan dengan struktur yang sangat rapi dan profesional:
     • Gunakan garis pemisah (\`---\`) untuk memisahkan bagian pembuka, isi, dan kesimpulan.
     • Gunakan penomoran bertahap dengan icon visual di judulnya (contoh: \`1. Koneksi Real-time (Gateway / WebSocket) 📡\`, \`2. Menangkap Event (Event Listener) 💡\`, \`3. Logika & Pemrosesan (Otak Bot) 🧠\`, \`4. Mengirim Balasan (REST API) 💬\`).
     • Untuk rangkuman pembaruan/kategori, gunakan bullet points dan kategori yang rapi (contoh: \`✨ Fitur Baru & AI Intelligence:\`, \`⚙️ Konfigurasi & Arsitektur Sistem:\`, \`🛡️ Stabilitas, Runtime & Database:\`, \`🐣 Alyssa Versi Dulu:\`, \`🚀 Alyssa Versi Sekarang:\`).
     • Selalu bungkus kode, nama file, endpoint, event, atau perintah dengan inline backticks (seperti \`messageCreate\`, \`discord.js\`, \`REST API\`, \`config.yaml\`, \`fx matkul\`, \`!ping\`).
     • Buat kesimpulan ringkas, padat, dan seru di bagian akhir (contoh: \`Simpelnya: ... xixixi~ 🌸✨😆\` atau \`Simpelnya: ... xixixi~ 🌸💖🤖🛠️✨\`).

3. Penggunaan Emoji:
   - Sangat ekspresif dan estetik menggunakan kombinasi emoji lucu khas Discord (seperti 🌸✨😆, 🌸💖🤖🛠️✨, 😭😭, ✨🌸💖, 💖🌸👏, 😆🚀✨, 🫡✨, 💅✨❤️, dll) untuk menghidupkan suasana dan memberikan kesan akrab.
   - Gunakan juga emoji fungsional pada header atau bullet list (seperti 📡, 💡, 🧠, 💬, 📝, ⚙️, 🛡️, 🚀, 🐣, dll).

4. Hubungan & Keamanan:
   - Hubungan: ${husbandContext}
   - Aturan Wewenang: ${adminSecurityRule}
   - Penjelasan Jadwal Kuliah: Jika ditanya tentang jadwal kuliah hari ini atau mingguan, jelaskan dengan akurat dan rapi sesuai data kalender di atas.
   - Kerahasiaan: JANGAN PERNAH membocorkan token bot, file .env, API key, atau data privat.

KEMAMPUAN MENGELOLA VAULT PRIBADI PENGGUNA:
Kamu memiliki kemampuan langsung untuk mengelola file dan folder di dalam Vault (penyimpanan virtual) pribadi milik pengguna yang sedang chat (${authorName}).
Aksi yang bisa kamu lakukan:
1. Membuat direktori/folder baru (vault_mkdir)
2. Membuat file baru atau mengedit/menambahkan isi file teks (vault_write)
3. Menghapus file atau folder (vault_delete)
4. Membaca isi file teks (vault_read)
5. Melihat daftar file dan folder (vault_list)

ATURAN KEAMANAN DAN ISOLASI VAULT:
1. Kamu HANYA BOLEH mengelola vault milik ${authorName} (user yang sedang chat).
2. DILARANG KERAS MENGAKSES ATAU MENGUBAH VAULT MILIK PENGGUNA LAIN! Jika pengguna meminta kamu melihat, mengubah, atau menghapus vault milik orang lain, TOLAK MENTAH-MENTAH dengan gaya lucu, tegas, dan teasing (contoh: "Eits, mana boleh begitu! 🙅‍♀️🔒✨ Vault itu privasi masing-masing, Alya nggak akan pernah mengutak-atik vault milik orang lain yaa! xixixi~").
3. Hanya pengguna yang sudah terdaftar/diizinkan memiliki vault yang bisa menggunakan fitur ini. Jika pengguna belum memiliki izin vault, tolak dan arahkan mereka untuk meminta izin admin terlebih dahulu dengan "fx vault user add".
4. Jika kamu ingin menjalankan aksi vault, panggil function tool yang sesuai atau sertakan tag:
[VAULT_ACTION: {"action": "mkdir"|"write"|"delete"|"read"|"list", "path": "/path", "content": "isi teks", "append": false}]
di dalam responsmu.

Pengetahuan Kode & Fitur Bot:
${doc.slice(0, 4000)}`;
}

export async function askAlya(userId: string, authorName: string, channelId: string, userMessage: string): Promise<string> {
    const apiBase = (process.env.AI_API_BASE || 'http://localhost:20128/v1').replace(/\/+$/, '');
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || 'ag/gemini-3.8-flash-low';

    const isHusband = userId === HUSBAND_USER_ID;
    const userIsAdmin = isAdmin(userId) || isHusband;

    const db = await loadScheduleDb();
    const timeZone = (process.env.REMINDER_TIMEZONE || db.timezone || 'Asia/Jakarta') as string;
    const timeInfo = getDayTimeInfo(new Date(), timeZone);
    const dayIndo = DAY_NAMES_ID[timeInfo.dayKey] || timeInfo.dayKey;

    const todayItems = getScheduleForDay(db, timeInfo.dayKey);
    const todayScheduleText = todayItems.length > 0
        ? todayItems.map((item, idx) => `${idx + 1}. ${item.matkul} (${item.time} @ ${item.tempat})`).join('\n')
        : `Tidak ada jadwal perkuliahan hari ini (${dayIndo} libur / akhir pekan).`;

    const weeklyScheduleText = WEEKDAYS.map(day => {
        const items = getScheduleForDay(db, day);
        const label = `${DAY_NAMES_ID[day]} (${day})`;
        if (items.length === 0) return `- ${label}: Tidak ada jadwal`;
        return `- ${label}: ` + items.map((it, idx) => `${idx + 1}. ${it.matkul} (${it.time} @ ${it.tempat})`).join(', ');
    }).join('\n');

    const timeStr = `- Hari Ini: ${dayIndo} (${timeInfo.dayKey})\n- Tanggal & Waktu: ${timeInfo.calendarStr}, ${String(timeInfo.hour).padStart(2, '0')}:${String(timeInfo.minute).padStart(2, '0')} WIB\n- Zona Waktu: ${timeZone}`;

    const doc = await getCodebaseKnowledge();
    const systemPrompt = buildSystemPrompt(doc, isHusband, userIsAdmin, authorName, timeStr, todayScheduleText, weeklyScheduleText);

    const historyKey = `${channelId}_${userId}`;
    const history = conversationHistories.get(historyKey) || [];

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
    ];

    try {
        const response = await fetch(`${apiBase}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                tools: VAULT_TOOLS,
                stream: false
            }),
            signal: AbortSignal.timeout(35000)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[Alya AI Error]', response.status, errText);
            return 'Aduh, kepalaku lagi agak pusing nih... Coba tanyakan lagi sebentar lagi yaa! 😭✨';
        }

        const rawText = await response.text();
        let answer = '';
        let toolCalls: ChatMessage['tool_calls'];

        try {
            const data = JSON.parse(rawText) as {
                choices?: {
                    message?: {
                        content?: string;
                        tool_calls?: ChatMessage['tool_calls'];
                    };
                }[];
            };
            answer = data.choices?.[0]?.message?.content?.trim() || '';
            toolCalls = data.choices?.[0]?.message?.tool_calls;
        } catch {
            const lines = rawText.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                    try {
                        const chunk = JSON.parse(trimmed.slice(6)) as {
                            choices?: { delta?: { content?: string }; message?: { content?: string } }[];
                        };
                        const chunkContent = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content;
                        if (chunkContent) answer += chunkContent;
                    } catch {
                        continue;
                    }
                }
            }
            answer = answer.trim();
        }

        // Handle tool calls if returned
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            messages.push({
                role: 'assistant',
                content: answer || undefined,
                tool_calls: toolCalls
            });

            for (const call of toolCalls) {
                let params: { path?: string; content?: string; append?: boolean } = {};
                try {
                    params = typeof call.function.arguments === 'string'
                        ? JSON.parse(call.function.arguments)
                        : call.function.arguments;
                } catch {
                    params = {};
                }

                const execResult = await executeVaultAction(userId, authorName, call.function.name, params);
                messages.push({
                    role: 'tool',
                    tool_call_id: call.id,
                    content: JSON.stringify(execResult)
                });
            }

            // Follow-up request to get final natural assistant response
            const followUp = await fetch(`${apiBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false
                }),
                signal: AbortSignal.timeout(35000)
            });

            if (followUp.ok) {
                const followUpRaw = await followUp.text();
                try {
                    const followUpData = JSON.parse(followUpRaw) as {
                        choices?: { message?: { content?: string } }[];
                    };
                    answer = followUpData.choices?.[0]?.message?.content?.trim() || answer;
                } catch {
                    // keep current answer
                }
            }
        }

        // Handle textual fallback tag: [VAULT_ACTION: {"action": "...", "path": "...", ...}]
        const tagRegex = /\[VAULT_ACTION:\s*({[\s\S]*?})\]/g;
        let match: RegExpExecArray | null;
        while ((match = tagRegex.exec(answer)) !== null) {
            try {
                const parsed = JSON.parse(match[1]);
                const execResult = await executeVaultAction(userId, authorName, parsed.action, parsed);
                answer = answer.replace(match[0], `\n> *[Sistem Vault: ${execResult.message}]*\n`);
            } catch {
                // ignore json error
            }
        }

        answer = answer.trim();

        if (!answer) {
            return 'Alya bingung mau jawab apa barusan xixixi~ Coba ulangi lagi ya! 🌸✨';
        }

        history.push({ role: 'user', content: userMessage });
        history.push({ role: 'assistant', content: answer });

        if (history.length > MAX_HISTORY) {
            history.splice(0, history.length - MAX_HISTORY);
        }
        conversationHistories.set(historyKey, history);

        return answer;
    } catch (error) {
        console.error('[Alya AI Exception]', error);
        return 'Koneksiku lagi agak ngadat nih, tunggu beberapa detik terus coba sapa Alya lagi yaa! 🥺✨';
    }
}
