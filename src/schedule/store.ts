import { mkdir, readFile, writeFile } from 'fs/promises';

import { DEFAULT_REMINDER_USER_ID } from '../constants';
import { DayTimeInfo, FormattedScheduleItem, ScheduleDatabase, ScheduleItem } from './types';

const DB_DIR = './data';
const DB_FILE = './data/schedule.json';

const DEFAULT_DB: ScheduleDatabase = {
    channelId: '',
    pingUserId: DEFAULT_REMINDER_USER_ID,
    timezone: 'Asia/Jakarta',
    schedule: {
         monday: [
            {
                matkul: 'Keterampilan Komputer',
                timeStarted: '07:30',
                timeEnded: '11:10',
                tempat: 'GTIL 5.7'
            },
            {
                matkul: 'Pancasila',
                timeStarted: '13:50',
                timeEnded: '15:30',
                tempat: 'GKB 4.5'
            }
        ],
        tuesday: [
            {
                matkul: 'Arsitektur Komputer',
                timeStarted: '08:20',
                timeEnded: '11:10',
                tempat: 'GKB 4.6'
            },
            {
                matkul: 'Bahasa Indonesia',
                timeStarted: '13:50',
                timeEnded: '15:30',
                tempat: 'GKB 3.8'
            } 
        ],
        wednesday: [
            {
                matkul: 'Algoritma Programming',
                timeStarted: '09:25',
                timeEnded: '10:15',
                tempat: 'GKB 4.6'
            },
            {
                matkul: 'Basis data',
                timeStarted: '10:20',
                timeEnded: '11:10',
                tempat: 'GKB 4.6'
            },
	    { 
                matkul: 'Algoritma programming',
	        timeStarted: '11:15', 
                timeEnded: '15:30',
                tempat: 'GTIL 5.6'
	
             }
        ],
        thursday: [
            {
                matkul: 'Matematika Dasar',
                timeStarted: '08:20',
                timeEnded: '11:10',
                tempat: 'GKB 3.8'
            },
            {
                matkul: 'Pengantar Sistem Informasi',
                timeStarted: '13:50',
                timeEnded: '15:30',
                tempat: 'GKB 4.2'
            }
        ],
        friday: [
            {
                matkul: 'Basis Data',
                timeStarted: '07:30',
                timeEnded: '11:10',
                tempat: 'GTIL 5.7'
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
    try {
        await ensureDir();
        const content = await readFile(DB_FILE, 'utf-8');
        return JSON.parse(content) as ScheduleDatabase;
    } catch {
        await saveScheduleDb(DEFAULT_DB);
        return DEFAULT_DB;
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

export function formatScheduleItem(raw: ScheduleItem | string): FormattedScheduleItem {
    if (typeof raw === 'string') {
        return {
            matkul: raw,
            time: '-',
            tempat: '-'
        };
    }

    const matkul = raw.matkul || raw.subject || raw.course || raw.name || 'Mata Kuliah';

    let time = raw.time || raw.waktu || '';
    if (!time && raw.timeStarted && raw.timeEnded) {
        time = `${raw.timeStarted} - ${raw.timeEnded}`;
    } else if (!time && raw.timeStarted) {
        time = raw.timeStarted;
    } else if (!time) {
        time = '-';
    }

    const tempat = raw.tempat || raw.place || raw.ruang || raw.location || '-';

    return { matkul, time, tempat };
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
