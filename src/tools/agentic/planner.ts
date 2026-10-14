import { BotTool } from '../types';

export interface TaskItem {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

interface TaskPlan {
    planId: string;
    title: string;
    tasks: TaskItem[];
    updatedAt: number;
}

const activePlans = new Map<string, TaskPlan>();

export const manageTaskPlanTool: BotTool = {
    name: 'manage_task_plan',
    description: 'Membuat dan mengelola daftar rencana tugas bertahap (TODO checklist) untuk proyek atau problem solving multi-step.',
    parameters: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['create', 'update', 'get', 'clear'],
                description: 'Aksi: "create" untuk rencana baru, "update" untuk ubah status task, "get" untuk lihat rencana, "clear" untuk reset'
            },
            title: {
                type: 'string',
                description: 'Judul keseluruhan rencana tugas'
            },
            tasks: {
                type: 'array',
                description: 'Daftar tugas (hanya untuk aksi create)',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] }
                    },
                    required: ['id', 'title']
                }
            },
            task_id: {
                type: 'string',
                description: 'ID task yang statusnya ingin diubah (untuk aksi update)'
            },
            status: {
                type: 'string',
                enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                description: 'Status baru task (untuk aksi update)'
            }
        },
        required: ['action']
    },
    execute: async (args, context) => {
        const action = String(args.action || 'get').toLowerCase();
        const planKey = `${context.channelId}_${context.userId}`;

        if (action === 'create') {
            const planTitle = String(args.title || 'Rencana Tugas').trim();
            const rawTasks = Array.isArray(args.tasks) ? args.tasks : [];

            const formattedTasks: TaskItem[] = rawTasks.map((t, idx) => {
                const item = t as Record<string, unknown>;
                return {
                    id: String(item.id || `task_${idx + 1}`),
                    title: String(item.title || `Langkah ${idx + 1}`),
                    status: (item.status as TaskItem['status']) || 'pending'
                };
            });

            const plan: TaskPlan = {
                planId: planKey,
                title: planTitle,
                tasks: formattedTasks,
                updatedAt: Date.now()
            };

            activePlans.set(planKey, plan);
            return {
                success: true,
                message: `Rencana "${planTitle}" berhasil dibuat dengan ${formattedTasks.length} task.`,
                plan
            };
        }

        if (action === 'get') {
            const plan = activePlans.get(planKey);
            if (!plan) {
                return {
                    success: true,
                    message: 'Belum ada rencana tugas aktif saat ini.',
                    plan: null
                };
            }
            return {
                success: true,
                plan
            };
        }

        if (action === 'update') {
            const plan = activePlans.get(planKey);
            if (!plan) {
                return { success: false, message: 'Tidak ada rencana tugas yang aktif untuk di-update.' };
            }

            const taskId = String(args.task_id || '').trim();
            const newStatus = args.status as TaskItem['status'];
            if (!taskId || !newStatus) {
                return { success: false, message: 'task_id dan status wajib diisi untuk update.' };
            }

            const targetTask = plan.tasks.find(t => t.id === taskId);
            if (!targetTask) {
                return { success: false, message: `Task dengan id "${taskId}" tidak ditemukan.` };
            }

            targetTask.status = newStatus;
            plan.updatedAt = Date.now();

            return {
                success: true,
                message: `Status task "${targetTask.title}" diperbarui menjadi "${newStatus}".`,
                plan
            };
        }

        if (action === 'clear') {
            activePlans.delete(planKey);
            return {
                success: true,
                message: 'Rencana tugas berhasil di-reset.'
            };
        }

        return { success: false, message: `Aksi "${action}" tidak dikenal.` };
    }
};
