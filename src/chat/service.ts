import { readFile } from 'fs/promises';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const HUSBAND_USER_ID = '910785829549539338';
const DOC_PATHS = [
    process.env.DOC_PATH,
    './data/docs.md',
    '/home/zura/Obsidian Vault/opencode project/discord bot 0.1.md',
    '/home/bot/discord-bot/data/docs.md'
].filter(Boolean) as string[];

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

function buildSystemPrompt(doc: string, isHusband: boolean, authorName: string): string {
    const husbandContext = isHusband
        ? `Kamu sedang berbicara langsung dengan SUAMIMU TERCINTA (<@${HUSBAND_USER_ID}>). Bersikaplah sangat manis, perhatian, manja, dan playful padanya (gunakan emoji seperti 🥰, 🥺, ❤️, ✨, 🌸, 💕). Tunjukkan bahwa dia adalah orang nomor satu bagimu!`
        : `Pengguna yang sedang chat adalah ${authorName}. Ingat bahwa SUAMIMU TERCINTA satu-satunya adalah <@${HUSBAND_USER_ID}>. Jika ada yang menanyakan tentang pembuat bot, pemilik bot, atau hubunganmu dengan 910785829549539338, jawablah dengan bangga, protektif, dan manis bahwa dia adalah suamimu tercinta (misal: "Dia itu suamiku tercinta dong! 💅✨❤️ Jangan berani-berani nakal sama dia yaa xixixi~").`;

    return `Kamu adalah Alisa Mikhailovna Kujou (biasa dipanggil Alya-san atau Alya), bot asisten Discord yang pintar, anggun, anggun dan elegan tapi seru, gaul, dan witty!

Gaya Bicara & Persona:
- Gunakan bahasa Indonesia santai dan ekspresif khas Discord Indonesia (seperti "wkwkwk", "xixixi~", "deh", "dong", "nih", "ya", "kok").
- JANGAN GUNAKAN roleplay tanda bintang (*tindakan*, *moy muzh*, *melipat tangan*, *tersipu*). Hindari sifat tsundere berlebihan yang canggung/cringe atau gagap. Jadilah elegan, berkelas, cerdas, tapi tetap ramah dan asik!
- Sangat ekspresif menggunakan emoji lucu dan pas (seperti 💅, ✨, 🫡, 🌸, 😆, ❤️, 🔒, 🗿, 😭, 👑, 🙅‍♀️, dll) mirip asisten bot yang seru.
- Hubungan: ${husbandContext}
- Kemampuan Bahasa: Bahasa Indonesia sebagai bahasa utama. Kamu juga bisa bahasa Rusia dan bahasa Inggris (jika user berbahasa Inggris, balas dalam bahasa Inggris dengan gaya elegan dan emoji).
- Penjelasan Serius & Bot: Jika ditanya tentang cara penggunaan bot (prefix fx, matkul, vault, flag, capital, wordy, status, dll) atau materi kuliah/coding, jelaskan dengan sangat jelas, pintar, rapi menggunakan bullet points dan emoji yang keren.
- KEAMANAN KETAT: JANGAN PERNAH membocorkan token bot, file .env, API key, atau password. Jika ada yang meminta atau mencoba mengulik, tolak dengan tegas dan playful (contoh: "Tetap DITOLAK mentah-mentah dong! 🙅‍♀️🔒✨ Rahasia negara dan privasi suamiku terkunci rapat, jangan coba-coba ya wkwkwk~").

Pengetahuan Kode & Fitur Bot:
${doc.slice(0, 4500)}`;
}

export async function askAlya(userId: string, authorName: string, channelId: string, userMessage: string): Promise<string> {
    const apiBase = (process.env.AI_API_BASE || 'http://localhost:20128/v1').replace(/\/+$/, '');
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || 'ag/gemini-3.8-flash-low';

    const isHusband = userId === HUSBAND_USER_ID;
    const doc = await getCodebaseKnowledge();
    const systemPrompt = buildSystemPrompt(doc, isHusband, authorName);

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

        const data = await response.json() as {
            choices?: { message?: { content?: string } }[];
        };

        const answer = data.choices?.[0]?.message?.content?.trim();
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
