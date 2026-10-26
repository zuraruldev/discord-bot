import fs from 'node:fs';
import path from 'node:path';

import { isAdmin } from '../constants.ts';

const DATA_FILE = path.resolve(process.cwd(), 'data', 'fintrac_users.json');

interface FintracConfig {
    allowed_user_ids: string[];
    alert_channel_id?: string;
}

function loadConfig(): FintracConfig {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                allowed_user_ids: Array.isArray(parsed?.allowed_user_ids) ? parsed.allowed_user_ids : [],
                alert_channel_id: typeof parsed?.alert_channel_id === 'string' ? parsed.alert_channel_id : undefined
            };
        }
    } catch {
        // Fallback to empty config on error
    }
    return { allowed_user_ids: [] };
}

function saveConfig(config: FintracConfig): void {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('[FINTRAC AUTH] Failed to save config:', error);
    }
}

export function getFintracAuthorizedUsers(): string[] {
    const envUsers = process.env.FINTRAC_ALLOWED_USERS
        ? process.env.FINTRAC_ALLOWED_USERS.split(',').map(id => id.trim()).filter(Boolean)
        : [];
    const config = loadConfig();
    return Array.from(new Set([...envUsers, ...config.allowed_user_ids]));
}

export function isFintracAuthorized(userId: string): boolean {
    if (!userId) return false;
    if (isAdmin(userId)) return true;
    const allowed = getFintracAuthorizedUsers();
    return allowed.includes(userId);
}

export function allowFintracUser(userId: string): boolean {
    if (!userId) return false;
    const config = loadConfig();
    if (!config.allowed_user_ids.includes(userId)) {
        config.allowed_user_ids.push(userId);
        saveConfig(config);
    }
    return true;
}

export function revokeFintracUser(userId: string): boolean {
    if (!userId) return false;
    const config = loadConfig();
    config.allowed_user_ids = config.allowed_user_ids.filter(id => id !== userId);
    saveConfig(config);
    return true;
}

export function getFintracAlertChannelId(): string | undefined {
    const config = loadConfig();
    return config.alert_channel_id || process.env.FINTRAC_ALERT_CHANNEL_ID;
}

export function setFintracAlertChannelId(channelId?: string): boolean {
    const config = loadConfig();
    config.alert_channel_id = channelId;
    saveConfig(config);
    return true;
}
