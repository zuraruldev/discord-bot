import { promises as fs } from 'fs';
import path from 'path';

import { BotTool } from '../types';

const SKILLS_DIR = path.resolve(process.cwd(), 'data/skills');
const GLOBAL_SKILLS_DIR = '/home/zura/.agents/skills';

export const useSkillTool: BotTool = {
    name: 'use_skill',
    description: 'Memanggil SOP atau modul keahlian khusus (Skill) seperti code-review, diagnosing-bugs, tdd, to-spec, dsb.',
    parameters: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Nama skill yang ingin dipanggil (misal: "diagnosing-bugs", "tdd", "code-review", "codebase-design")'
            }
        },
        required: ['name']
    },
    execute: async (args) => {
        const skillName = String(args.name || '').trim().toLowerCase();
        if (!skillName) {
            return { success: false, message: 'Nama skill wajib diisi.' };
        }

        const candidatePaths = [
            path.join(GLOBAL_SKILLS_DIR, skillName, 'SKILL.md'),
            path.join(SKILLS_DIR, `${skillName}.md`),
            path.join(SKILLS_DIR, skillName, 'SKILL.md'),
            path.join(process.cwd(), 'docs/agents', `${skillName}.md`)
        ];

        for (const p of candidatePaths) {
            try {
                const content = await fs.readFile(p, 'utf-8');
                return {
                    success: true,
                    skillName,
                    sourcePath: p,
                    instructions: content
                };
            } catch {
                continue;
            }
        }

        let availableGlobal: string[] = [];
        try {
            const entries = await fs.readdir(GLOBAL_SKILLS_DIR, { withFileTypes: true });
            availableGlobal = entries.filter(e => e.isDirectory()).map(e => e.name);
        } catch {
            // ignore
        }

        return {
            success: false,
            message: `Skill "${skillName}" tidak ditemukan.`,
            availableSkills: availableGlobal
        };
    }
};

export const createSkillFromChatTool: BotTool = {
    name: 'create_skill_from_chat',
    description: 'Menyimpan SOP atau panduan kerja baru ke dalam repositori skill lokal langsung dari obrolan. Khusus Admin.',
    parameters: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Nama slug skill (huruf kecil dan tanda minus, misal: "deploy-docker-vps")'
            },
            description: {
                type: 'string',
                description: 'Deskripsi singkat fungsi skill'
            },
            instructions: {
                type: 'string',
                description: 'Isi lengkap pedoman SOP langkah demi langkah'
            }
        },
        required: ['name', 'description', 'instructions']
    },
    adminOnly: true,
    execute: async (args) => {
        const name = String(args.name || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const description = String(args.description || '').trim();
        const instructions = String(args.instructions || '').trim();

        if (!name || !instructions) {
            return { success: false, message: 'Nama dan instruksi skill wajib diisi.' };
        }

        const skillContent = `# Skill: ${name}\n\n> ${description}\n\n## SOP & Panduan Kerja\n\n${instructions}\n`;
        const targetPath = path.join(SKILLS_DIR, `${name}.md`);

        try {
            await fs.mkdir(SKILLS_DIR, { recursive: true });
            await fs.writeFile(targetPath, skillContent, 'utf-8');
            return {
                success: true,
                message: `Skill "${name}" berhasil dibuat dan disimpan di ${targetPath}.`,
                skillName: name
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal membuat skill: ${errorMsg}`
            };
        }
    }
};
