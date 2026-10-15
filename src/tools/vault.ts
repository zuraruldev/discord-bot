import { isAdmin } from '../constants';
import {
    createDirectory,
    isVaultAllowed,
    listDirectory,
    readFile as vaultReadFile,
    removePath,
    writeToFile
} from '../vault/store';
import { toolRegistry } from './registry';
import { BotTool } from './types';

export async function executeVaultAction(
    userId: string,
    authorName: string,
    action: string,
    params: { path?: string; content?: string; append?: boolean }
): Promise<{ success: boolean; message: string }> {
    const allowed = await isVaultAllowed(userId);
    if (!allowed && !isAdmin(userId)) {
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

    // 1. Try DuckDuckGo Lite (reliable from server & datacenter IPs)
    try {
        const liteRes = await fetch('https://lite.duckduckgo.com/lite/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            body: new URLSearchParams({ q: cleanQuery }).toString(),
            signal: AbortSignal.timeout(8000)
        });

        if (liteRes.ok) {
            const html = await liteRes.text();
            const linkRegex = /<a[^>]+href=[\x27"]([^\x27"]+)[\x27"][^>]+class=[\x27"]result-link[\x27"][^>]*>([\s\S]*?)<\/a>/gi;
            const snippetRegex = /<td[^>]+class=[\x27"]result-snippet[\x27"][^>]*>([\s\S]*?)<\/td>/gi;

            const links: { url: string; title: string }[] = [];
            let lm: RegExpExecArray | null;
            while ((lm = linkRegex.exec(html)) !== null) {
                links.push({
                    url: lm[1],
                    title: lm[2].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim()
                });
            }

            const snippets: string[] = [];
            let sm: RegExpExecArray | null;
            while ((sm = snippetRegex.exec(html)) !== null) {
                snippets.push(
                    sm[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim()
                );
            }

            const results: { title: string; url: string; snippet: string }[] = [];
            for (let i = 0; i < Math.min(links.length, limit); i++) {
                if (links[i].url && links[i].title) {
                    results.push({
                        title: links[i].title,
                        url: links[i].url,
                        snippet: snippets[i] || ''
                    });
                }
            }

            if (results.length > 0) return results;
        }
    } catch {
        // fallback to standard html
    }

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
        // fallback
    }

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
        // fallback
    }

    const lower = cleanQuery.toLowerCase();
    const curatedRoadmaps: Record<string, { title: string; url: string; snippet: string }> = {
        devops: { title: 'DevOps Roadmap - roadmap.sh', url: 'https://roadmap.sh/devops', snippet: 'Step by step guide to becoming a DevOps Engineer in 2026' },
        terraform: { title: 'Terraform Roadmap - roadmap.sh', url: 'https://roadmap.sh/terraform', snippet: 'Community driven roadmap and resources to learn Terraform' },
        docker: { title: 'Docker Roadmap & Tutorial - roadmap.sh', url: 'https://roadmap.sh/docker', snippet: 'Learn Docker and containerization fundamentals' },
        kubernetes: { title: 'Kubernetes Roadmap - roadmap.sh', url: 'https://roadmap.sh/kubernetes', snippet: 'Complete roadmap for Kubernetes orchestration and clusters' },
        backend: { title: 'Backend Developer Roadmap - roadmap.sh', url: 'https://roadmap.sh/backend', snippet: 'Step by step guide to becoming a modern backend developer' },
        frontend: { title: 'Frontend Developer Roadmap - roadmap.sh', url: 'https://roadmap.sh/frontend', snippet: 'Step by step guide to becoming a modern frontend developer' },
        linux: { title: 'Linux Journey', url: 'https://linuxjourney.com', snippet: 'Free structured interactive guide to learning Linux from beginner to advanced' },
        golang: { title: 'Go Developer Roadmap - roadmap.sh', url: 'https://roadmap.sh/golang', snippet: 'Step by step guide to becoming a Go developer' },
        python: { title: 'Python Developer Roadmap - roadmap.sh', url: 'https://roadmap.sh/python', snippet: 'Step by step guide to becoming a Python developer' }
    };

    for (const [key, val] of Object.entries(curatedRoadmaps)) {
        if (lower.includes(key)) {
            return [val];
        }
    }

    return [];
}

export const vaultMkdirTool: BotTool = {
    name: 'vault_mkdir',
    description: 'Membuat direktori/folder baru di vault pribadi milik pengguna yang sedang chat saat ini.',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path direktori baru yang akan dibuat, misal: /catatan atau /project' }
        },
        required: ['path']
    },
    execute: async (args, context) => {
        return executeVaultAction(context.userId, context.authorName, 'vault_mkdir', {
            path: String(args.path || '')
        });
    }
};

export const vaultWriteTool: BotTool = {
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
    },
    execute: async (args, context) => {
        return executeVaultAction(context.userId, context.authorName, 'vault_write', {
            path: String(args.path || ''),
            content: String(args.content ?? ''),
            append: Boolean(args.append)
        });
    }
};

export const vaultDeleteTool: BotTool = {
    name: 'vault_delete',
    description: 'Menghapus file atau direktori di vault pribadi pengguna.',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path file atau direktori yang ingin dihapus, misal: /catatan.txt' }
        },
        required: ['path']
    },
    execute: async (args, context) => {
        return executeVaultAction(context.userId, context.authorName, 'vault_delete', {
            path: String(args.path || '')
        });
    }
};

export const vaultReadTool: BotTool = {
    name: 'vault_read',
    description: 'Membaca isi file teks dari vault pribadi pengguna.',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path file yang ingin dibaca, misal: /catatan.txt' }
        },
        required: ['path']
    },
    execute: async (args, context) => {
        return executeVaultAction(context.userId, context.authorName, 'vault_read', {
            path: String(args.path || '')
        });
    }
};

export const vaultListTool: BotTool = {
    name: 'vault_list',
    description: 'Melihat daftar file dan folder di direktori vault pribadi pengguna.',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path direktori yang ingin dilihat, misal: / atau /catatan' }
        }
    },
    execute: async (args, context) => {
        return executeVaultAction(context.userId, context.authorName, 'vault_list', {
            path: String(args.path || '/')
        });
    }
};

export const webSearchTool: BotTool = {
    name: 'web_search',
    description: 'Mencari informasi terkini, artikel, tutorial, link dokumentasi resmi, atau materi pembelajaran dari web/internet (misal: "devops roadmap", "docker tutorial", "react documentation").',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'Kata kunci pencarian web' }
        },
        required: ['query']
    },
    execute: async (args) => {
        const query = String(args.query || '').trim();
        const results = await searchWeb(query);
        return {
            query,
            resultsCount: results.length,
            results
        };
    }
};

export function registerVaultTools(): void {
    toolRegistry.register(vaultMkdirTool);
    toolRegistry.register(vaultWriteTool);
    toolRegistry.register(vaultDeleteTool);
    toolRegistry.register(vaultReadTool);
    toolRegistry.register(vaultListTool);
    toolRegistry.register(webSearchTool);
}
