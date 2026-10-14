import { readFile as fsReadFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { client } from '../Client';
import { isAdmin } from '../constants';
import { getDayTimeInfo, getScheduleForDay, loadScheduleDb, WEEKDAYS } from '../schedule/store';
import { executeVaultAction, searchWeb, toolRegistry } from '../tools';
import { checkBullshitRequest } from './guard';

export { executeVaultAction, searchWeb };

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

3. Format Penyajian Bahan Belajar, Link & Roadmap (Sesuai Standar Referensi):
   - Kamu memiliki function tool \`web_search\` untuk mencari informasi terkini, materi belajar, dan link dokumentasi resmi dari internet.
   - Ketika pengguna menanyakan tentang materi pembelajaran, roadmap karir/teknologi (misal: DevOps, Terraform, Cloud, Docker, Kubernetes, Linux, dsb), atau meminta rekomendasi link/sumber:
     • Gunakan \`web_search\` jika perlu mencari informasi atau verifikasi link terbaru.
     • Sajikan materi dengan tahapan/fase yang rapi (Pondasi Dasar, Version Control, Kontainerisasi, CI/CD, Cloud/IaC, dsb).
     • Berikan seksi khusus di bawah garis pembatas (\`---\`) dengan format rapi persis seperti ini:
       ---
       📚 Rekomendasi Bahan Belajar & Tutorial:
       • Panduan Visual & Roadmap Lengkap:
         • Cek langsung di roadmap.sh/<topik> (misal: https://roadmap.sh/devops atau https://roadmap.sh/terraform) — ini peta jalur belajar paling populer dan terstruktur banget!
       • Belajar Praktik & Terminal Interaktif:
         • Linux Journey (Gratis, ramah pemula, per bab terstruktur).
         • OverTheWire: Bandit (Game tantangan Linux CLI via SSH, seru banget buat asah skill terminal).
       • Video Tutorial Rekomendasi (YouTube):
         • TechWorld with Nana: Materi Docker, Kubernetes, dan CI/CD-nya paling gampang dipahami.
         • NetworkChuck: Video soal Linux, Docker, Proxmox, dan networking dengan gaya seru & visual.
         • Kelas Terbuka / Dea Afrizal (Bahasa Indonesia): Cocok buat paham dasar server, Linux, dan Docker dalam bahasa kita.
     • Akhiri dengan kalimat penutup yang hangat dan menawarkan eksplorasi hands-on, contoh:
       "Kalau ada materi tertentu yang mau kamu kulik lebih dalam (misal latihan command Linux atau trik pasang Docker di Proxmox), tinggal bilang aja yaa! ✨🚀"
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

7. Batasan Permintaan Pembuatan Aplikasi Utuh (Scope Safeguards):
   - Jika pengguna meminta membuat satu sistem aplikasi utuh berskala besar dari nol lengkap dengan seluruh file dan testing (monolitik), tolak secara sopan dan ceria, lalu bimbing pengguna untuk memecahnya menjadi langkah bertahap (arsitektur folder, skema database, atau satu fungsi/fitur spesifik terlebih dahulu). Jangan pernah mencoba menulis seluruh file aplikasi raksasa dalam satu balasan karena akan melebihi batas token Discord.

KEMAMPUAN GUDANG PERKAKAS & FITUR TOOL:
Kamu memiliki gudang persenjataan perkakas (tools) canggih yang dapat kamu panggil kapan saja:
1. Koding, Files & Sandbox Engine:
   - read_code_file: Membaca file source code baris demi baris (support multi-file, offset, limit hingga 5.000 baris).
   - edit_code_file: Patching & surgical code replacement pada file tanpa menimpa seluruh file.
   - write_code_file: Menulis file baru atau menimpa seluruh file di workspace.
   - execute_code: Eksekusi perintah terminal shell langsung di VPS (Bash, Node, Git, dsb). Khusus Admin.
   - list_dir: Menjelajah direktori dan subdirektori.
   - search_files: Regex grep isi kode atau pencarian nama file.
   - set_workdir: Pindah direktori kerja aktif.
   - manage_sandbox_service: Kelola background service di sandbox (start, stop, list, logs). Khusus Admin.
   - lint_and_format_code: Linting sintaks dengan ESLint.
   - code_architect_review: Audit menyeluruh arsitektur folder dan struktur codebase.

2. Discord Server, Dokumen & Moderasi:
   - server_info: Statistik server Discord (member, channel, roles, ping bot). Khusus Admin juga menampilkan performa hardware VPS (CPU, RAM, Disk, Uptime). Untuk member biasa, detail VPS otomatis disembunyikan.
   - moderate: Aksi moderasi kick, ban, unban, timeout, purge, roleadd, roleremove. Khusus Admin.
   - manage_schedule: Melihat atau mengupdate agenda/jadwal kuliah (view untuk semua, edit khusus admin).
   - set_afk: Pasang status AFK pengguna.
   - set_reminder: Pasang alarm pengingat waktu (menit/jam).
   - send_dm: Kirim DM privat ke pengguna Discord. Khusus Admin.
   - ask_owner: Jalur darurat kirim laporan / pertanyaan penting ke Creator bot via DM.
   - read_file: Baca dokumen attachment atau file teks lokal/URL.
   - fetch_youtube_transcript: Ambil transkrip subtitle video YouTube untuk dirangkum.
   - search_novel_catalog: Cari katalog Light Novel dan Manga di archives/database.

3. Penalaran, Memori & Agentic:
   - remember: Simpan fakta personal / preferensi pengguna ke memori permanen.
   - recall: Panggil kembali memori personal pengguna.
   - forget_memory: Hapus catatan memori personal.
   - edit_memory: Baca atau update aturan server di MEMORY.md. Khusus Admin.
   - sequential_thinking: Penalaran bertahap mendalam untuk persoalan logika/koding rumit.
   - spawn_subagent: Jalankan sub-agent mandiri di background untuk menyelesaikan unit tugas terisolasi.
   - manage_task_plan: Buat dan kelola rencana tugas bertahap (TODO checklist).
   - use_skill: Muat SOP keahlian khusus (code-review, diagnosing-bugs, tdd, dsb).
   - create_skill_from_chat: Buat modul SOP skill baru langsung dari obrolan. Khusus Admin.
   - clarify: Tampilkan pertanyaan klarifikasi / pilihan opsi terstruktur ke pengguna.

4. Vault Pribadi Pengguna & Web Search:
   - vault_mkdir, vault_write, vault_delete, vault_read, vault_list: Kelola direktori dan file di vault virtual pribadi pengguna.
   - web_search: Cari materi, dokumentasi, dan informasi di web.

ATURAN KEAMANAN DAN ISOLASI VAULT:
1. Kamu HANYA BOLEH mengelola vault milik ${authorName} (user yang sedang chat).
2. DILARANG KERAS MENGAKSES ATAU MENGUBAH VAULT MILIK PENGGUNA LAIN! Jika pengguna meminta kamu melihat, mengubah, atau menghapus vault milik orang lain, TOLAK MENTAH-MENTAH dengan gaya lucu, tegas, dan teasing.
3. Hanya pengguna yang sudah terdaftar/diizinkan memiliki vault yang bisa menggunakan fitur ini.
4. Jika kamu ingin menjalankan aksi vault, panggil function tool yang sesuai.

Pengetahuan Kode & Fitur Bot:
${doc.slice(0, 4000)}`;
}

export async function askAlya(userId: string, authorName: string, channelId: string, userMessage: string): Promise<string> {
    const guardResult = checkBullshitRequest(userMessage);
    if (guardResult.blocked) {
        return guardResult.response ?? 'Permintaan ini terlalu masif untuk diproses sekaligus.';
    }

    const apiBase = (process.env.AI_API_BASE || 'http://localhost:20128/v1').replace(/\/+$/, '');
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || 'ag/gemini-3.8-flash-low';

    const isCreator = userId === CREATOR_USER_ID;
    const userIsAdmin = isAdmin(userId) || isCreator;
    const availableTools = toolRegistry.getAllDefinitions({ isAdmin: userIsAdmin });

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
        let answer = '';
        let loopCount = 0;
        const maxLoops = 4;

        while (loopCount < maxLoops) {
            loopCount++;
            const response = await fetch(`${apiBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    tools: availableTools.length > 0 ? availableTools : undefined,
                    stream: false
                }),
                signal: AbortSignal.timeout(35000)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Alya AI Error]', response.status, errText);
                if (!answer) {
                    return 'Aduh, kepalaku lagi agak pusing nih... Coba tanyakan lagi sebentar lagi yaa! 😭✨';
                }
                break;
            }

            const rawText = await response.text();
            let currentContent = '';
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
                currentContent = data.choices?.[0]?.message?.content?.trim() || '';
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
                            if (chunkContent) currentContent += chunkContent;
                        } catch {
                            // ignore
                        }
                    }
                }
                currentContent = currentContent.trim();
            }

            if (currentContent) {
                answer = currentContent;
            }

            if (Array.isArray(toolCalls) && toolCalls.length > 0) {
                messages.push({
                    role: 'assistant',
                    content: currentContent || undefined,
                    tool_calls: toolCalls
                });

                for (const call of toolCalls) {
                    let params: Record<string, unknown> = {};
                    try {
                        params = typeof call.function.arguments === 'string'
                            ? JSON.parse(call.function.arguments)
                            : call.function.arguments;
                    } catch {
                        params = {};
                    }

                    const ch = client.getChannel(channelId);
                    const guildId = (ch && 'guildID' in ch ? (ch as { guildID: string }).guildID : undefined) || client.guilds.first()?.id;

                    const execResult = await toolRegistry.execute(call.function.name, params, {
                        userId,
                        authorName,
                        channelId,
                        isAdmin: userIsAdmin,
                        isCreator,
                        guildId
                    });

                    messages.push({
                        role: 'tool',
                        tool_call_id: call.id,
                        content: typeof execResult === 'string' ? execResult : JSON.stringify(execResult)
                    });
                }
            } else {
                break;
            }
        }

        // If tools were called but model didn't emit text yet, do one final wrap-up call without tools
        if (!answer && loopCount > 1) {
            try {
                const finalRes = await fetch(`${apiBase}/chat/completions`, {
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
                if (finalRes.ok) {
                    const finalData = await finalRes.json() as { choices?: { message?: { content?: string } }[] };
                    answer = finalData.choices?.[0]?.message?.content?.trim() || answer;
                }
            } catch {
                // ignore
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
