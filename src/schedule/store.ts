import { mkdir, readFile, writeFile } from 'fs/promises';

import { isAdmin } from '../constants';
import { DayTimeInfo, FormattedScheduleItem, ScheduleDatabase, ScheduleItem } from './types';

const DB_DIR = './data';
const DB_FILE = './data/schedule.json';

const DEFAULT_DB: ScheduleDatabase = {
    channelId: process.env.MATKUL_CHANNEL_ID || process.env.REMINDER_CHANNEL_ID || '',
    timezone: 'Asia/Jakarta',
    header: 'Teknik Informatika 1A🔥💻',
    schedule: {
         monday: [
            {
                matkul: 'Keterampilan Komputer',
                timeStarted: '07:30',
                timeEnded: '11:10',
                tempat: 'Gtil ruang 5.7',
                type: 'Praktek'
            },
            {
                matkul: 'Pendidikan pancasila',
                timeStarted: '13:50',
                timeEnded: '15:30',
                tempat: 'Gkb ruang 4.5',
                type: 'Teori'
            }
        ],
        tuesday: [
            {
                matkul: 'Arsitektur Komputer',
                timeStarted: '08:20',
                timeEnded: '11:10',
                tempat: 'Gkb ruang 4.6',
                type: 'Teori'
            },
            {
                matkul: 'Bahasa Indonesia',
                timeStarted: '13:50',
                timeEnded: '15:30',
                tempat: 'Gkb ruang 3.8',
                type: 'Teori'
            } 
        ],
        wednesday: [
            {
                matkul: 'Algoritma Programming',
                timeStarted: '09:25',
                timeEnded: '10:15',
                tempat: 'Gkb ruang 4.6',
                type: 'Teori'
            },
            {
                matkul: 'Basis data',
                timeStarted: '10:20',
                timeEnded: '11:10',
                tempat: 'Gkb ruang 4.6',
                type: 'Teori'
            },
            {
                matkul: 'Algoritma programming',
                timeStarted: '11:15',
                timeEnded: '15:30',
                tempat: 'Gtil ruang 5.6',
                type: 'Praktek'
            }
        ],
        thursday: [
            {
                matkul: 'Matematika Dasar',
                timeStarted: '08:20',
                timeEnded: '11:10',
                tempat: 'Gkb ruang 3.8',
                type: 'Teori'
            },
            {
                matkul: 'Pengantar Sistem Informasi',
                timeStarted: '13:50',
                timeEnded: '15:30',
                tempat: 'Gkb ruang 4.2',
                type: 'Teori'
            }
        ],
        friday: [
            {
                matkul: 'Basis Data',
                timeStarted: '07:30',
                timeEnded: '11:10',
                tempat: 'Gtil ruang 5.7',
                type: 'Praktek'
            }
        ]
    }
};

async function ensureDir(): Promise<void> {
    try {
        await mkdir(DB_DIR, { recursive: true });
    } catch {
        return;
    }
}

export async function loadScheduleDb(): Promise<ScheduleDatabase> {
    const envChannel = process.env.MATKUL_CHANNEL_ID || process.env.REMINDER_CHANNEL_ID || '';
    try {
        await ensureDir();
        const content = await readFile(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as ScheduleDatabase;
        let modified = false;
        if (!parsed.header) {
            parsed.header = 'Teknik Informatika 1A🔥💻';
            modified = true;
        }
        if (parsed.pingUserId) {
            const cleanPing = parsed.pingUserId.replace(/[<@!>]/g, '').trim();
            if (isAdmin(cleanPing) || cleanPing === '1256220010859466795') {
                delete parsed.pingUserId;
                modified = true;
            }
        }
        if (envChannel && parsed.channelId !== envChannel) {
            parsed.channelId = envChannel;
            modified = true;
        } else if (!parsed.channelId && envChannel) {
            parsed.channelId = envChannel;
            modified = true;
        }
        if (modified) {
            await saveScheduleDb(parsed);
        }
        return parsed;
    } catch {
        const defaultDb = {
            ...DEFAULT_DB,
            channelId: envChannel
        };
        await saveScheduleDb(defaultDb);
        return defaultDb;
    }
}

export async function saveScheduleDb(db: ScheduleDatabase): Promise<void> {
    await ensureDir();
    await writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export function isWeekday(day: string): boolean {
    const normalized = normalizeDayName(day);
    return normalized !== null && (WEEKDAYS as readonly string[]).includes(normalized);
}

export function normalizeDayName(day: string): string | null {
    const cleaned = day.toLowerCase().trim();
    const map: Record<string, string> = {
        monday: 'monday',
        senin: 'monday',
        mon: 'monday',
        '1': 'monday',

        tuesday: 'tuesday',
        selasa: 'tuesday',
        tue: 'tuesday',
        '2': 'tuesday',

        wednesday: 'wednesday',
        rabu: 'wednesday',
        wed: 'wednesday',
        '3': 'wednesday',

        thursday: 'thursday',
        kamis: 'thursday',
        thu: 'thursday',
        '4': 'thursday',

        friday: 'friday',
        jumat: 'friday',
        "jum'at": 'friday',
        fri: 'friday',
        '5': 'friday',

        saturday: 'saturday',
        sabtu: 'saturday',
        sat: 'saturday',
        '6': 'saturday',

        sunday: 'sunday',
        minggu: 'sunday',
        sun: 'sunday',
        '0': 'sunday',
        '7': 'sunday'
    };

    return map[cleaned] || null;
}

export function getDayTimeInfo(date: Date = new Date(), timeZone = 'Asia/Jakarta'): DayTimeInfo {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: 'h23'
    }).formatToParts(date);

    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const dayKey = map.weekday.toLowerCase();
    const calendarStr = `${map.weekday}, ${map.day} ${map.month}`;
    const dateKey = `${map.year}-${map.month}-${map.day}`;
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);

    return { dayKey, calendarStr, dateKey, hour, minute };
}

export const DAY_NAMES_ID: Record<string, string> = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu'
};

const DAY_INDEX: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

export function getIndonesianFormattedDate(targetDayKey?: string, timeZone = 'Asia/Jakarta'): string {
    const now = new Date();
    const currentDayStr = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(now).toLowerCase();

    let targetDate = now;
    if (targetDayKey && targetDayKey.toLowerCase() !== currentDayStr) {
        const currentIdx = DAY_INDEX[currentDayStr] ?? 1;
        const targetIdx = DAY_INDEX[targetDayKey.toLowerCase()] ?? currentIdx;
        const diff = targetIdx - currentIdx;
        targetDate = new Date(now.getTime() + diff * 86400000);
    }

    const parts = new Intl.DateTimeFormat('id-ID', {
        timeZone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).formatToParts(targetDate);

    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.weekday}, ${map.day} ${map.month} ${map.year}`;
}

export function getItemType(raw: ScheduleItem): string {
    if (raw.type) return raw.type;
    if (raw.tipe) return raw.tipe;
    const combined = `${raw.matkul || ''} ${raw.tempat || ''} ${raw.ruang || ''}`.toLowerCase();
    if (combined.includes('praktek') || combined.includes('praktik')) return 'Praktek';
    if (combined.includes('teori')) return 'Teori';
    if (combined.includes('gtil') || combined.includes('lab')) return 'Praktek';
    return 'Teori';
}

export function formatScheduleTime(raw: ScheduleItem | string, type?: string): string {
    if (typeof raw === 'string') return raw;
    let time = raw.time || raw.waktu || '';
    if (!time && raw.timeStarted && raw.timeEnded) {
        time = `${raw.timeStarted}-${raw.timeEnded}`;
    } else if (!time && raw.timeStarted) {
        time = raw.timeStarted;
    } else if (!time) {
        return '-';
    }

    const clean = time.replace(/\s*\([^)]*\)/g, '').trim().replace(/:/g, '.').replace(/\s*-\s*/g, '-');
    if (type) {
        return `${clean} (${type})`;
    }
    return clean;
}

export function formatScheduleRuang(raw: ScheduleItem | string, type?: string): string {
    if (typeof raw === 'string') return raw;
    let tempat = (raw.tempat || raw.place || raw.ruang || raw.location || '-').trim();

    if (/\((praktek|praktik|teori)\)/i.test(tempat)) {
        return tempat;
    }

    if (/^gtil[\s-]*(ruang\s*)?([0-9.]+)/i.test(tempat)) {
        const m = tempat.match(/^gtil[\s-]*(ruang\s*)?([0-9.]+)/i);
        if (m) tempat = `Gtil ruang ${m[2]}`;
    } else if (/^gkb[\s-]*(ruang\s*)?([0-9.]+)/i.test(tempat)) {
        const m = tempat.match(/^gkb[\s-]*(ruang\s*)?([0-9.]+)/i);
        if (m) tempat = `Gkb ruang ${m[2]}`;
    }

    if (type && type.toLowerCase() === 'praktek') {
        return `${tempat}(Praktek)`;
    } else if (type) {
        return `${tempat} (${type})`;
    }
    return tempat;
}

export function formatScheduleItem(raw: ScheduleItem | string): FormattedScheduleItem {
    if (typeof raw === 'string') {
        return {
            matkul: raw,
            time: '-',
            tempat: '-',
            type: 'Teori'
        };
    }

    const rawMatkul = raw.matkul || raw.subject || raw.course || raw.name || 'Mata Kuliah';
    const matkul = rawMatkul.toLowerCase() === 'pancasila' ? 'Pendidikan pancasila' : rawMatkul;
    const type = getItemType(raw);
    const time = formatScheduleTime(raw, type);
    const tempat = formatScheduleRuang(raw, type);

    return { matkul, time, tempat, type };
}

export function buildReminderMessage(options: {
    header?: string;
    dateStr: string;
    items: FormattedScheduleItem[];
}): string {
    const header = options.header || 'Teknik Informatika 1A🔥💻';

    if (options.items.length === 0) {
        return `${header}
💡 INFO JADWAL KELAS 💡

Halo, teman-teman! 👋
Berikut informasi jadwal kelas:

📅 Hari/Tanggal: ${options.dateStr}
*Tidak ada jadwal mata kuliah pada hari ini.*

Mohon diperhatikan dan jangan sampai terlambat. Terima kasih!`;
    }

    const waktuLines = options.items.map((it, idx) => `${idx + 1}.${it.time}`).join('\n');
    const matkulLines = options.items.map((it, idx) => `${idx + 1}.${it.matkul}`).join('\n');
    const ruangLines = options.items.map((it, idx) => `${idx + 1}.${it.tempat}`).join('\n');

    return `${header}
💡 INFO JADWAL KELAS 💡

Halo, teman-teman! 👋
Berikut informasi jadwal kelas:

📅 Hari/Tanggal: ${options.dateStr}
⏰ Waktu:
${waktuLines}
📚 Mata Kuliah:
${matkulLines}
📍 Ruangan:
${ruangLines}

Mohon diperhatikan dan jangan sampai terlambat. Terima kasih!`;
}

export function getScheduleForDay(db: ScheduleDatabase, dayKey: string): FormattedScheduleItem[] {
    const normalized = normalizeDayName(dayKey) || dayKey.toLowerCase();
    if (!isWeekday(normalized)) {
        return [];
    }

    const source = (db.schedule || db) as Record<string, ScheduleItem[] | ScheduleItem | undefined>;

    let rawEntries: ScheduleItem[] | ScheduleItem | undefined = source[normalized];

    if (!rawEntries) {
        for (const [key, value] of Object.entries(source)) {
            if (normalizeDayName(key) === normalized) {
                rawEntries = value;
                break;
            }
        }
    }

    if (!rawEntries) return [];

    const items = Array.isArray(rawEntries)
        ? rawEntries.map(formatScheduleItem)
        : [formatScheduleItem(rawEntries)];

    return items.slice(0, 3);
}

export async function setReminderChannel(channelId: string): Promise<void> {
    const db = await loadScheduleDb();
    db.channelId = channelId;
    await saveScheduleDb(db);
}

export async function addScheduleItem(day: string, item: ScheduleItem): Promise<{ success: boolean; error?: string; dayKey: string }> {
    const normalized = normalizeDayName(day);
    if (!normalized || !isWeekday(normalized)) {
        return { success: false, error: `Invalid weekday: ${day}`, dayKey: day };
    }

    const db = await loadScheduleDb();
    if (!db.schedule) db.schedule = {};
    const dayKey = normalized as typeof WEEKDAYS[number];
    if (!db.schedule[dayKey]) {
        db.schedule[dayKey] = [];
    }

    const list = Array.isArray(db.schedule[dayKey])
        ? db.schedule[dayKey]
        : [db.schedule[dayKey] as ScheduleItem];

    if (list.length >= 3) {
        return { success: false, error: 'Maksimal 3 mata kuliah per hari telah tercapai', dayKey };
    }

    if (!item.type) {
        item.type = getItemType(item);
    }

    list.push(item);
    db.schedule[dayKey] = list;
    await saveScheduleDb(db);
    return { success: true, dayKey };
}

export async function removeScheduleItem(day: string, index: number): Promise<{ success: boolean; removed?: ScheduleItem; error?: string; dayKey: string }> {
    const normalized = normalizeDayName(day);
    if (!normalized || !isWeekday(normalized)) {
        return { success: false, error: `Invalid weekday: ${day}`, dayKey: day };
    }

    const db = await loadScheduleDb();
    const dayKey = normalized as typeof WEEKDAYS[number];
    const list = db.schedule?.[dayKey];
    if (!list || !Array.isArray(list) || list.length === 0) {
        return { success: false, error: 'Tidak ada jadwal pada hari ini', dayKey };
    }

    if (index < 1 || index > list.length) {
        return { success: false, error: `Index tidak valid. Pilih antara 1 dan ${list.length}`, dayKey };
    }

    const [removed] = list.splice(index - 1, 1);
    await saveScheduleDb(db);
    return { success: true, removed, dayKey };
}

export async function clearScheduleDay(day: string): Promise<{ success: boolean; error?: string; dayKey: string }> {
    const normalized = normalizeDayName(day);
    if (!normalized || !isWeekday(normalized)) {
        return { success: false, error: `Invalid weekday: ${day}`, dayKey: day };
    }

    const db = await loadScheduleDb();
    const dayKey = normalized as typeof WEEKDAYS[number];
    if (db.schedule) {
        db.schedule[dayKey] = [];
        await saveScheduleDb(db);
    }
    return { success: true, dayKey };
}
