import { ChildProcess, exec, spawn } from 'child_process';
import util from 'util';

import { BotTool } from '../types';
import { getWorkdir } from './files';

const execPromise = util.promisify(exec);

interface BackgroundService {
    name: string;
    command: string;
    pid: number;
    startTime: number;
    process: ChildProcess;
    logs: string[];
}

const backgroundServices = new Map<string, BackgroundService>();

export const executeCodeTool: BotTool = {
    name: 'execute_code',
    description: 'Mengeksekusi perintah terminal / shell langsung di environment (Bash, Node, Python, Git, dsb). Khusus Admin.',
    parameters: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'Perintah shell yang akan dijalankan'
            },
            workdir: {
                type: 'string',
                description: 'Direktori tempat perintah dieksekusi (default: direktori kerja saat ini)'
            },
            timeout: {
                type: 'number',
                description: 'Timeout eksekusi dalam milidetik (default: 20000, max: 60000)'
            }
        },
        required: ['command']
    },
    adminOnly: true,
    execute: async (args) => {
        const command = String(args.command || '').trim();
        if (!command) {
            return { success: false, message: 'Perintah terminal tidak boleh kosong.' };
        }

        const workdir = args.workdir ? String(args.workdir) : getWorkdir();
        const timeout = Math.min(60000, Math.max(1000, Number(args.timeout) || 20000));

        try {
            const { stdout, stderr } = await execPromise(command, {
                cwd: workdir,
                timeout,
                maxBuffer: 1024 * 1024 * 5
            });

            const maxLen = 4000;
            const truncatedStdout = stdout.length > maxLen
                ? stdout.slice(0, maxLen) + '\n...[Output terpotong karena terlalu panjang]'
                : stdout;
            const truncatedStderr = stderr.length > maxLen
                ? stderr.slice(0, maxLen) + '\n...[Stderr terpotong]'
                : stderr;

            return {
                success: true,
                command,
                workdir,
                stdout: truncatedStdout,
                stderr: truncatedStderr
            };
        } catch (err: unknown) {
            const errorObj = err as { stdout?: string; stderr?: string; message?: string; code?: number };
            return {
                success: false,
                command,
                workdir,
                exitCode: errorObj.code,
                stdout: errorObj.stdout || '',
                stderr: errorObj.stderr || errorObj.message || String(err)
            };
        }
    }
};

export const manageSandboxServiceTool: BotTool = {
    name: 'manage_sandbox_service',
    description: 'Mengelola background service/proses di sandbox (start, stop, list, logs). Khusus Admin.',
    parameters: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['start', 'stop', 'list', 'logs'],
                description: 'Aksi yang dilakukan terhadap service: "start", "stop", "list", atau "logs"'
            },
            name: {
                type: 'string',
                description: 'Nama pengenal service (wajib untuk start, stop, logs)'
            },
            command: {
                type: 'string',
                description: 'Perintah terminal untuk menjalankan service (wajib saat action "start")'
            }
        },
        required: ['action']
    },
    adminOnly: true,
    execute: async (args) => {
        const action = String(args.action || 'list').toLowerCase();
        const name = String(args.name || '').trim();
        const command = String(args.command || '').trim();

        if (action === 'list') {
            const services = Array.from(backgroundServices.values()).map(s => ({
                name: s.name,
                pid: s.pid,
                command: s.command,
                uptimeSeconds: Math.floor((Date.now() - s.startTime) / 1000),
                totalLogs: s.logs.length
            }));
            return {
                success: true,
                totalActive: services.length,
                services
            };
        }

        if (!name) {
            return { success: false, message: 'Nama service wajib diisi untuk aksi start, stop, dan logs.' };
        }

        if (action === 'start') {
            if (!command) {
                return { success: false, message: 'Perintah (command) wajib diisi untuk menjalankan service baru.' };
            }

            if (backgroundServices.has(name)) {
                return {
                    success: false,
                    message: `Service dengan nama "${name}" sudah berjalan (PID: ${backgroundServices.get(name)?.pid}). Hentikan terlebih dahulu jika ingin restart.`
                };
            }

            try {
                const child = spawn(command, {
                    shell: true,
                    cwd: getWorkdir(),
                    stdio: ['ignore', 'pipe', 'pipe']
                });

                const service: BackgroundService = {
                    name,
                    command,
                    pid: child.pid ?? 0,
                    startTime: Date.now(),
                    process: child,
                    logs: []
                };

                const appendLog = (data: Buffer | string) => {
                    const text = data.toString().trim();
                    if (!text) return;
                    const lines = text.split('\n');
                    service.logs.push(...lines);
                    if (service.logs.length > 200) {
                        service.logs.splice(0, service.logs.length - 200);
                    }
                };

                child.stdout?.on('data', appendLog);
                child.stderr?.on('data', appendLog);

                child.on('close', (code) => {
                    service.logs.push(`[Process Exited with code ${code}]`);
                    backgroundServices.delete(name);
                });

                child.on('error', (err) => {
                    service.logs.push(`[Process Error: ${err.message}]`);
                    backgroundServices.delete(name);
                });

                backgroundServices.set(name, service);

                return {
                    success: true,
                    message: `Service "${name}" berhasil dinyalakan di background (PID: ${child.pid}).`,
                    pid: child.pid
                };
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                return { success: false, message: `Gagal menyalakan service: ${errorMsg}` };
            }
        }

        if (action === 'stop') {
            const service = backgroundServices.get(name);
            if (!service) {
                return { success: false, message: `Service "${name}" tidak ditemukan di daftar service aktif.` };
            }

            try {
                service.process.kill('SIGTERM');
                backgroundServices.delete(name);
                return {
                    success: true,
                    message: `Service "${name}" (PID: ${service.pid}) berhasil dimatikan.`
                };
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                return { success: false, message: `Gagal mematikan service: ${errorMsg}` };
            }
        }

        if (action === 'logs') {
            const service = backgroundServices.get(name);
            if (!service) {
                return { success: false, message: `Service "${name}" tidak ditemukan.` };
            }

            return {
                success: true,
                name,
                pid: service.pid,
                uptimeSeconds: Math.floor((Date.now() - service.startTime) / 1000),
                recentLogs: service.logs.slice(-50)
            };
        }

        return { success: false, message: `Aksi "${action}" tidak dikenal.` };
    }
};
