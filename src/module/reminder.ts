import { client } from '../Client';
import { isAdmin, PREFIX } from '../constants';
import {
    buildReminderMessage,
    getDayTimeInfo,
    getIndonesianFormattedDate,
    getScheduleForDay,
    isWeekday,
    loadScheduleDb,
    normalizeDayName,
    saveScheduleDb
} from '../schedule/store';
import { send } from '../utils';

function formatPing(pingId?: string): string {
    if (!pingId) return '';
    const cleaned = pingId.trim();
    if (!cleaned) return '';
    const rawId = cleaned.replace(/[<@!>]/g, '').trim();
    if (isAdmin(rawId) || rawId === '1256220010859466795') return '';
    if (cleaned === 'everyone' || cleaned === '@everyone') return '@everyone';
    if (cleaned === 'here' || cleaned === '@here') return '@here';
    if (cleaned.startsWith('<@') && cleaned.endsWith('>')) return cleaned;
    return `<@${cleaned}>`;
}

export interface ReminderOptions {
    channelId?: string;
    day?: string;
    forced?: boolean;
}

export interface ReminderResult {
    success: boolean;
    messageId?: string;
    channelId?: string;
    dayKey?: string;
    calendarStr?: string;
    itemCount?: number;
    error?: string;
}

let lastSentDate: string | null = null;
let schedulerInterval: NodeJS.Timeout | null = null;

export async function sendDailyReminder(options: ReminderOptions = {}): Promise<ReminderResult> {
    const db = await loadScheduleDb();
    const timeZone = (process.env.REMINDER_TIMEZONE || db.timezone || 'Asia/Jakarta') as string;
    const timeInfo = getDayTimeInfo(new Date(), timeZone);

    const targetDay = options.day ? (normalizeDayName(options.day) || timeInfo.dayKey) : timeInfo.dayKey;
    const targetChannelId = options.channelId || process.env.MATKUL_CHANNEL_ID || process.env.REMINDER_CHANNEL_ID || db.channelId;
    const rawPing = (process.env.REMINDER_USER_ID || db.pingUserId || '').trim();
    const cleanPing = rawPing.replace(/[<@!>]/g, '').trim();
    const pingUserId = rawPing && !isAdmin(cleanPing) && cleanPing !== '1256220010859466795' ? rawPing : undefined;

    console.log('[Reminder Debug] === Reminder Triggered ===');
    console.log('[Reminder Debug] Forced:', Boolean(options.forced));
    console.log('[Reminder Debug] Current Date/Time:', timeInfo.calendarStr);
    console.log('[Reminder Debug] Target Day:', targetDay);
    console.log('[Reminder Debug] Target Channel ID:', targetChannelId || '(none)');
    console.log('[Reminder Debug] Ping User ID:', pingUserId || '(none)');

    if (!targetChannelId) {
        const errorMsg = `No channel ID configured. Please set MATKUL_CHANNEL_ID / REMINDER_CHANNEL_ID or use \`${PREFIX} matkul setchannel\``;
        console.warn(`[Reminder Debug] ${errorMsg}`);
        return {
            success: false,
            error: errorMsg,
            dayKey: targetDay,
            calendarStr: timeInfo.calendarStr
        };
    }

    if (!isWeekday(targetDay)) {
        if (!options.forced) {
            console.log(`[Reminder Debug] ${targetDay} is weekend (Saturday/Sunday has no study jam). Skipping reminder.`);
            return {
                success: true,
                channelId: targetChannelId,
                dayKey: targetDay,
                calendarStr: timeInfo.calendarStr,
                itemCount: 0
            };
        }

        const weekendMsg = 'Hari Sabtu dan Minggu tidak memiliki jadwal study jam (hanya Senin sampai Jumat).';
        console.warn(`[Reminder Debug] ${weekendMsg}`);
        return {
            success: false,
            error: weekendMsg,
            channelId: targetChannelId,
            dayKey: targetDay,
            calendarStr: timeInfo.calendarStr,
            itemCount: 0
        };
    }

    const items = getScheduleForDay(db, targetDay);
    console.log('[Reminder Debug] Found schedule items count (max 3):', items.length);
    console.log('[Reminder Debug] Schedule items:', JSON.stringify(items, null, 2));

    if (!options.forced && items.length === 0) {
        console.log(`[Reminder Debug] No classes found for ${targetDay}. Skipping message dispatch.`);
        return {
            success: true,
            channelId: targetChannelId,
            dayKey: targetDay,
            calendarStr: timeInfo.calendarStr,
            itemCount: 0
        };
    }

    const dateStr = getIndonesianFormattedDate(targetDay, timeZone);
    const reminderText = buildReminderMessage({
        header: (process.env.REMINDER_HEADER || db.header) as string | undefined,
        dateStr,
        items
    });

    const pingStr = formatPing(pingUserId);
    const messageContent = pingStr ? `${pingStr}\n\n${reminderText}` : reminderText;

    try {
        const messagePayload = {
            content: messageContent
        };

        const sentMsg = await send(targetChannelId, messagePayload);
        console.log('[Reminder Debug] Reminder message successfully sent! Message ID:', sentMsg?.id);

        return {
            success: true,
            messageId: sentMsg?.id,
            channelId: targetChannelId,
            dayKey: targetDay,
            calendarStr: timeInfo.calendarStr,
            itemCount: items.length
        };
    } catch (error) {
        console.error('[Reminder Debug] Failed to send reminder message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            channelId: targetChannelId,
            dayKey: targetDay,
            calendarStr: timeInfo.calendarStr,
            itemCount: items.length
        };
    }
}

async function checkReminderTick(): Promise<void> {
    try {
        const db = await loadScheduleDb();
        const timeZone = (process.env.REMINDER_TIMEZONE || db.timezone || 'Asia/Jakarta') as string;
        const timeInfo = getDayTimeInfo(new Date(), timeZone);

        if (timeInfo.hour === 5 && timeInfo.minute === 0) {
            if (!isWeekday(timeInfo.dayKey)) {
                return;
            }

            const savedLastSent = db.lastSentDate;
            if (lastSentDate === timeInfo.dateKey || savedLastSent === timeInfo.dateKey) {
                return;
            }

            lastSentDate = timeInfo.dateKey;
            db.lastSentDate = timeInfo.dateKey;
            await saveScheduleDb(db);

            console.log(`[Reminder Debug] 5:00 AM automation triggered for ${timeInfo.calendarStr} (${timeInfo.dayKey}).`);
            await sendDailyReminder({ forced: false });
        }
    } catch (error) {
        console.error('[Reminder Debug] Error during reminder tick:', error);
    }
}

export function startReminderScheduler(): void {
    if (schedulerInterval) return;
    schedulerInterval = setInterval(checkReminderTick, 20000);
    console.log('[Reminder Debug] 5 AM reminder scheduler started.');
}

if (client.ready) {
    startReminderScheduler();
} else {
    client.once('ready', startReminderScheduler);
}
