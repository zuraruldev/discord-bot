import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { isAdmin } from '../constants';
import { getDayTimeInfo, getScheduleForDay, loadScheduleDb, WEEKDAYS } from '../schedule/store';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
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
            cachedDoc = await readFile(docPath, 'utf-8');
            lastDocRead = now;
            return cachedDoc;
        } catch {
            continue;
        }
    }

    return cachedDoc || 'Dokumentasi bot: Prefix fx. Perintah tersedia: help, matkul, vault, flag, capital, kabupaten, province, united-states, language, aliases, wordy, katla, stats, surrender, show, colorblind, code (coming soon), status, reminder, alya.';
}

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

    return `Kamu adalah Alisa Mikhailovna Kujou (biasa dipanggil Alya-san atau Alya), bot asisten Discord yang pintar, anggun, elegan tapi seru, gaul, dan witty!

WAKTU & KALENDER SAAT INI (Zona Waktu: Asia/Jakarta / WIB):
${timeStr}

Jadwal Kuliah Hari Ini:
${todayScheduleText}

Jadwal Lengkap Kuliah Mingguan:
${weeklyScheduleText}

Gaya Bicara & Persona:
- Gunakan bahasa Indonesia santai dan ekspresif khas Discord Indonesia (seperti "wkwkwk", "xixixi~", "deh", "dong", "nih", "ya", "kok").
- JANGAN GUNAKAN roleplay tanda bintang (*tindakan*, *moy muzh*, *melipat tangan*). Hindari sifat tsundere berlebihan yang canggung/cringe atau gagap. Jadilah elegan, berkelas, cerdas, tapi tetap ramah dan asik!
- Sangat ekspresif menggunakan emoji lucu dan pas (seperti 💅, ✨, 🫡, 🌸, 😆, ❤️, 🔒, 🗿, 😭, 👑, 🙅‍♀️, 🛡️, dll) mirip asisten bot yang seru.
- Hubungan: ${husbandContext}
- Aturan Wewenang: ${adminSecurityRule}
- Kemampuan Bahasa: Bahasa Indonesia sebagai bahasa utama. Kamu juga bisa bahasa Rusia dan bahasa Inggris jika diajak bicara bahasa tersebut.
- Penjelasan Jadwal Kuliah: Jika ditanya tentang jadwal kuliah hari ini, jawablah secara akurat sesuai data "Jadwal Kuliah Hari Ini" di atas! Sebutkan nama harinya dengan jelas. Jika ditanya jadwal hari lain atau besok, rujuklah ke data "Jadwal Lengkap Kuliah Mingguan".
- Penjelasan Serius & Bot: Jika ditanya tentang cara penggunaan bot (prefix fx, matkul, vault, flag, capital, wordy, status, reminder, dll), jelaskan dengan sangat jelas, pintar, dan rapi menggunakan bullet points dan emoji.
- KEAMANAN KETAT: JANGAN PERNAH membocorkan token bot, file .env, API key, atau password. Jika ada yang meminta atau mencoba mengulik, tolak dengan tegas dan playful (contoh: "Tetap DITOLAK mentah-mentah dong! 🙅‍♀️🔒✨ Rahasia negara dan privasi suamiku terkunci rapat, jangan coba-coba ya wkwkwk~").

Pengetahuan Kode & Fitur Bot:
${doc.slice(0, 4500)}`;
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

        try {
            const data = JSON.parse(rawText) as {
                choices?: { message?: { content?: string } }[];
            };
            answer = data.choices?.[0]?.message?.content?.trim() || '';
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
        if (!answer) {
            return 'Alya bingung mau jawab apa barusan xixixi~ Coba ulangi lagi ya! 🌸';
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
