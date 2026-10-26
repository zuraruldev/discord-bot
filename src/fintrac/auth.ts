import fs from 'node:fs';
import path from 'node:path';

import { isAdmin } from '../constants.ts';

const DATA_FILE = path.resolve(process.cwd(), 'data', 'fintrac_users.json');

function loadPersistedUsers(): string[] {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.allowed_user_ids)) {
                return parsed.allowed_user_ids;
            }
        }
    } catch {
        // Fallback to empty list on error
    }
    return [];
}

function savePersistedUsers(users: string[]): void {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify({ allowed_user_ids: users }, null, 2), 'utf-8');
    } catch (error) {
        console.error('[FINTRAC AUTH] Failed to save allowed users:', error);
    }
}

export function getFintracAuthorizedUsers(): string[] {
    const envUsers = process.env.FINTRAC_ALLOWED_USERS
        ? process.env.FINTRAC_ALLOWED_USERS.split(',').map(id => id.trim()).filter(Boolean)
        : [];
    const persistedUsers = loadPersistedUsers();
    return Array.from(new Set([...envUsers, ...persistedUsers]));
}

export function isFintracAuthorized(userId: string): boolean {
    if (!userId) return false;
    if (isAdmin(userId)) return true;
    const allowed = getFintracAuthorizedUsers();
    return allowed.includes(userId);
}

export function allowFintracUser(userId: string): boolean {
    if (!userId) return false;
    const current = loadPersistedUsers();
    if (!current.includes(userId)) {
        current.push(userId);
        savePersistedUsers(current);
    }
    return true;
}

export function revokeFintracUser(userId: string): boolean {
    if (!userId) return false;
    const current = loadPersistedUsers();
    const updated = current.filter(id => id !== userId);
    savePersistedUsers(updated);
    return true;
}
