import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import util from 'util';

import { BotTool } from '../types';
import { getWorkdir, resolveSafePath } from './files';

const execPromise = util.promisify(exec);

export const lintAndFormatCodeTool: BotTool = {
    name: 'lint_and_format_code',
    description: 'Menjalankan linter dan formatter (ESLint) pada codebase untuk mendeteksi atau memperbaiki error sintaks.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path target file atau direktori yang ingin di-lint (default: src/)'
            },
            fix: {
                type: 'boolean',
                description: 'Otomatis memperbaiki masalah yang bisa diperbaiki (auto-fix) (default: false)'
            }
        }
    },
    adminOnly: true,
    execute: async (args) => {
        const targetPath = String(args.path || 'src/').trim();
        const fix = Boolean(args.fix);
        const command = `npx eslint ${targetPath} ${fix ? '--fix' : ''}`;

        try {
            const { stdout, stderr } = await execPromise(command, {
                cwd: getWorkdir(),
                timeout: 30000
            });
            return {
                success: true,
                clean: true,
                message: 'Linting berhasil dan tidak ada error atau masalah kode yang ditemukan.',
                stdout: stdout.slice(0, 2000),
                stderr: stderr.slice(0, 1000)
            };
        } catch (err: unknown) {
            const errorObj = err as { stdout?: string; stderr?: string; code?: number };
            return {
                success: false,
                clean: false,
                message: 'Ditemukan peringatan atau error linting pada kode.',
                exitCode: errorObj.code,
                stdout: (errorObj.stdout || '').slice(0, 3000),
                stderr: (errorObj.stderr || '').slice(0, 1000)
            };
        }
    }
};

export const codeArchitectReviewTool: BotTool = {
    name: 'code_architect_review',
    description: 'Melakukan audit dan analisis arsitektur menyeluruh terhadap struktur direktori, file, modul, dan dependensi codebase.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Direktori utama yang diaudit (default: src/)'
            }
        }
    },
    adminOnly: true,
    execute: async (args) => {
        const rootPath = resolveSafePath(String(args.path || 'src/').trim());
        const rootDir = getWorkdir();

        let packageInfo: Record<string, unknown> = {};
        try {
            const pkgRaw = await fs.readFile(path.join(rootDir, 'package.json'), 'utf-8');
            packageInfo = JSON.parse(pkgRaw);
        } catch {
            // ignore
        }

        let totalFiles = 0;
        let totalLines = 0;
        const extensionStats: Record<string, { files: number; lines: number }> = {};
        const folderStructure: Record<string, number> = {};

        const scan = async (dir: string) => {
            let entries;
            try {
                entries = await fs.readdir(dir, { withFileTypes: true });
            } catch {
                return;
            }

            for (const entry of entries) {
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                    continue;
                }
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const rel = path.relative(rootPath, full);
                    if (rel) {
                        folderStructure[rel] = (folderStructure[rel] || 0) + 1;
                    }
                    await scan(full);
                } else if (entry.isFile()) {
                    totalFiles++;
                    const ext = path.extname(entry.name) || '(no-ext)';
                    let linesCount = 0;
                    try {
                        const content = await fs.readFile(full, 'utf-8');
                        linesCount = content.split('\n').length;
                    } catch {
                        // ignore
                    }
                    totalLines += linesCount;
                    if (!extensionStats[ext]) {
                        extensionStats[ext] = { files: 0, lines: 0 };
                    }
                    extensionStats[ext].files++;
                    extensionStats[ext].lines += linesCount;
                }
            }
        };

        await scan(rootPath);

        return {
            success: true,
            summary: {
                auditedPath: rootPath,
                totalFiles,
                totalLines,
                languages: extensionStats,
                submodules: Object.keys(folderStructure).length
            },
            package: {
                name: packageInfo.name,
                version: packageInfo.version,
                dependenciesCount: Object.keys((packageInfo.dependencies as object) || {}).length,
                devDependenciesCount: Object.keys((packageInfo.devDependencies as object) || {}).length
            },
            keyComponents: Object.keys(folderStructure).slice(0, 20)
        };
    }
};
