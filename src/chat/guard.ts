export interface GuardCheckResult {
    blocked: boolean;
    reason?: 'unrealistic_app_creation' | 'excessive_token_demand';
    response?: string;
}

const APP_CREATION_PATTERNS = [
    /\b(?:buat(?:kan)?|bikin(?:kan)?|develop|bangun|ciptakan|create|build|generate|code|program)\s+(?:(?:sebuah|suatu|satu|a|an|the|full(?:stack)?|complete|entire|whole)\s+)*(?:aplikasi|sistem|app|apps|application|web(?:site)?|web\s*app(?:lication)?|platform|software|proyek|project|program)\b/i,
    /\b(?:buat(?:kan)?|bikin(?:kan)?|develop|bangun|create|build)\s+.*?\b(?:aplikasi|sistem|website|web\s*app|software)\s+berbasis\b/i
];

const FULL_PROJECT_DEMANDS = [
    /\b(?:buat|bikin|tulis|generate|sediakan|ciptakan|create|write|provide)\s+(?:seluruh|semua|all|every)\s+(?:file|files|berkas|dokumen|komponen|modul|code|kode|source\s*code)\b/i,
    /\b(?:seluruh|semua|all|every)\s+file\s+yang\s+(?:di)?perlukan\b/i,
    /\ball\s+(?:the\s*)?(?:required|necessary)\s+files\b/i,
    /\b(?:seluruh|semua|all|every)\s+(?:source\s*code|kode\s*program)\b/i,
    /\b(?:susun|buat|rancang|buatkan)\s+project\s+dengan\s+struktur\s+(?:yang\s+)?(?:rapi|modular|lengkap)\b/i,
    /\b(?:struktur\s+(?:folder|proyek|project)\s+(?:yang\s+)?(?:rapi|modular|lengkap))\b/i,
    /\b(?:dari\s+awal\s+(?:sampai|hingga)\s+(?:jadi|selesai|akhir)|from\s+scratch\s+to\s+production)\b/i
];

const TEST_EXECUTION_DEMANDS = [
    /\b(?:jalankan|lakukan|eksekusi|run|execute)\s+(?:pengujian|tests?|testing|unit\s*tests?|uji\s*coba)\b/i,
    /\b(?:pastikan\s+semua\s+fitur\s+(?:utama\s*)?(?:bekerja|berjalan)|ensure\s+all\s+features\s+work|make\s+sure\s+all\s+features\s+work)\b/i
];

const FEATURE_KEYWORDS = [
    { name: 'auth', regex: /\b(?:autentikasi|otentikasi|authentication|auth|login|register|signup|jwt|oauth|session|user auth)\b/i },
    { name: 'dashboard', regex: /\b(?:dashboard|dasbor|admin\s*panel|panel\s*admin)\b/i },
    { name: 'crud', regex: /\b(?:crud|create\s*read\s*update\s*delete|tambah\s*kurang\s*ubah\s*hapus|manajemen\s*(?:transaksi|data|produk|user|keuangan))\b/i },
    { name: 'category', regex: /\b(?:kategori|kategorisasi|categor(?:y|ies))\b/i },
    { name: 'search_filter', regex: /\b(?:pencarian(?:\s+dan\s+|\s*\/\s*)filter|filter(?:\s+dan\s+|\s*\/\s*)pencarian|search(?:\s+and\s+|\s*\/\s*)filter)\b/i },
    { name: 'report', regex: /\b(?:laporan(?:\s+keuangan|\s+bulanan|\s+harian)?|financial\s*report|monthly\s*report|rekap)\b/i },
    { name: 'chart', regex: /\b(?:grafik|chart|charts|diagram|visualisasi)\b/i },
    { name: 'auto_calc', regex: /\b(?:perhitungan(?:\s+saldo)?\s*otomatis|automatic\s*calc(?:ulation)?|kalkulasi\s*otomatis)\b/i },
    { name: 'export', regex: /\b(?:export(?:\s+laporan)?\s*ke\s*(?:csv|pdf|excel)|export\s*to\s*(?:csv|pdf|excel)|ekspor\s*ke\s*(?:csv|pdf|excel)|csv\s*export)\b/i },
    { name: 'database', regex: /\b(?:database(?:\s+(?:sqlite|mysql|postgres|postgresql|mongodb))?|sqlite|postgresql|mysql|mongodb)\b/i },
    { name: 'validation', regex: /\b(?:validasi\s*input|input\s*validation|sanitasi\s*input)\b/i },
    { name: 'error_handling', regex: /\b(?:error\s*handling|penanganan\s*(?:error|kesalahan)|exception\s*handling)\b/i },
    { name: 'responsive_ui', regex: /\b(?:desain\s*antarmuka(?:\s+yang)?\s*responsif|responsive\s*(?:ui|interface|design|dashboard)|antarmuka\s*responsif)\b/i },
    { name: 'payment', regex: /\b(?:payment\s*gateway|pembayaran|stripe|paypal|midtrans|xendit)\b/i },
    { name: 'notification', regex: /\b(?:notifikasi|notif|email\s*notification|push\s*notification)\b/i }
];

const EXCESSIVE_CODE_PATTERNS = [
    /\b(?:\d{3,}|ribuan|thousands?\s+of)\s*(?:baris|lines\s*of\s*code|loc)\b/i,
    /\b(?:tulis|buat|generate|code)\s+(?:seluruh|semua)\s+(?:source\s*code|kode|repository|repo)\s+(?:tanpa\s+(?:di)?(?:potong|singkat|ringkas))\b/i,
    /\b(?:without\s+truncat(?:ion|ed)|full\s+untruncated\s+code)\b/i
];

function isPredominantlyEnglish(text: string): boolean {
    const idMatches = (text.match(/\b(?:buat|bikin|yang|dan|dengan|untuk|aplikasi|fitur|seluruh|pengujian|harus|jalankan|memiliki|laporan)\b/gi) || []).length;
    const enMatches = (text.match(/\b(?:build|create|make|with|for|application|features|entire|testing|must|run|have|report|please)\b/gi) || []).length;
    return enMatches > idMatches;
}

function getUnrealisticAppResponse(isEn: boolean): string {
    if (isEn) {
        return `Hold on a second! 🛑😅 Asking to build a complete full-stack application from scratch with multiple complex modules, all required files, and automated test execution in a single prompt is way too massive!

If I tried to generate everything at once:
💥 **Token Overflow & Timeout:** The token quota will be exhausted and the output will be cut off midway.
🐛 **High Bug Risk:** Generating dozens of components all at once without iterative testing leads to fragile, broken code.
⚙️ **Discord Environment Limits:** I am a Discord assistant, not a local execution runner capable of compiling and running live end-to-end tests for your application.

💡 **A Better & Realistic Approach:**
Let's build your project step by step:
1. 📐 **Architecture:** Start with the modular project and folder structure.
2. 🗄️ **Database:** Ask for the database schema or model design (e.g. SQLite / PostgreSQL).
3. 💻 **Specific Features:** Ask for one feature at a time (e.g. user authentication, CRUD operations, or CSV export).

Which component would you like to start with? Let's tackle it piece by piece! 💻🚀✨`;
    }

    return `Waduh waduh, tahan dulu Kak! 🛑😅 Permintaan bikin *full application* dari nol sampai jadi lengkap dengan segudang modul, seluruh file proyek, dan pengujian sekaligus dalam satu pesan ini kelewat masif!

Kalau Alya paksakan generate semuanya langsung di sini:
💥 **Token Jebol & Timeout:** Limit token bakal langsung habis dan responnya terpotong di tengah jalan.
🐛 **Rawan Bug & Inkonsistensi:** Menulis puluhan file dan modul sekaligus tanpa pengujian bertahap pasti menghasilkan kode yang rapuh dan rawan error.
⚙️ **Batas Lingkungan Discord:** Alya adalah bot asisten Discord, bukan runtime server lokal yang bisa langsung mengeksekusi dan menjalankan testing aplikasi full-stack kamu secara live.

💡 **Cara yang Lebih Asik & Efektif:**
Yuk kita rancang secara bertahap (step-by-step)! Kamu bisa minta:
1. 📐 **Arsitektur:** Tanya struktur folder modular atau arsitektur sistemnya dulu.
2. 🗄️ **Database:** Minta skema database atau model datanya (misal: SQLite/PostgreSQL).
3. 💻 **Fitur Spesifik:** Minta implementasi satu per satu (misal: sistem autentikasi, fungsi CRUD tertentu, atau cara export CSV).

Spill mau mulai bedah dari bagian mana dulu nih? Alya siap dampingi sampai aplikasimu beres! 💻🚀✨`;
}

function getExcessiveCodeResponse(isEn: boolean): string {
    if (isEn) {
        return `Hold on a moment! 🛑😅 Asking to generate hundreds or thousands of lines of code at once in a single Discord message exceeds token capacity. Discord limits and AI token boundaries will truncate the code mid-stream and cause bugs.

💡 **Practical Solution:**
Please ask for code incrementally per specific function or module! Which part should we start with? I'm ready to help! 💻✨`;
    }

    return `Waduh Kak, santai dulu! 🛑😅 Permintaan untuk men-generate ratusan hingga ribuan baris kode sekaligus dalam satu pesan Discord ini melebihi kapasitas output token. Batas respons Discord dan model AI akan otomatis memotong kode di tengah jalan (truncated) dan rawan error.

💡 **Solusi Praktis:**
Minta kode secara bertahap per modul atau fungsi spesifik yaa! Modul mana yang mau kita tulis kodenya duluan? Alya siap bantu! 💻✨`;
}

export function checkBullshitRequest(userMessage: string): GuardCheckResult {
    const raw = userMessage.includes('Pesan Pengguna:')
        ? userMessage.split('Pesan Pengguna:').slice(1).join('Pesan Pengguna:').trim()
        : userMessage.trim();

    if (!raw) {
        return { blocked: false };
    }

    const text = raw.toLowerCase();
    const isEn = isPredominantlyEnglish(text);

    for (const pattern of EXCESSIVE_CODE_PATTERNS) {
        if (pattern.test(text)) {
            return {
                blocked: true,
                reason: 'excessive_token_demand',
                response: getExcessiveCodeResponse(isEn)
            };
        }
    }

    const isAppCreation = APP_CREATION_PATTERNS.some(p => p.test(text));
    const matchedFeatures = FEATURE_KEYWORDS.filter(f => f.regex.test(text));
    const matchedDemands = FULL_PROJECT_DEMANDS.filter(d => d.test(text));
    const matchedTestDemands = TEST_EXECUTION_DEMANDS.filter(d => d.test(text));

    const totalFeatures = matchedFeatures.length;
    const totalDemands = matchedDemands.length;
    const totalTestDemands = matchedTestDemands.length;

    let shouldBlock = false;

    if (isAppCreation) {
        if (totalFeatures >= 4) {
            shouldBlock = true;
        } else if (totalDemands >= 1 && totalFeatures >= 2) {
            shouldBlock = true;
        } else if (totalDemands >= 1 && totalTestDemands >= 1) {
            shouldBlock = true;
        } else if (text.length > 350 && totalFeatures >= 3) {
            shouldBlock = true;
        }
    } else {
        if (totalFeatures >= 5 && (totalDemands >= 1 || totalTestDemands >= 1)) {
            shouldBlock = true;
        } else if (totalDemands >= 2 && totalFeatures >= 3) {
            shouldBlock = true;
        }
    }

    if (shouldBlock) {
        return {
            blocked: true,
            reason: 'unrealistic_app_creation',
            response: getUnrealisticAppResponse(isEn)
        };
    }

    return { blocked: false };
}
