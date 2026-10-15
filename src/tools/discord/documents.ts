import { promises as fs } from 'fs';

import { inspectImage } from '../../chat/vision';
import {
    addScheduleItem,
    clearScheduleDay,
    getScheduleForDay,
    loadScheduleDb,
    normalizeDayName,
    removeScheduleItem,
    WEEKDAYS
} from '../../schedule/store';
import { ScheduleItem } from '../../schedule/types';
import { resolveSafePath } from '../coding/files';
import { BotTool } from '../types';

function cleanHtmlText(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const metaDescMatch = html.match(/<meta[^>]+(?:name|property)=['"](?:description|og:description)['"][^>]+content=['"]([^'"]+)['"]/i)
        || html.match(/<meta[^>]+content=['"]([^'"]+)['"][^>]+(?:name|property)=['"](?:description|og:description)['"]/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

    const cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<br\s*[/]?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

    return [
        title ? `Judul Halaman: ${title}` : '',
        metaDesc ? `Deskripsi: ${metaDesc}` : '',
        cleaned
    ].filter(Boolean).join('\n\n');
}

async function fetchUrlContent(url: string, maxChars: number): Promise<{
    success: boolean;
    content?: string;
    message?: string;
    source?: string;
    is_image?: boolean;
    url?: string;
    totalLength?: number;
}> {
    const isPotentialImage = /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url.split('?')[0])
        || /^https?:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\/attachments\//i.test(url);

    if (isPotentialImage) {
        const imgRes = await inspectImage(url);
        if (imgRes.success) {
            return {
                success: true,
                source: 'url',
                is_image: true,
                url,
                content: imgRes.analysis
            };
        }
    }

    // Special handling for GitHub repository URL (fetch README automatically)
    const ghMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/?$|\/(?:tree|blob)\/[^/#?]+)?$/i);
    if (ghMatch) {
        const owner = ghMatch[1];
        const repo = ghMatch[2].replace(/\.git$/i, '');
        const candidateBranches = ['main', 'master'];
        for (const branch of candidateBranches) {
            try {
                const rawReadmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
                const rRes = await fetch(rawReadmeUrl, { signal: AbortSignal.timeout(8000) });
                if (rRes.ok) {
                    const text = await rRes.text();
                    return {
                        success: true,
                        source: 'github_readme',
                        url: rawReadmeUrl,
                        totalLength: text.length,
                        content: text.slice(0, maxChars)
                    };
                }
            } catch {
                // try next candidate
            }
        }
    }

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7'
        },
        signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) {
        return { success: false, message: `Gagal mengunduh file atau halaman dari URL: Status ${res.status}` };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.startsWith('image/')) {
        const imgRes = await inspectImage(url);
        return {
            success: true,
            source: 'url',
            is_image: true,
            url,
            content: imgRes.analysis || imgRes.message
        };
    }

    const rawText = await res.text();
    let finalContent = rawText;
    if (contentType.includes('html') || rawText.includes('<html') || rawText.includes('<!DOCTYPE')) {
        finalContent = cleanHtmlText(rawText);
    }

    return {
        success: true,
        source: 'url',
        url,
        totalLength: finalContent.length,
        content: finalContent.slice(0, maxChars)
    };
}

export const fetchWebPageTool: BotTool = {
    name: 'fetch_web_page',
    description: 'Mengambil dan membaca isi konten dari link URL web, dokumentasi resmi, artikel, atau repositori GitHub (misal: "https://github.com/nvidia/skillspector", "https://docs.docker.com"). Otomatis mengekstrak teks bersih atau README repository.',
    parameters: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'URL halaman web atau repositori GitHub yang ingin dibaca'
            },
            max_chars: {
                type: 'number',
                description: 'Batas jumlah karakter konten (default: 5000)'
            }
        },
        required: ['url']
    },
    execute: async (args) => {
        const url = String(args.url || '').trim();
        const maxChars = Math.min(10000, Math.max(500, Number(args.max_chars) || 5000));
        if (!url) {
            return { success: false, message: 'Harap berikan link URL yang valid.' };
        }
        return await fetchUrlContent(url, maxChars);
    }
};

export const readFileTool: BotTool = {
    name: 'read_file',
    description: 'Membaca isi file teks, dokumen, repositori GitHub, link web/URL, atau attachment Discord (TXT, JSON, CSV, Markdown, README, dsb). Otomatis mengenali visual jika berupa gambar.',
    parameters: {
        type: 'object',
        properties: {
            path_or_url: {
                type: 'string',
                description: 'Path file lokal atau URL link web / repositori GitHub / attachment Discord'
            },
            max_chars: {
                type: 'number',
                description: 'Jumlah karakter maksimum yang dibaca (default: 4000)'
            }
        },
        required: ['path_or_url']
    },
    execute: async (args) => {
        const input = String(args.path_or_url || '').trim();
        const maxChars = Math.min(10000, Math.max(500, Number(args.max_chars) || 4000));

        if (!input) {
            return { success: false, message: 'Harap berikan path file atau URL attachment.' };
        }

        try {
            if (/^https?:\/\//i.test(input)) {
                return await fetchUrlContent(input, maxChars);
            }

            if (isPotentialImage) {
                const imgRes = await inspectImage(input);
                if (imgRes.success) {
                    return {
                        success: true,
                        source: 'local_file',
                        is_image: true,
                        path: input,
                        content: imgRes.analysis
                    };
                }
            }

            const resolved = resolveSafePath(input);
            const content = await fs.readFile(resolved, 'utf-8');
            return {
                success: true,
                source: 'local_file',
                path: input,
                totalLength: content.length,
                content: content.slice(0, maxChars)
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal membaca file: ${errorMsg}`
            };
        }
    }
};

export const inspectImageTool: BotTool = {
    name: 'inspect_image',
    description: 'Membaca, mengekstrak teks (OCR), dan menganalisis gambar dari URL link Discord/web atau file lokal.',
    parameters: {
        type: 'object',
        properties: {
            image_url_or_path: {
                type: 'string',
                description: 'URL gambar (attachment Discord, web) atau path file lokal'
            },
            instruction: {
                type: 'string',
                description: 'Instruksi khusus untuk analisis gambar (misal: "baca seluruh teks", "jelaskan diagram arsitektur", dll)'
            }
        },
        required: ['image_url_or_path']
    },
    execute: async (args) => {
        const input = String(args.image_url_or_path || '').trim();
        const instruction = args.instruction ? String(args.instruction) : undefined;
        if (!input) {
            return { success: false, message: 'Harap berikan path file atau URL gambar.' };
        }
        return await inspectImage(input, instruction);
    }
};

export const fetchYoutubeTranscriptTool: BotTool = {
    name: 'fetch_youtube_transcript',
    description: 'Mengambil transkrip / subtitle teks dari video YouTube untuk dirangkum atau dipelajari.',
    parameters: {
        type: 'object',
        properties: {
            video_url_or_id: {
                type: 'string',
                description: 'URL YouTube (youtube.com / youtu.be) atau 11 karakter ID video'
            },
            language: {
                type: 'string',
                description: 'Kode bahasa subtitle (default: "id" atau "en")'
            }
        },
        required: ['video_url_or_id']
    },
    execute: async (args) => {
        const input = String(args.video_url_or_id || '').trim();
        const lang = String(args.language || 'id').toLowerCase();

        const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/) || input.match(/^([\w-]{11})$/);
        const videoId = match ? match[1] : '';

        if (!videoId) {
            return { success: false, message: 'URL atau Video ID YouTube tidak valid.' };
        }

        try {
            const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': `${lang},id;q=0.9,en;q=0.8`
                },
                signal: AbortSignal.timeout(10000)
            });

            if (!pageRes.ok) {
                return { success: false, message: `Gagal memuat video YouTube: HTTP ${pageRes.status}` };
            }

            const html = await pageRes.text();
            const titleMatch = html.match(/<title>([^<]+)<\/title>/);
            const videoTitle = titleMatch ? titleMatch[1].replace('- YouTube', '').trim() : 'Video YouTube';

            const captionIndex = html.indexOf('"captionTracks":');
            if (captionIndex === -1) {
                return {
                    success: false,
                    videoId,
                    videoTitle,
                    message: 'Video ini tidak memiliki subtitle/transkrip yang tersedia secara publik.'
                };
            }

            const captionSubstring = html.slice(captionIndex + 16, captionIndex + 4000);
            const endBracket = captionSubstring.indexOf(']');
            if (endBracket === -1) {
                return { success: false, message: 'Gagal memproses data subtitle YouTube.' };
            }

            const rawTracks = captionSubstring.slice(0, endBracket + 1);
            const tracks = JSON.parse(rawTracks) as { baseUrl: string; languageCode: string; name?: { simpleText?: string } }[];

            const targetTrack = tracks.find(t => t.languageCode === lang)
                || tracks.find(t => t.languageCode.startsWith(lang))
                || tracks.find(t => t.languageCode === 'en')
                || tracks[0];

            if (!targetTrack?.baseUrl) {
                return { success: false, message: 'Track subtitle yang cocok tidak ditemukan.' };
            }

            const transcriptRes = await fetch(targetTrack.baseUrl, { signal: AbortSignal.timeout(10000) });
            const xml = await transcriptRes.text();

            const textMatches = Array.from(xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g));
            const lines = textMatches.map(m => {
                return m[1]
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .trim();
            }).filter(Boolean);

            const transcript = lines.join(' ');

            return {
                success: true,
                videoId,
                videoTitle,
                language: targetTrack.languageCode,
                totalSegments: lines.length,
                transcript: transcript.slice(0, 6000)
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal mengambil transkrip YouTube: ${errorMsg}`
            };
        }
    }
};

export const searchNovelCatalogTool: BotTool = {
    name: 'search_novel_catalog',
    description: 'Mencari katalog buku, Light Novel, atau Manga (judul, sinopsis, status rilis, rating, genre).',
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Judul light novel, web novel, atau manga yang dicari'
            },
            type: {
                type: 'string',
                enum: ['NOVEL', 'MANGA'],
                description: 'Format yang dicari (default: NOVEL)'
            }
        },
        required: ['query']
    },
    execute: async (args) => {
        const query = String(args.query || '').trim();
        const mediaType = args.type === 'MANGA' ? 'MANGA' : 'NOVEL';

        if (!query) {
            return { success: false, message: 'Query pencarian novel tidak boleh kosong.' };
        }

        const graphqlQuery = `
        query ($search: String, $type: MediaType) {
            Page(page: 1, perPage: 5) {
                media(search: $search, type: $type, sort: POPULARITY_DESC) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    format
                    status
                    description(asHtml: false)
                    genres
                    averageScore
                    chapters
                    volumes
                    siteUrl
                }
            }
        }`;

        try {
            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: {
                        search: query,
                        type: 'MANGA'
                    }
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) {
                return { success: false, message: `Gagal menghubungi API katalog: HTTP ${res.status}` };
            }

            const data = await res.json() as {
                data?: {
                    Page?: {
                        media?: {
                            id: number;
                            title: { romaji: string; english: string; native: string };
                            format: string;
                            status: string;
                            description: string;
                            genres: string[];
                            averageScore: number;
                            volumes: number;
                            chapters: number;
                            siteUrl: string;
                        }[];
                    };
                };
            };

            const list = data.data?.Page?.media || [];
            if (list.length === 0) {
                return {
                    success: true,
                    query,
                    message: `Tidak ditemukan ${mediaType.toLowerCase()} dengan judul "${query}".`,
                    results: []
                };
            }

            const results = list.map(item => ({
                id: item.id,
                title: item.title.english || item.title.romaji || item.title.native,
                nativeTitle: item.title.native,
                format: item.format,
                status: item.status,
                rating: item.averageScore ? `${item.averageScore}%` : 'N/A',
                genres: item.genres,
                volumes: item.volumes || 'Ongoing/TBD',
                chapters: item.chapters || 'Ongoing/TBD',
                synopsis: item.description ? item.description.replace(/<[^>]+>/g, '').slice(0, 300) + '...' : 'Tidak ada sinopsis.',
                url: item.siteUrl
            }));

            return {
                success: true,
                query,
                count: results.length,
                results
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal mencari katalog: ${errorMsg}`
            };
        }
    }
};

export const manageScheduleTool: BotTool = {
    name: 'manage_schedule',
    description: 'Melihat atau memperbarui jadwal mata kuliah dan agenda rutin bot.',
    parameters: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['view', 'add', 'remove', 'clear'],
                description: 'Aksi yang dilakukan: "view" (semua user), "add", "remove", "clear" (khusus admin)'
            },
            day: {
                type: 'string',
                description: 'Nama hari (senin, selasa, rabu, kamis, jumat, dsb)'
            },
            index: {
                type: 'number',
                description: 'Nomor index urutan jadwal yang ingin dihapus (untuk aksi "remove")'
            },
            item: {
                type: 'object',
                description: 'Objek mata kuliah baru untuk aksi "add"',
                properties: {
                    matkul: { type: 'string', description: 'Nama mata kuliah' },
                    timeStarted: { type: 'string', description: 'Jam mulai (misal: "08:20")' },
                    timeEnded: { type: 'string', description: 'Jam selesai (misal: "11:10")' },
                    tempat: { type: 'string', description: 'Ruangan atau lokasi kelas' },
                    type: { type: 'string', description: 'Teori atau Praktek' }
                }
            }
        },
        required: ['action']
    },
    execute: async (args, context) => {
        const action = String(args.action || 'view').toLowerCase();
        const db = await loadScheduleDb();

        if (action === 'view') {
            const targetDay = args.day ? normalizeDayName(String(args.day)) : '';
            if (targetDay) {
                const list = getScheduleForDay(db, targetDay);
                return {
                    success: true,
                    day: targetDay,
                    total: list.length,
                    schedule: list
                };
            }

            const weekly: Record<string, unknown[]> = {};
            for (const d of WEEKDAYS) {
                weekly[d] = getScheduleForDay(db, d);
            }
            return {
                success: true,
                weekly
            };
        }

        if (!context.isAdmin) {
            return {
                success: false,
                message: 'Akses ditolak: Mengubah jadwal perkuliahan hanya boleh dilakukan oleh Admin atau Developer.'
            };
        }

        const dayInput = String(args.day || '');
        if (!dayInput) {
            return { success: false, message: 'Harap tentukan nama hari.' };
        }

        if (action === 'add') {
            const item = args.item as ScheduleItem;
            if (!item?.matkul) {
                return { success: false, message: 'Objek item jadwal harus menyertakan nama "matkul".' };
            }
            const addRes = await addScheduleItem(dayInput, item);
            if (!addRes.success) {
                return { success: false, message: addRes.error || 'Gagal menambahkan jadwal.' };
            }
            return {
                success: true,
                message: `Mata kuliah "${item.matkul}" berhasil ditambahkan ke jadwal hari ${addRes.dayKey}.`
            };
        }

        if (action === 'remove') {
            const index = Number(args.index) || 1;
            const rmRes = await removeScheduleItem(dayInput, index);
            if (!rmRes.success) {
                return { success: false, message: rmRes.error || 'Gagal menghapus jadwal.' };
            }
            return {
                success: true,
                message: `Jadwal urutan #${index} (${(rmRes.removed as ScheduleItem)?.matkul || 'item'}) hari ${rmRes.dayKey} berhasil dihapus.`
            };
        }

        if (action === 'clear') {
            const clRes = await clearScheduleDay(dayInput);
            if (!clRes.success) {
                return { success: false, message: clRes.error || 'Gagal mengosongkan jadwal.' };
            }
            return {
                success: true,
                message: `Semua jadwal pada hari ${clRes.dayKey} berhasil dikosongkan.`
            };
        }

        return { success: false, message: `Aksi schedule "${action}" tidak dikenal.` };
    }
};
