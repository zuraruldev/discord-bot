export const PREFIX = (process.env.PREFIX || 'fx').toLowerCase();
export const IDLEFARM_ID = '1085406806492319784';
export const DEFAULT_REMINDER_USER_ID = '1256220010859466795';

export const ADMIN_USER_IDS: string[] = [
    '1256220010859466795',
    '910785829549539338'
];

export function isAdmin(userId: string): boolean {
    const envAdmins = process.env.ADMIN_USER_IDS
        ? process.env.ADMIN_USER_IDS.split(',').map(id => id.trim()).filter(Boolean)
        : [];
    return ADMIN_USER_IDS.includes(userId) || envAdmins.includes(userId);
}

