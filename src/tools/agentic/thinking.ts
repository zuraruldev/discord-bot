import { BotTool } from '../types';

interface ThoughtItem {
    thought: string;
    thoughtNumber: number;
    totalThoughts: number;
    nextThoughtNeeded: boolean;
    isRevision?: boolean;
    revisesThought?: number;
    branchFromThought?: number;
    branchId?: string;
    timestamp: number;
}

const thinkingSessions = new Map<string, ThoughtItem[]>();

export const sequentialThinkingTool: BotTool = {
    name: 'sequential_thinking',
    description: 'Melakukan penalaran logis bertahap dan mendalam (Sequential Thinking) untuk memecahkan problem koding atau logika rumit sebelum merumuskan solusi akhir.',
    parameters: {
        type: 'object',
        properties: {
            thought: {
                type: 'string',
                description: 'Isi pemikiran / hipotesis / analisa pada tahap ini'
            },
            thought_number: {
                type: 'number',
                description: 'Nomor langkah pemikiran saat ini (1, 2, 3...)'
            },
            total_thoughts: {
                type: 'number',
                description: 'Estimasi total langkah pemikiran yang dibutuhkan'
            },
            next_thought_needed: {
                type: 'boolean',
                description: 'Set true jika masih butuh langkah pemikiran berikutnya, false jika analisa sudah selesai'
            },
            is_revision: {
                type: 'boolean',
                description: 'Set true jika pemikiran ini mengoreksi langkah sebelumnya'
            },
            revises_thought: {
                type: 'number',
                description: 'Nomor langkah yang dikoreksi (jika is_revision true)'
            },
            branch_id: {
                type: 'string',
                description: 'ID cabang alternatif jika sedang mempertimbangkan strategi berbeda'
            }
        },
        required: ['thought', 'thought_number', 'total_thoughts', 'next_thought_needed']
    },
    execute: async (args, context) => {
        const thought = String(args.thought || '').trim();
        const thoughtNumber = Number(args.thought_number) || 1;
        const totalThoughts = Math.max(thoughtNumber, Number(args.total_thoughts) || 1);
        const nextThoughtNeeded = Boolean(args.next_thought_needed);
        const isRevision = Boolean(args.is_revision);
        const revisesThought = args.revises_thought !== undefined ? Number(args.revises_thought) : undefined;
        const branchId = args.branch_id ? String(args.branch_id) : undefined;

        const sessionKey = `${context.channelId}_${context.userId}`;
        let history = thinkingSessions.get(sessionKey);
        if (!history || thoughtNumber === 1) {
            history = [];
            thinkingSessions.set(sessionKey, history);
        }

        const item: ThoughtItem = {
            thought,
            thoughtNumber,
            totalThoughts,
            nextThoughtNeeded,
            isRevision,
            revisesThought,
            branchId,
            timestamp: Date.now()
        };

        history.push(item);

        return {
            success: true,
            currentStep: thoughtNumber,
            totalEstimated: totalThoughts,
            nextThoughtNeeded,
            stepSummary: `Langkah ${thoughtNumber}/${totalThoughts} tercatat.${nextThoughtNeeded ? ' Lanjutkan langkah berikutnya.' : ' Penalaran selesai, siap merumuskan kesimpulan.'}`
        };
    }
};
