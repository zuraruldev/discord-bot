export type LetterState = 'absent' | 'present' | 'correct';

export enum EndResult {
    PLAYING = 0,
    WIN = 1,
    LOSE = 2,
    SURRENDER = 3
}

export type SupportedLanguage = 'en' | 'id';

export interface ActiveGame {
    lang: SupportedLanguage;
    answer: string;
    board_state: string[];
    results: LetterState[][];
    state: EndResult;
}

export interface Settings {
    colorblind: boolean;
}

export interface Stats {
    wins: number;
    losses: number;
    surrenders: number;
    games: Record<string, number>;
}

export interface UserInfo {
    current_game?: ActiveGame | null;
    settings: Settings;
    stats: Stats;
    username?: string;
}

export interface WordleLanguage {
    site: string;
    alphabet: string;
    command: string;
    help: string;
    flag: string;
}
