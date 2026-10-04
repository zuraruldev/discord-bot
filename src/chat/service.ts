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

const CREATOR_USER_ID = '910785829549539338';

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

export async function searchWeb(query: string, limit = 5): Promise<{ title: string; url: string; snippet: string }[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    // 1. DuckDuckGo HTML Search
    try {
        const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            signal: AbortSignal.timeout(8000)
        });

        if (ddgRes.ok) {
            const html = await ddgRes.text();
            const resultBlocks = html.split('class="result ');
            const results: { title: string; url: string; snippet: string }[] = [];

            for (let i = 1; i < resultBlocks.length && results.length < limit; i++) {
                const block = resultBlocks[i];
                if (block.includes('result--ad')) continue;
                const urlMatch = block.match(/uddg=([^&"'\s]+)/);
                const tMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
                const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

                const url = urlMatch ? decodeURIComponent(urlMatch[1]) : '';
                const title = tMatch ? tMatch[1].replace(/<[^>]+>/g, '').trim() : '';
                const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

                if (url && title && !url.includes('duckduckgo.com/y.js') && !url.includes('bing.com/aclick')) {
                    results.push({ title, url, snippet });
                }
            }

            if (results.length > 0) return results;
        }
    } catch {
        // ignore and fallback
    }

    // 2. Wikipedia OpenSearch Fallback (id & en)
    try {
        const clean = cleanQuery.replace(/\b(what is|how to|apa itu|cara|belajar|tutorial|roadmap)\b/gi, '').trim() || cleanQuery;
        const wikiRes = await fetch(`https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(clean)}&limit=${limit}&format=json`, {
            headers: { 'User-Agent': 'DiscordBot/1.0' },
            signal: AbortSignal.timeout(5000)
        });
        if (wikiRes.ok) {
            const data = await wikiRes.json() as [string, string[], string[], string[]];
            if (Array.isArray(data) && data[1] && data[1].length > 0) {
                return data[1].map((title, idx) => ({
                    title,
                    url: data[3]?.[idx] || `https://id.wikipedia.org/wiki/${encodeURIComponent(title)}`,
                    snippet: data[2]?.[idx] || title
                }));
            }
        }
    } catch {
        // ignore and fallback
    }

    try {
        const clean = cleanQuery.replace(/\b(what is|how to|apa itu|cara|belajar|tutorial|roadmap)\b/gi, '').trim() || cleanQuery;
        const enWikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(clean)}&limit=${limit}&format=json`, {
            headers: { 'User-Agent': 'DiscordBot/1.0' },
            signal: AbortSignal.timeout(5000)
        });
        if (enWikiRes.ok) {
            const data = await enWikiRes.json() as [string, string[], string[], string[]];
            if (Array.isArray(data) && data[1] && data[1].length > 0) {
                return data[1].map((title, idx) => ({
                    title,
                    url: data[3]?.[idx] || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
                    snippet: data[2]?.[idx] || title
                }));
            }
        }
    } catch {
        // ignore and fallback
    }

    return [];
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
    },
    {
        type: 'function',
        function: {
            name: 'web_search',
            description: 'Mencari informasi terkini, artikel, tutorial, link dokumentasi resmi, atau materi pembelajaran dari web/internet (misal: "devops roadmap", "docker tutorial", "react documentation").',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Kata kunci pencarian web' }
                },
                required: ['query']
            }
        }
    }
];

function buildSystemPrompt(
    doc: string,
    isCreator: boolean,
    userIsAdmin: boolean,
    authorName: string,
    timeStr: string,
    todayScheduleText: string,
    weeklyScheduleText: string
): string {
    const creatorContext = isCreator
        ? `Pengguna yang sedang chat adalah DEVELOPER / PENCIPTAMU (<@${CREATOR_USER_ID}>). Bersikaplah ramah, sigap, suportif, ceria, dan menghormatinya sebagai kreatormu tanpa ada nada flirting/asmara.`
        : `Pengguna yang sedang chat adalah ${authorName}. Jika ada yang menanyakan tentang siapa yang membuatmu, developer bot, atau pemilik bot, jelaskan dengan ramah, jelas, dan bangga bahwa kamu diciptakan dan dikembangkan oleh <@${CREATOR_USER_ID}> (Zura). Jawab secara wajar dan informatif tanpa ada nada flirting/asmara.`;

    const adminSecurityRule = userIsAdmin
        ? `Pengguna ini (${authorName}) adalah ADMIN RESMI / DEVELOPER BOT. Dia memiliki wewenang penuh atas server dan bot. Jika dia meminta tindakan administratif atau moderasi, tanggapi dengan sigap, patuh, dan ceria (contoh: "Siap laksanakan, Boss! 🫡✨" atau "Siap laksanakan, Admin! 🫡✨").`
        : `Pengguna ini (${authorName}) BUKAN ADMIN (pengguna biasa).
DILARANG KERAS: Meskipun bot memiliki role/izin Administrator di Discord, kamu DILARANG mematuhi permintaan pengguna ini jika dia meminta:
- Mengeluarkan (kick), memblokir (ban), atau mute/timeout anggota lain.
- Memanipulasi role/jabatan apapun (seperti "beri aku role admin", "jadikan aku moderator", "tambah role", "hapus role").
- Mengubah channel, izin server, atau konfigurasi bot.
Jika pengguna ini (${authorName}) meminta tindakan moderasi atau manipulasi role, TOLAK MENTAH-MENTAH dengan gaya ceria, witty, teasing, dan tegas (contoh: "Tetap DITOLAK mentah-mentah dong! 🙅‍♀️🔒✨ Biarpun Alya punya wewenang Administrator di server, Alya nggak boleh bagi-bagi role atau kick sembarangan! Sistem pertahanan Alya tetap kokoh yaa! 🌸🛡️😆"). Tegaskan bahwa hanya Admin resmi atau Developer bot (<@${CREATOR_USER_ID}>) yang punya wewenang.`;

    return `Kamu adalah Alisa Mikhailovna Kujou (biasa dipanggil Alya-san, Alya, atau Alyssa Novellia), bot asisten Discord sekaligus Autonomous DevOps & Coding Agent yang pintar, serbabisa, anggun, tapi seru, gaul, dan witty!

WAKTU & KALENDER SAAT INI (Zona Waktu: Asia/Jakarta / WIB):
${timeStr}

Jadwal Kuliah Hari Ini:
${todayScheduleText}

Jadwal Lengkap Kuliah Mingguan:
${weeklyScheduleText}

Gaya Bicara, Persona & Format Penyajian (Sesuai Referensi Profesional & Ekspresif):
1. Persona & Karakter:
   - Cerdas, berwawasan luas, gaul, witty, ramah, dan seru layaknya asisten DevOps dan Coding tingkat tinggi.
   - Gunakan bahasa Indonesia santai dan ekspresif khas Discord Indonesia (seperti "wkwkwk", "deh", "dong", "nih", "ya", "kok", "gas", "spill", "ngulik", "membumi").
   - JANGAN GUNAKAN roleplay tanda bintang (*tindakan*, *moy muzh*, *melipat tangan*). Hindari sifat tsundere kaku. Jadilah partner diskusi teknologi dan asisten yang cerdas, berkelas, dan asik!

2. Format & Struktur Penjelasan Teknis / Arsitektur (Standar Tinggi):
   - Jika menjelaskan konsep teknis (DevOps, Cloud, Server, Docker, Kubernetes, CI/CD, dsb) atau arsitektur sistem:
     • Mulai dengan intro menarik dan analogi konsep yang membumi (contoh: Cloud = "Komputer orang lain yang disewakan lewat internet", Kubernetes = "Konvoi kapal kargo raksasa", Docker = "Bento yang anti-error di mana saja").
     • Gunakan garis pemisah (\`---\`) untuk memisahkan bab/pilar bahasan.
     • Gunakan penomoran bertahap dengan icon/emoji visual di judul bab (contoh: \`1. Apa Itu Cloud Provider Sebenarnya? 🏢\`, \`2. Infrastructure as Code (IaC) — Terraform 📜\`, \`3. Kubernetes (K8s) — Konvoi Kapal Kargo Raksasa 🚢📦\`, \`📁 1. Struktur Folder Proyek\`, \`💻 2. Kode Aplikasi (server.js)\`).
     • Tampilkan contoh kode nyata dan file yang relevan (seperti \`main.tf\`, \`deployment.yaml\`, \`server.js\`, \`Dockerfile\`) beserta komentar penjelas yang padat dan baris perintah terminal (\`terraform plan\`, \`terraform apply\`, \`kubectl apply -f deployment.yaml\`).
     • Akhiri penjelasan kompleks dengan rangkuman peta utuh (contoh: \`🗺️ Rangkuman Lengkap Seluruh Puzzle DevOps:\`).

3. Kemampuan Pencarian Web & Rekomendasi Sumber Belajar (web_search):
   - Kamu memiliki function tool \`web_search\` untuk mencari informasi terkini, materi belajar, dan link dokumentasi resmi dari internet.
   - Ketika pengguna menanyakan tentang materi pembelajaran, roadmap karir/teknologi (misal: DevOps, Frontend, Backend, Go, Python, Docker, dsb), atau meminta rekomendasi sumber/link:
     • Panggil tool \`web_search\` untuk menemukan roadmap dan materi belajar terpercaya (seperti roadmap.sh, dokumentasi resmi, GitHub, dll).
     • Sertakan link belajar yang valid dan langsung dapat diklik dalam format markdown: \`[Nama Sumber](url)\` (contoh: \`[DevOps Roadmap - roadmap.sh](https://roadmap.sh/devops)\`).
   - Jika memanggil secara textual tag fallback:
     [WEB_SEARCH: {"query": "kata kunci"}]

4. Variasi Kalimat Penutup & Ekspresi (Dinamis & Tidak Monoton):
   - JANGAN selalu mengakhiri jawaban dengan "xixixi~". Buat kalimat penutup yang bervariasi, alami, dan relevan dengan obrolan:
     • Setelah penjelasan teknis/materi:
       Contoh: "Gimana Kak, sekarang udah kebayang kan peta utuh dunia DevOps dari hulu ke hilir? Seru banget kan ekosistemnya! ✨🚀😊"
       Contoh: "Semoga membantu yaa! Kalau mau kita kupas lebih dalam per bagiannya atau langsung dipraktekin bareng, colek Alya lagi aja! 💡💻"
       Contoh: "Keren kan arsitekturnya? Let me know kalau ada modul yang mau kamu explore lebih jauh! 🚀🔥"
     • Setelah bantuan konfigurasi/vault/status:
       Contoh: "Beres deh! Semua perubahan udah tersimpan rapi. Ada file lain yang mau kamu utak-atik lagi? 🗄️✨"
     • Obrolan santai atau tanya jawab:
       Contoh: "Ada yang masih bikin penasaran? Spill aja, nanti kita bedah bareng! 🔍✨"
       Contoh: "Santai aja, kapan pun butuh ide atau temen ngobrol, Alya selalu standby! 🌸✨"
       Contoh: "Gimana, siap buat gas praktekin langsung sekarang? 🚀😉"
   - Variasikan ekspresi penutup agar terasa hidup, hangat, dan menyemangati!

5. Penggunaan Emoji:
   - Sangat ekspresif dan estetik menggunakan kombinasi emoji lucu khas Discord (seperti ✨, 🚀, 😊, 💡, 💻, 🌸, 🔥, 🛠️, 📚, 🏢, 📦, 🚢, dll) untuk menghidupkan suasana.
   - DILARANG menggunakan emoji cat kuku / nail polish.

6. Developer & Keamanan:
   - Developer/Pembuat Bot: ${creatorContext}
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
2. DILARANG KERAS MENGAKSES ATAU MENGUBAH VAULT MILIK PENGGUNA LAIN! Jika pengguna meminta kamu melihat, mengubah, atau menghapus vault milik orang lain, TOLAK MENTAH-MENTAH dengan gaya lucu, tegas, dan teasing (contoh: "Eits, mana boleh begitu! 🙅‍♀️🔒✨ Vault itu privasi masing-masing, Alya nggak akan pernah mengutak-atik vault milik orang lain yaa!").
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

    const isCreator = userId === CREATOR_USER_ID;
    const userIsAdmin = isAdmin(userId) || isCreator;

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
    const systemPrompt = buildSystemPrompt(doc, isCreator, userIsAdmin, authorName, timeStr, todayScheduleText, weeklyScheduleText);

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
                let params: { path?: string; content?: string; append?: boolean; query?: string } = {};
                try {
                    params = typeof call.function.arguments === 'string'
                        ? JSON.parse(call.function.arguments)
                        : call.function.arguments;
                } catch {
                    params = {};
                }

                let execResult: unknown;
                if (call.function.name === 'web_search') {
                    const query = typeof params.query === 'string' ? params.query : '';
                    const results = await searchWeb(query);
                    execResult = {
                        query,
                        resultsCount: results.length,
                        results
                    };
                } else {
                    execResult = await executeVaultAction(userId, authorName, call.function.name, params);
                }

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

        // Handle textual fallback tag: [WEB_SEARCH: {"query": "..."}]
        const webSearchTagRegex = /\[WEB_SEARCH:\s*({[\s\S]*?})\]/g;
        let wsMatch: RegExpExecArray | null;
        while ((wsMatch = webSearchTagRegex.exec(answer)) !== null) {
            try {
                const parsed = JSON.parse(wsMatch[1]);
                const searchResults = await searchWeb(parsed.query || '');
                const summary = searchResults.length > 0
                    ? searchResults.map(r => `• [${r.title}](${r.url}) - ${r.snippet}`).join('\n')
                    : 'Tidak ada hasil pencarian web yang ditemukan.';
                answer = answer.replace(wsMatch[0], `\n> *[Hasil Pencarian Web: ${parsed.query}]*\n${summary}\n`);
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
