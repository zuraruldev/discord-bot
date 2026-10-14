import { BotTool } from '../types';

export const spawnSubagentTool: BotTool = {
    name: 'spawn_subagent',
    description: 'Menjalankan sub-agent mandiri di background untuk menyelesaikan unit tugas terisolasi atau riset spesifik.',
    parameters: {
        type: 'object',
        properties: {
            task: {
                type: 'string',
                description: 'Instruksi rinci unit tugas yang harus diselesaikan sub-agent'
            },
            description: {
                type: 'string',
                description: 'Deskripsi singkat 3-5 kata tentang tugas ini'
            },
            subagent_type: {
                type: 'string',
                enum: ['general', 'explore', 'code'],
                description: 'Tipe spesialisasi sub-agent (default: general)'
            }
        },
        required: ['task', 'description']
    },
    execute: async (args) => {
        const task = String(args.task || '').trim();
        const description = String(args.description || '').trim();
        const subagentType = String(args.subagent_type || 'general');

        if (!task) {
            return { success: false, message: 'Tugas sub-agent tidak boleh kosong.' };
        }

        const apiBase = (process.env.AI_API_BASE || 'http://localhost:20128/v1').replace(/\/+$/, '');
        const apiKey = process.env.AI_API_KEY || '';
        const model = process.env.AI_MODEL || 'ag/gemini-3.8-flash-low';

        const subagentPrompt = `Kamu adalah Sub-Agent (${subagentType}) yang bertugas menyelesaikan tugas spesifik berikut secara mandiri dan to the point:
Tugas: ${task}

Berikan analisa dan hasil pengerjaanmu secara ringkas, padat, dan langsung menjawab inti persoalan.`;

        try {
            const res = await fetch(`${apiBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: subagentPrompt },
                        { role: 'user', content: task }
                    ],
                    stream: false
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (!res.ok) {
                return {
                    success: false,
                    message: `Sub-agent gagal merespon: HTTP ${res.status}`
                };
            }

            const data = await res.json() as { choices?: { message?: { content?: string } }[] };
            const output = data.choices?.[0]?.message?.content?.trim() || 'Sub-agent menyelesaikan tugas tanpa output teks.';

            return {
                success: true,
                description,
                subagentType,
                result: output
            };
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `Gagal menjalankan sub-agent: ${errorMsg}`
            };
        }
    }
};
