import { promises as fs } from 'fs';
import path from 'path';

import { BotTool } from '../types';

let currentWorkdir = process.cwd();

export function getWorkdir(): string {
    return currentWorkdir;
}

export function resolveSafePath(userPath: string): string {
    if (path.isAbsolute(userPath)) {
        return path.normalize(userPath);
    }
    return path.normalize(path.resolve(currentWorkdir, userPath));
}

export const readCodeFileTool: BotTool = {
    name: 'read_code_file',
    description: 'Membaca isi file source code baris per baris. Mendukung multi-file, offset baris, limit baris (hingga 5.000 baris), dan nomor baris.',
    parameters: {
        type: 'object',
        properties: {
            paths: {
                type: 'string',
                description: 'Path file yang ingin dibaca (bisa berupa satu path atau daftar path dipisah koma)'
            },
            offset: {
                type: 'number',
                description: 'Baris awal pembacaan (1-indexed, default: 1)'
            },
            limit: {
                type: 'number',
                description: 'Jumlah maksimum baris yang dibaca (default: 500, max: 5000)'
            },
            with_line_numbers: {
                type: 'boolean',
                description: 'Apakah menampilkan nomor baris di setiap baris (default: true)'
            }
        },
        required: ['paths']
    },
    adminOnly: true,
    execute: async (args) => {
        const pathsRaw = String(args.paths || '');
        const fileList = pathsRaw.split(',').map(p => p.trim()).filter(Boolean);
        if (fileList.length === 0) {
            return { success: false, message: 'Harap berikan minimal satu path file.' };
        }

        const offset = Math.max(1, Number(args.offset) || 1);
        const limit = Math.min(5000, Math.max(1, Number(args.limit) || 500));
        const withLineNumbers = args.with_line_numbers !== false;

        const results: Record<string, unknown>[] = [];

        for (const filePath of fileList) {
            const resolved = resolveSafePath(filePath);
            try {
                const stat = await fs.stat(resolved);
                if (stat.isDirectory()) {
                    results.push({
                        path: filePath,
                        error: 'Target adalah direktori, bukan file.'
                    });
                    continue;
                }

                const content = await fs.readFile(resolved, 'utf-8');
                const lines = content.split('\n');
                const totalLines = lines.length;
                const startIndex = offset - 1;
                const selectedLines = lines.slice(startIndex, startIndex + limit);

                const formatted = selectedLines.map((line, idx) => {
                    const lineNum = startIndex + idx + 1;
                    return withLineNumbers ? `${lineNum}: ${line}` : line;
                }).join('\n');

                results.push({
                    path: filePath,
                    resolvedPath: resolved,
                    totalLines,
                    linesRead: selectedLines.length,
                    offset,
                    content: formatted
                });
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                results.push({
                    path: filePath,
                    error: `Gagal membaca file: ${errorMsg}`
                });
            }
        }

        return {
            success: true,
            files: results
        };
    }
};

export const editCodeFileTool: BotTool = {
    name: 'edit_code_file',
    description: 'Melakukan surgical patch / replace string pada file kode tanpa menimpa seluruh file.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path file yang ingin diedit'
            },
            old_string: {
                type: 'string',
                description: 'Teks lama yang ingin diganti persis'
            },
            new_string: {
                type: 'string',
                description: 'Teks baru pengganti'
            },
            replace_all: {
                type: 'boolean',
                description: 'Ganti semua kemunculan atau hanya kemunculan pertama (default: false)'
            }
        },
        required: ['path', 'old_string', 'new_string']
    },
    adminOnly: true,
    execute: async (args) => {
        const filePath = String(args.path || '').trim();
        const oldString = String(args.old_string ?? '');
        const newString = String(args.new_string ?? '');
        const replaceAll = Boolean(args.replace_all);

        if (!filePath) {
            return { success: false, message: 'Path file tidak boleh kosong.' };
        }

        const resolved = resolveSafePath(filePath);
        try {
            const content = await fs.readFile(resolved, 'utf-8');
            let updatedContent = '';
            let replacements = 0;

            if (content.includes(oldString)) {
                if (replaceAll) {
                    updatedContent = content.split(oldString).join(newString);
                    replacements = content.split(oldString).length - 1;
                } else {
                    const idx = content.indexOf(oldString);
                    updatedContent = content.slice(0, idx) + newString + content.slice(idx + oldString.length);
                    replacements = 1;
                }
            } else {
                const normalizedContent = content.replace(/\r\n/g, '\n');
                const normalizedOld = oldString.replace(/\r\n/g, '\n');
                if (normalizedContent.includes(normalizedOld)) {
                    if (replaceAll) {
                        updatedContent = normalizedContent.split(normalizedOld).join(newString);
                        replacements = normalizedContent.split(normalizedOld).length - 1;
                    } else {
                        const idx = normalizedContent.indexOf(normalizedOld);
                        updatedContent = normalizedContent.slice(0, idx) + newString + normalizedContent.slice(idx + normalizedOld.length);
                        replacements = 1;
                    }
                } else {
                    return {
                        success: false,
                        message: `old_string tidak ditemukan di dalam file ${filePath}.`
                    };
                }
            }

            await fs.writeFile(resolved, updatedContent, 'utf-8');
            return {
                success: true,
                message: `File ${filePath} berhasil diperbarui (${replacements} penggantian dilakukan).`,
                replacements
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal mengedit file: ${errorMsg}`
            };
        }
    }
};

export const writeCodeFileTool: BotTool = {
    name: 'write_code_file',
    description: 'Menulis file baru atau menimpa (rewrite) seluruh isi file di dalam workspace/sandbox.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path file tujuan yang ingin dibuat/ditulis'
            },
            content: {
                type: 'string',
                description: 'Seluruh isi teks yang akan ditulis ke dalam file'
            }
        },
        required: ['path', 'content']
    },
    adminOnly: true,
    execute: async (args) => {
        const filePath = String(args.path || '').trim();
        const content = String(args.content ?? '');

        if (!filePath) {
            return { success: false, message: 'Path file tidak boleh kosong.' };
        }

        const resolved = resolveSafePath(filePath);
        try {
            await fs.mkdir(path.dirname(resolved), { recursive: true });
            await fs.writeFile(resolved, content, 'utf-8');
            return {
                success: true,
                message: `File ${filePath} berhasil ditulis (${content.length} karakter).`
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal menulis file: ${errorMsg}`
            };
        }
    }
};

export const listDirTool: BotTool = {
    name: 'list_dir',
    description: 'Menjelajah daftar file dan folder dalam direktori.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path direktori yang ingin dilihat (default: direktori aktif)'
            },
            recursive: {
                type: 'boolean',
                description: 'Apakah melihat isi subfolder secara rekursif (default: false)'
            },
            max_depth: {
                type: 'number',
                description: 'Kedalaman maksimum rekursif jika recursive: true (default: 2)'
            }
        }
    },
    adminOnly: true,
    execute: async (args) => {
        const targetPath = String(args.path || '.').trim();
        const recursive = Boolean(args.recursive);
        const maxDepth = Math.min(5, Math.max(1, Number(args.max_depth) || 2));
        const resolved = resolveSafePath(targetPath);

        const scan = async (dir: string, depth: number): Promise<unknown[]> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            const list: unknown[] = [];
            for (const entry of entries) {
                if (entry.name === 'node_modules' || entry.name === '.git') {
                    continue;
                }
                const fullEntryPath = path.join(dir, entry.name);
                const relPath = path.relative(resolved, fullEntryPath);
                if (entry.isDirectory()) {
                    const subEntries = (recursive && depth < maxDepth)
                        ? await scan(fullEntryPath, depth + 1)
                        : [];
                    list.push({
                        name: entry.name,
                        path: relPath,
                        type: 'directory',
                        children: subEntries.length > 0 ? subEntries : undefined
                    });
                } else {
                    list.push({
                        name: entry.name,
                        path: relPath,
                        type: 'file'
                    });
                }
            }
            return list;
        };

        try {
            const items = await scan(resolved, 1);
            return {
                success: true,
                currentWorkdir,
                targetPath,
                resolvedPath: resolved,
                total: items.length,
                entries: items
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal membaca direktori: ${errorMsg}`
            };
        }
    }
};

export const searchFilesTool: BotTool = {
    name: 'search_files',
    description: 'Mencari file berdasarkan regex/pencarian teks di dalam isi kode atau mencari nama file.',
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Kata kunci atau pola regex yang ingin dicari'
            },
            path: {
                type: 'string',
                description: 'Direktori awal pencarian (default: .)'
            },
            type: {
                type: 'string',
                enum: ['content', 'filename'],
                description: 'Tipe pencarian: "content" mencari di dalam isi file, "filename" mencari nama file (default: content)'
            },
            limit: {
                type: 'number',
                description: 'Batas jumlah hasil pencarian (default: 30)'
            }
        },
        required: ['query']
    },
    adminOnly: true,
    execute: async (args) => {
        const query = String(args.query || '').trim();
        const startPath = String(args.path || '.').trim();
        const searchType = args.type === 'filename' ? 'filename' : 'content';
        const limit = Math.min(100, Math.max(1, Number(args.limit) || 30));

        if (!query) {
            return { success: false, message: 'Query pencarian tidak boleh kosong.' };
        }

        const resolved = resolveSafePath(startPath);
        let regex: RegExp;
        try {
            regex = new RegExp(query, 'i');
        } catch {
            regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }

        const matches: Record<string, unknown>[] = [];

        const walk = async (dir: string) => {
            if (matches.length >= limit) return;
            let entries;
            try {
                entries = await fs.readdir(dir, { withFileTypes: true });
            } catch {
                return;
            }

            for (const entry of entries) {
                if (matches.length >= limit) break;
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                    continue;
                }
                const fullPath = path.join(dir, entry.name);
                const relPath = path.relative(resolved, fullPath);

                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile()) {
                    if (searchType === 'filename') {
                        if (regex.test(entry.name) || regex.test(relPath)) {
                            matches.push({ file: relPath });
                        }
                    } else {
                        try {
                            const content = await fs.readFile(fullPath, 'utf-8');
                            const lines = content.split('\n');
                            for (let i = 0; i < lines.length; i++) {
                                if (matches.length >= limit) break;
                                if (regex.test(lines[i])) {
                                    matches.push({
                                        file: relPath,
                                        lineNumber: i + 1,
                                        lineContent: lines[i].trim()
                                    });
                                }
                            }
                        } catch {
                            continue;
                        }
                    }
                }
            }
        };

        await walk(resolved);

        return {
            success: true,
            query,
            type: searchType,
            totalMatches: matches.length,
            matches
        };
    }
};

export const setWorkdirTool: BotTool = {
    name: 'set_workdir',
    description: 'Melihat atau berpindah direktori kerja aktif untuk proses sandbox dan eksekusi.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path direktori baru yang dituju (kosongkan jika hanya ingin melihat direktori aktif)'
            }
        }
    },
    adminOnly: true,
    execute: async (args) => {
        const targetPath = String(args.path || '').trim();
        if (!targetPath) {
            return {
                success: true,
                currentWorkdir
            };
        }

        const resolved = resolveSafePath(targetPath);
        try {
            const stat = await fs.stat(resolved);
            if (!stat.isDirectory()) {
                return {
                    success: false,
                    message: `Path ${targetPath} bukan sebuah direktori.`
                };
            }
            currentWorkdir = resolved;
            return {
                success: true,
                message: `Direktori kerja aktif berhasil dipindahkan ke: ${currentWorkdir}`,
                currentWorkdir
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Direktori tidak ditemukan: ${errorMsg}`
            };
        }
    }
};
