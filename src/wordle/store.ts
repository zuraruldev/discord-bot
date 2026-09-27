import { mkdir, readFile, writeFile } from 'fs/promises';

import { ActiveGame, UserInfo } from './types';

const DB_DIR = './data';
const DB_FILE = './data/wordle-db.json';

let isLoaded = false;
let isDirty = false;
let isSaving = false;
const userStore = new Map<string, UserInfo>();

async function ensureDir(): Promise<void> {
    try {
        await mkdir(DB_DIR, { recursive: true });
    } catch {
        return;
    }
}

export async function loadDb(): Promise<void> {
    if (isLoaded) return;
    try {
        await ensureDir();
        const content = await readFile(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as Record<string, UserInfo>;
        for (const [id, user] of Object.entries(parsed)) {
            userStore.set(id, user);
        }
    } catch {
        return;
    }
    isLoaded = true;
}

export async function saveDb(): Promise<void> {
    if (!isDirty || isSaving) return;
    isSaving = true;
    try {
        await ensureDir();
        const obj: Record<string, UserInfo> = {};
        for (const [id, user] of userStore.entries()) {
            obj[id] = user;
        }
        await writeFile(DB_FILE, JSON.stringify(obj, null, 2), 'utf-8');
        isDirty = false;
    } catch (error) {
        console.error('Failed to save wordle database:', error);
    } finally {
        isSaving = false;
    }
}

export function getUserInfo(userId: string, username?: string): UserInfo {
    let user = userStore.get(userId);
    if (!user) {
        user = {
            current_game: null,
            settings: {
                colorblind: false
            },
            stats: {
                wins: 0,
                losses: 0,
                surrenders: 0,
                games: {}
            },
            username
        };
        userStore.set(userId, user);
        isDirty = true;
    }
    if (username && user.username !== username) {
        user.username = username;
        isDirty = true;
    }
    return user;
}

export function setUserInfo(userId: string, info: UserInfo): void {
    userStore.set(userId, info);
    isDirty = true;
}

export function fetchStoredGame(userId: string): ActiveGame | null | undefined {
    return getUserInfo(userId).current_game;
}

export function storeGame(userId: string, game: ActiveGame): void {
    const user = getUserInfo(userId);
    user.current_game = game;
    setUserInfo(userId, user);
}

export function clearGame(userId: string): void {
    const user = getUserInfo(userId);
    user.current_game = null;
    setUserInfo(userId, user);
}

await loadDb();

