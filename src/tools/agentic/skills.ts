import { promises as fs } from 'fs';
import path from 'path';

import { scanSkillWithSkillSpector } from '../../security/skillspector';
import { BotTool } from '../types';

const SKILLS_DIR = path.resolve(process.cwd(), 'data/skills');
const GLOBAL_SKILLS_DIR = '/home/zura/.agents/skills';

export const scanSkillSecurityTool: BotTool = {
    name: 'scan_skill_security',
    description: 'Melakukan audit dan pemindaian keamanan terhadap AI agent skill, repositori GitHub, kode script, atau file instruksi menggunakan NVIDIA SkillSpector. Mendeteksi prompt injection, data exfiltration, malicious patterns, privilege escalation, dan supply-chain risks.',
    parameters: {
        type: 'object',
        properties: {
            target: {
                type: 'string',
                description: 'URL repositori Git (misal: "https://github.com/user/skill"), path file lokal, atau link attachment'
            },
            raw_content: {
                type: 'string',
                description: 'Opsional: Teks atau kode Markdown instruksi skill jika ingin memeriksa langsung tanpa URL/file'
            }
        }
    },
    execute: async (args) => {
        const target = String(args.target || '').trim();
        const rawContent = String(args.raw_content || '').trim();

        if (!target && !rawContent) {
            return {
                success: false,
                message: 'Harap berikan target URL/path repositori atau teks instruksi skill.'
            };
        }

        const inputToScan = rawContent || target;
        const isRaw = Boolean(rawContent);

        const result = await scanSkillWithSkillSpector(inputToScan, { isRawContent: isRaw });
        return {
            success: result.success,
            target: result.target,
            isSafe: result.isSafe,
            riskScore: result.riskScore,
            severity: result.severity,
            recommendation: result.recommendation,
            totalIssues: result.issuesCount,
            summary: result.summary,
            topIssues: result.issues.slice(0, 5)
        };
    }
};

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

        // Security Guardrail: Audit skill content with NVIDIA SkillSpector before saving
        const audit = await scanSkillWithSkillSpector(skillContent, { isRawContent: true });
        if (audit.recommendation === 'BLOCKED' || audit.recommendation === 'DANGEROUS' || audit.riskScore >= 70) {
            const highIssues = audit.issues.map(i => `[${i.severity}] ${i.category}: ${i.explanation}`).join('; ');
            return {
                success: false,
                message: `Peringatan Keamanan SkillSpector: Skill "${name}" DITOLAK karena terdeteksi pola berbahaya (${audit.recommendation}, Skor Risiko: ${audit.riskScore}/100).\nDetail temuan: ${highIssues}`,
                securityAudit: audit
            };
        }

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
