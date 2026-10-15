import { execFile } from 'child_process';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

let resolvedBinaryPath: string | null = null;

export interface SkillSpectorIssue {
    id: string;
    category: string;
    pattern: string;
    finding: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    explanation: string;
    remediation: string;
    location?: {
        file?: string;
        start_line?: number;
        start_column?: number;
    };
    code_snippet?: string;
}

export interface SkillSpectorRawReport {
    execution_successful: boolean;
    risk_assessment: {
        score: number;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        recommendation: 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'BLOCKED';
        max_issue_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    issues: SkillSpectorIssue[];
    skill?: {
        name?: string;
        scanned_at?: string;
        source?: string;
    };
    analysis_completeness?: {
        status?: string;
        coverage_percent?: number;
    };
}

export interface SkillSpectorScanResult {
    success: boolean;
    target: string;
    isSafe: boolean;
    riskScore: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'BLOCKED';
    issuesCount: number;
    issues: SkillSpectorIssue[];
    summary: string;
    error?: string;
}

export async function getSkillSpectorBinary(): Promise<string | null> {
    if (resolvedBinaryPath) return resolvedBinaryPath;

    const candidates = [
        'skillspector',
        '/usr/local/bin/skillspector',
        '/usr/bin/skillspector',
        path.join(os.homedir(), '.local/bin/skillspector')
    ];

    for (const c of candidates) {
        try {
            await execFileAsync(c, ['--version']);
            resolvedBinaryPath = c;
            return c;
        } catch {
            // continue
        }
    }
    return null;
}

export function getSecurityColor(recommendation: string, severity: string): number {
    const rec = recommendation.toUpperCase();
    const sev = severity.toUpperCase();

    if (rec === 'BLOCKED' || sev === 'CRITICAL') return 0x992D22; // Dark Red
    if (rec === 'DANGEROUS' || sev === 'HIGH') return 0xED4245; // Red
    if (rec === 'CAUTION' || sev === 'MEDIUM') return 0xFEE75C; // Yellow
    return 0x57F287; // Green
}

export async function scanSkillWithSkillSpector(
    input: string,
    options?: {
        timeoutMs?: number;
        isRawContent?: boolean;
    }
): Promise<SkillSpectorScanResult> {
    const bin = await getSkillSpectorBinary();
    if (!bin) {
        return {
            success: false,
            target: input,
            isSafe: false,
            riskScore: 0,
            severity: 'LOW',
            recommendation: 'CAUTION',
            issuesCount: 0,
            issues: [],
            summary: 'NVIDIA SkillSpector binary belum terpasang di sistem.',
            error: 'Binary not found'
        };
    }

    const trimmed = input.trim();
    const timeoutMs = options?.timeoutMs || 90000;
    const isUrl = /^https?:\/\//i.test(trimmed);
    const isExplicitRaw = options?.isRawContent || (!isUrl && (trimmed.includes('\n') || trimmed.includes('```')));

    let targetPath = trimmed;
    let tempFilePath: string | null = null;

    if (isExplicitRaw) {
        const randId = randomBytes(6).toString('hex');
        tempFilePath = path.join(os.tmpdir(), `skillspector_scan_${randId}.md`);
        await fs.writeFile(tempFilePath, trimmed, 'utf-8');
        targetPath = tempFilePath;
    }

    try {
        const { stdout } = await execFileAsync(
            bin,
            ['scan', targetPath, '--no-llm', '--format', 'json'],
            {
                timeout: timeoutMs,
                maxBuffer: 10 * 1024 * 1024
            }
        );

        let report: SkillSpectorRawReport;
        try {
            report = JSON.parse(stdout);
        } catch {
            const jsonStart = stdout.indexOf('{');
            const jsonEnd = stdout.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                report = JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
            } else {
                throw new Error('Gagal mem-parsing output JSON dari SkillSpector.');
            }
        }

        const riskAssessment = report.risk_assessment || {
            score: 0,
            severity: 'LOW',
            recommendation: 'SAFE',
            max_issue_severity: 'LOW'
        };

        const issues = report.issues || [];
        const isSafe = riskAssessment.recommendation === 'SAFE' && riskAssessment.score < 25;

        let summary = `Hasil audit SkillSpector untuk: **${isUrl ? trimmed : (options?.isRawContent ? 'Custom Skill Content' : path.basename(trimmed))}**\n`;
        summary += `• **Status**: ${riskAssessment.recommendation} (Skor Risiko: ${riskAssessment.score}/100)\n`;
        summary += `• **Tingkat Keparahan Tertinggi**: ${riskAssessment.max_issue_severity || riskAssessment.severity}\n`;
        summary += `• **Total Temuan Isu**: ${issues.length} temuan\n`;

        if (issues.length > 0) {
            summary += '\n**Daftar Temuan Keamanan Utama:**\n';
            const topIssues = issues.slice(0, 5);
            for (let i = 0; i < topIssues.length; i++) {
                const issue = topIssues[i];
                summary += `${i + 1}. [${issue.severity}] **${issue.category}** (${issue.pattern})\n`;
                summary += `   • *Penjelasan*: ${issue.explanation}\n`;
                if (issue.remediation) {
                    summary += `   • *Rekomendasi*: ${issue.remediation}\n`;
                }
            }
            if (issues.length > 5) {
                summary += `*...dan ${issues.length - 5} temuan lainnya.*\n`;
            }
        } else {
            summary += '\n✅ Tidak ditemukan pola kerentanan berbahaya (Prompt Injection, Malware, Data Exfiltration, dsb). Skill ini dinilai aman.';
        }

        return {
            success: true,
            target: trimmed,
            isSafe,
            riskScore: riskAssessment.score,
            severity: riskAssessment.severity,
            recommendation: riskAssessment.recommendation,
            issuesCount: issues.length,
            issues,
            summary
        };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            target: trimmed,
            isSafe: false,
            riskScore: 0,
            severity: 'LOW',
            recommendation: 'CAUTION',
            issuesCount: 0,
            issues: [],
            summary: `Gagal menjalankan pemindaian SkillSpector: ${errorMsg}`,
            error: errorMsg
        };
    } finally {
        if (tempFilePath) {
            await fs.unlink(tempFilePath).catch(err => {
                void err;
            });
        }
    }
}
