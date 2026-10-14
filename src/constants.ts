export const PREFIX = (process.env.PREFIX || 'fx').toLowerCase();
export const IDLEFARM_ID = '1085406806492319784';

export const ADMIN_USER_IDS: string[] = [
    '1256220010859466795',
    '910785829549539338'
];

export const DEFAULT_CHAT_CHANNEL_IDS: string[] = [
    '1555508577945522206',
    '1315561361098412053',
    '1555493571262414868'
];

export function isAdmin(userId: string): boolean {
    const envAdmins = process.env.ADMIN_USER_IDS
        ? process.env.ADMIN_USER_IDS.split(',').map(id => id.trim()).filter(Boolean)
        : [];
    return ADMIN_USER_IDS.includes(userId) || envAdmins.includes(userId);
}

export function getAllowedChatChannelIds(): string[] {
    const envChannels = process.env.CHAT_CHANNEL_ID
        ? process.env.CHAT_CHANNEL_ID.split(',').map(id => id.trim()).filter(Boolean)
        : [];
    return Array.from(new Set([...DEFAULT_CHAT_CHANNEL_IDS, ...envChannels]));
}

export function isAllowedChatChannel(channelId?: string): boolean {
    if (!channelId) return false;
    return getAllowedChatChannelIds().includes(channelId);
}

