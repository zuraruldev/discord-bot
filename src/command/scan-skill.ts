import { defineCommand } from '../Command';
import { PREFIX } from '../constants';
import { getSecurityColor, scanSkillWithSkillSpector } from '../security/skillspector';
import { reply } from '../utils';

defineCommand({
    name: 'scan-skill',
    description: 'Audit keamanan AI agent skill, repositori GitHub, atau file instruksi dengan NVIDIA SkillSpector',
    aliases: ['skillspector', 'scanskill', 'audit-skill'],
    usages: ['<url git | path file | lampiran file>'],
    async run(message, args) {
        let target = args.join(' ').trim();

        // Check if there is an attachment
        if (!target && message.attachments && message.attachments.size > 0) {
            const firstAttachment = message.attachments.first();
            if (firstAttachment?.url) {
                target = firstAttachment.url;
            }
        }

        if (!target) {
            return reply(message, {
                embeds: [{
                    title: '🛡️ NVIDIA SkillSpector — Scanner Keamanan AI Skill',
                    description: 'Periksa keamanan AI agent skill sebelum kamu memasang atau menjalankannya!\n\n' +
                        '**Cara Penggunaan:**\n' +
                        `• \`${PREFIX} scan-skill <url git>\` (contoh: \`${PREFIX} scan-skill https://github.com/user/my-skill\`)\n` +
                        `• \`${PREFIX} scan-skill <path file lokal>\` (contoh: \`data/skills/deploy.md\`)\n` +
                        `• Unggah file (SKILL.md / script) dengan caption \`${PREFIX} scan-skill\``,
                    color: 0x5865f2
                }]
            });
        }

        try {
            await message.channel?.sendTyping();
        } catch {
            // ignore
        }

        const waitMsg = await reply(message, '🔍 *Sedang menganalisis keamanan skill menggunakan NVIDIA SkillSpector... Mohon tunggu sebentar yaa!* 🛡️✨');

        const scanResult = await scanSkillWithSkillSpector(target);

        if (!scanResult.success) {
            return waitMsg.edit({
                content: '',
                embeds: [{
                    title: '⚠️ Pemindaian SkillSpector Gagal',
                    description: `Terjadi kendala saat memeriksa target:\n\`\`\`\n${scanResult.error || scanResult.summary}\n\`\`\``,
                    color: 0xED4245,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        const color = getSecurityColor(scanResult.recommendation, scanResult.severity);
        const icon = scanResult.isSafe ? '✅' : (scanResult.recommendation === 'CAUTION' ? '⚠️' : '🚨');

        const fields: { name: string; value: string; inline?: boolean }[] = [
            {
                name: '🎯 Target',
                value: target.length > 80 ? target.slice(0, 77) + '...' : target,
                inline: true
            },
            {
                name: '📊 Risk Score',
                value: `**${scanResult.riskScore} / 100** (${scanResult.severity})`,
                inline: true
            },
            {
                name: '🛡️ Rekomendasi',
                value: `**${scanResult.recommendation}** ${icon}`,
                inline: true
            }
        ];

        if (scanResult.issues.length > 0) {
            const top = scanResult.issues.slice(0, 4);
            const issueDetails = top.map((iss, idx) => {
                const sevBadge = `\`[${iss.severity}]\``;
                let text = `${idx + 1}. ${sevBadge} **${iss.category}** — *${iss.pattern}*\n   • ${iss.explanation}`;
                if (iss.remediation) {
                    text += `\n   • *Saran*: ${iss.remediation}`;
                }
                return text;
            }).join('\n\n');

            fields.push({
                name: `🚨 Temuan Kerentanan & Risiko (${scanResult.issues.length} Total)`,
                value: issueDetails.length > 1024 ? issueDetails.slice(0, 1020) + '...' : issueDetails
            });
        } else {
            fields.push({
                name: '🎉 Hasil Evaluasi',
                value: 'Tidak ditemukan pola berbahaya (Malicious Scripts, Prompt Injection, Data Exfiltration, Excessive Agency, Supply-Chain CVEs). Skill dinilai aman untuk digunakan!'
            });
        }

        return waitMsg.edit({
            content: '',
            embeds: [{
                title: `${icon} SkillSpector Security Audit Report`,
                color,
                fields,
                footer: {
                    text: 'NVIDIA SkillSpector v2.12.0 • Security Scanner for AI Agent Skills'
                },
                timestamp: new Date().toISOString()
            }]
        });
    }
});
