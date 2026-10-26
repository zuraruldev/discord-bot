import {
    getFintracQuote,
    getFintracStatus,
    logFintracTrade,
    runFintracScan
} from '../fintrac/bridge.ts';
import { toolRegistry } from './registry.ts';
import type { BotTool } from './types.ts';

export function registerFintracTools(): void {
    const scanTool: BotTool = {
        name: 'fintrac_scan',
        description: 'Memindai seluruh 80 konstituen IDX80 untuk mencari setup momentum breakout terbaik (prapasar 1D atau midday review 60M) dalam turnamen trading FINTRAC 2026.',
        fintracOnly: true,
        parameters: {
            type: 'object',
            properties: {
                mode: {
                    type: 'string',
                    enum: ['scan', 'midday'],
                    description: 'Mode screening: "scan" untuk prapasar harian (1D), "midday" untuk evaluasi sesi 1 (60M).'
                },
                capital: {
                    type: 'number',
                    description: 'Total modal alokasi kompetisi dalam IDR (default Rp 200.000.000).'
                },
                positions: {
                    type: 'number',
                    description: 'Jumlah alokasi posisi terkonsentrasi (default 3).'
                }
            }
        },
        async execute(args) {
            const mode = (args.mode as 'scan' | 'midday') || 'scan';
            const capital = typeof args.capital === 'number' ? args.capital : undefined;
            const positions = typeof args.positions === 'number' ? args.positions : undefined;

            return await runFintracScan(mode, { capital, positions });
        }
    };

    const quoteTool: BotTool = {
        name: 'fintrac_quote',
        description: 'Mengecek quote harga live, target lot sizing fraksi BEI, level TP1 (+4.5%), TP2 (+8.5%), Stop Loss (-2.8%), Relative Volume (RVOL), dan RSI untuk satu saham IDX80.',
        fintracOnly: true,
        parameters: {
            type: 'object',
            properties: {
                ticker: {
                    type: 'string',
                    description: 'Kode ticker saham IDX80 (contoh: BBCA, TLKM, BMRI, ASII).'
                }
            },
            required: ['ticker']
        },
        async execute(args) {
            const ticker = String(args.ticker || '').trim();
            if (!ticker) {
                return { success: false, error: 'Ticker wajib disertakan.' };
            }
            return await getFintracQuote(ticker);
        }
    };

    const statusTool: BotTool = {
        name: 'fintrac_status',
        description: 'Melihat status portofolio FINTRAC 2026: total aset, saldo kas (cash), nilai saham di portofolio, realized PnL, posisi terbuka, dan progres kuota 10 transaksi turnamen.',
        fintracOnly: true,
        parameters: {
            type: 'object',
            properties: {}
        },
        async execute() {
            try {
                const status = await getFintracStatus();
                return {
                    success: true,
                    status
                };
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return {
                    success: false,
                    error: msg
                };
            }
        }
    };

    const logTradeTool: BotTool = {
        name: 'fintrac_log_trade',
        description: 'Mencatat transaksi beli (buy) atau jual (sell) saham kompetisi FINTRAC 2026 ke jurnal trades.json.',
        fintracOnly: true,
        parameters: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    enum: ['buy', 'sell'],
                    description: 'Aksi transaksi ("buy" atau "sell").'
                },
                ticker: {
                    type: 'string',
                    description: 'Kode ticker saham (misal: BBCA).'
                },
                lots: {
                    type: 'integer',
                    description: 'Jumlah lot saham yang ditransaksikan (1 lot = 100 lembar).'
                },
                price: {
                    type: 'number',
                    description: 'Harga eksekusi per lembar saham dalam IDR.'
                }
            },
            required: ['action', 'ticker', 'lots', 'price']
        },
        async execute(args) {
            const action = (args.action as 'buy' | 'sell') || 'buy';
            const ticker = String(args.ticker || '').trim();
            const lots = Number(args.lots) || 0;
            const price = Number(args.price) || 0;

            if (!ticker || lots <= 0 || price <= 0) {
                return {
                    success: false,
                    error: 'Parameter transaksi tidak valid. Pastikan action, ticker, lots > 0, dan price > 0 terisi.'
                };
            }

            return await logFintracTrade(action, ticker, lots, price);
        }
    };

    toolRegistry.register(scanTool);
    toolRegistry.register(quoteTool);
    toolRegistry.register(statusTool);
    toolRegistry.register(logTradeTool);
}
