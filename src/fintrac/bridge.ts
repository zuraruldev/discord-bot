import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type {
    FintracLogResult,
    FintracQuoteResult,
    FintracScanResult,
    FintracStatus
} from './types.ts';

function resolveFintracDir(): string {
    if (process.env.FINTRAC_DIR && fs.existsSync(process.env.FINTRAC_DIR)) {
        return process.env.FINTRAC_DIR;
    }
    const candidates = [
        '/home/bot/fintrax-scanner',
        '/home/bot/fintrac_screener',
        '/home/zura/fintrac_screener',
        path.resolve(process.cwd(), '..', 'fintrax-scanner'),
        path.resolve(process.cwd(), '..', 'fintrac_screener')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return process.env.FINTRAC_DIR || path.resolve(process.cwd(), '..', 'fintrac_screener');
}

const FINTRAC_DIR = resolveFintracDir();
const FINTRAC_PYTHON = process.env.FINTRAC_PYTHON || 'python3';

function executeScreener(args: string[], timeoutMs = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile(
            FINTRAC_PYTHON,
            ['screener.py', ...args, '--json'],
            {
                cwd: FINTRAC_DIR,
                timeout: timeoutMs,
                maxBuffer: 10 * 1024 * 1024
            },
            (error, stdout, stderr) => {
                if (error && !stdout) {
                    return reject(new Error(stderr?.trim() || error.message));
                }
                resolve(stdout.trim());
            }
        );
    });
}

export async function runFintracScan(
    mode: 'scan' | 'midday',
    options?: { capital?: number; positions?: number }
): Promise<FintracScanResult> {
    const args = [mode];
    if (options?.capital) {
        args.push('--capital', String(options.capital));
    }
    if (options?.positions) {
        args.push('--positions', String(options.positions));
    }

    try {
        const raw = await executeScreener(args, 90000);
        return JSON.parse(raw) as FintracScanResult;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            mode,
            error: `Failed to execute ${mode}: ${msg}`
        };
    }
}

export async function getFintracStatus(): Promise<FintracStatus> {
    try {
        const raw = await executeScreener(['status']);
        return JSON.parse(raw) as FintracStatus;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get FINTRAC status: ${msg}`);
    }
}

export async function getFintracQuote(
    ticker: string,
    options?: { capital?: number; positions?: number }
): Promise<FintracQuoteResult> {
    const cleanTicker = ticker.trim().toUpperCase();
    const args = ['quote', cleanTicker];
    if (options?.capital) {
        args.push('--capital', String(options.capital));
    }
    if (options?.positions) {
        args.push('--positions', String(options.positions));
    }

    try {
        const raw = await executeScreener(args, 30000);
        return JSON.parse(raw) as FintracQuoteResult;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            ticker: cleanTicker,
            error: `Failed to fetch quote for ${cleanTicker}: ${msg}`
        };
    }
}

export async function logFintracTrade(
    action: 'buy' | 'sell',
    ticker: string,
    lots: number,
    price: number
): Promise<FintracLogResult> {
    const cleanAction = action.trim().toLowerCase();
    const cleanTicker = ticker.trim().toUpperCase();
    const args = ['log', cleanAction, cleanTicker, String(lots), String(price)];

    try {
        const raw = await executeScreener(args, 30000);
        return JSON.parse(raw) as FintracLogResult;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            error: `Failed to log trade: ${msg}`
        };
    }
}
