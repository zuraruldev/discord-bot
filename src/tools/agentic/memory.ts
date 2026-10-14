import { promises as fs } from 'fs';
import path from 'path';

import { BotTool } from '../types';

const MEMORY_DB_FILE = path.resolve(process.cwd(), 'data/user_memories.json');
const GLOBAL_MEMORY_FILE = path.resolve(process.cwd(), 'MEMORY.md');

interface UserMemoryItem {
    key: string;
    value: string;
    category?: string;
    updatedAt: string;
}

type UserMemoryStore = Record<string, Record<string, UserMemoryItem>>;

let memoryCache: UserMemoryStore | null = null;

async function loadMemories(): Promise<UserMemoryStore> {
    if (memoryCache) return memoryCache;
    try {
        const raw = await fs.readFile(MEMORY_DB_FILE, 'utf-8');
        memoryCache = JSON.parse(raw);
    } catch {
        memoryCache = {};
    }
    return memoryCache!;
}

async function saveMemories(store: UserMemoryStore): Promise<void> {
    memoryCache = store;
    try {
        await fs.mkdir(path.dirname(MEMORY_DB_FILE), { recursive: true });
        await fs.writeFile(MEMORY_DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch {
        // ignore write error
    }
}

export const rememberTool: BotTool = {
    name: 'remember',
    description: 'Menyimpan fakta, preferensi, atau informasi personal penting milik pengguna ke dalam memori permanen.',
    parameters: {
        type: 'object',
        properties: {
            key: {
                type: 'string',
                description: 'Kunci atau topik memori (misal: "makanan_favorit", "tech_stack", "nama_panggilan")'
            },
            value: {
                type: 'string',
                description: 'Isi fakta atau preferensi yang diingat'
            },
            category: {
                type: 'string',
                description: 'Kategori memori (misal: "preference", "profile", "project", "fact")'
            }
        },
        required: ['key', 'value']
    },
    execute: async (args, context) => {
        const key = String(args.key || '').trim().toLowerCase();
        const value = String(args.value || '').trim();
        const category = args.category ? String(args.category).trim() : 'general';

        if (!key || !value) {
            return { success: false, message: 'key dan value wajib diisi.' };
        }

        const store = await loadMemories();
        if (!store[context.userId]) {
            store[context.userId] = {};
        }

        store[context.userId][key] = {
            key,
            value,
            category,
            updatedAt: new Date().toISOString()
        };

        await saveMemories(store);

        return {
            success: true,
            message: `Memori untuk topik "${key}" berhasil disimpan untuk ${context.authorName}.`,
            item: store[context.userId][key]
        };
    }
};

export const recallTool: BotTool = {
    name: 'recall',
    description: 'Mengingat kembali atau mencari catatan fakta / preferensi masa lalu milik pengguna dari memori.',
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Kata kunci pencarian memori (kosongkan jika ingin melihat semua memori pengguna)'
            }
        }
    },
    execute: async (args, context) => {
        const query = String(args.query || '').trim().toLowerCase();
        const store = await loadMemories();
        const userMemories = store[context.userId] || {};

        const entries = Object.values(userMemories);
        if (entries.length === 0) {
            return {
                success: true,
                total: 0,
                message: 'Belum ada memori personal yang tersimpan untukmu.',
                memories: []
            };
        }

        const filtered = query
            ? entries.filter(e => e.key.includes(query) || e.value.toLowerCase().includes(query) || (e.category && e.category.includes(query)))
            : entries;

        return {
            success: true,
            total: filtered.length,
            query: query || '(semua)',
            memories: filtered
        };
    }
};

export const forgetMemoryTool: BotTool = {
    name: 'forget_memory',
    description: 'Menghapus catatan fakta tertentu dari memori personal pengguna.',
    parameters: {
        type: 'object',
        properties: {
            key: {
                type: 'string',
                description: 'Kunci topik memori yang ingin dihapus'
            }
        },
        required: ['key']
    },
    execute: async (args, context) => {
        const key = String(args.key || '').trim().toLowerCase();
        const store = await loadMemories();
        const userMemories = store[context.userId];

        if (!userMemories || !userMemories[key]) {
            return {
                success: false,
                message: `Topik memori "${key}" tidak ditemukan.`
            };
        }

        delete userMemories[key];
        await saveMemories(store);

        return {
            success: true,
            message: `Memori topik "${key}" berhasil dihapus.`
        };
    }
};

export const editMemoryTool: BotTool = {
    name: 'edit_memory',
    description: 'Melihat atau memperbarui aturan global server dan instruksi bot di MEMORY.md. Khusus Admin.',
    parameters: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['read', 'write', 'append'],
                description: 'Aksi: "read" untuk membaca, "write" untuk menimpa, "append" untuk menambahkan aturan'
            },
            content: {
                type: 'string',
                description: 'Teks aturan yang ingin ditulis atau ditambahkan'
            }
        },
        required: ['action']
    },
    adminOnly: true,
    execute: async (args) => {
        const action = String(args.action || 'read').toLowerCase();
        const content = String(args.content || '').trim();

        if (action === 'read') {
            try {
                const text = await fs.readFile(GLOBAL_MEMORY_FILE, 'utf-8');
                return {
                    success: true,
                    file: 'MEMORY.md',
                    content: text
                };
            } catch {
                return {
                    success: true,
                    file: 'MEMORY.md',
                    content: '# MEMORY.md\nBelum ada catatan memori global yang dibuat.'
                };
            }
        }

        if (!content) {
            return { success: false, message: 'content wajib diisi untuk aksi write atau append.' };
        }

        try {
            if (action === 'append') {
                let existing = '';
                try {
                    existing = await fs.readFile(GLOBAL_MEMORY_FILE, 'utf-8');
                } catch {
                    existing = '# MEMORY.md\n\n';
                }
                const updated = existing.trimEnd() + '\n\n' + content + '\n';
                await fs.writeFile(GLOBAL_MEMORY_FILE, updated, 'utf-8');
                return {
                    success: true,
                    message: 'Aturan baru berhasil ditambahkan ke MEMORY.md.'
                };
            }

            if (action === 'write') {
                await fs.writeFile(GLOBAL_MEMORY_FILE, content, 'utf-8');
                return {
                    success: true,
                    message: 'MEMORY.md berhasil ditulis ulang.'
                };
            }

            return { success: false, message: `Aksi "${action}" tidak dikenal.` };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return { success: false, message: `Gagal memperbarui MEMORY.md: ${errorMsg}` };
        }
    }
};
