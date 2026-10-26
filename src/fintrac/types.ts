export interface FintracSetup {
    ticker: string;
    price: number;
    target_lots: number;
    allocated_capital: number;
    tp1: number;
    tp2: number;
    stop_loss: number;
    score: number;
    rvol: number;
    rsi: number;
}

export interface FintracPosition {
    lots: number;
    avg_price: number;
    total_cost: number;
}

export interface FintracTrade {
    id: number;
    timestamp: string;
    action: string;
    ticker: string;
    lots: number;
    price: number;
    value: number;
    realized_pnl: number;
}

export interface FintracStatus {
    cash: number;
    portfolio_value: number;
    total_assets: number;
    realized_pnl: number;
    total_trades: number;
    unique_tickers: number;
    quota_completed: boolean;
    positions: Record<string, FintracPosition>;
    trades: FintracTrade[];
}

export interface FintracScanResult {
    success: boolean;
    mode?: 'scan' | 'midday';
    setups?: FintracSetup[];
    status?: FintracStatus;
    error?: string;
}

export interface FintracQuoteResult {
    success: boolean;
    ticker?: string;
    price?: number;
    target_lots?: number;
    allocated_capital?: number;
    tp1?: number;
    tp2?: number;
    stop_loss?: number;
    score?: number;
    rvol?: number;
    rsi?: number;
    error?: string;
}

export interface FintracLogResult {
    success: boolean;
    trade?: FintracTrade;
    status?: FintracStatus;
    error?: string;
}
