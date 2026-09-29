export interface ScheduleItem {
    matkul?: string;
    subject?: string;
    course?: string;
    name?: string;
    timeStarted?: string;
    timeEnded?: string;
    time?: string;
    waktu?: string;
    tempat?: string;
    place?: string;
    ruang?: string;
    location?: string;
}

export interface FormattedScheduleItem {
    matkul: string;
    time: string;
    tempat: string;
}

export interface ScheduleDatabase {
    channelId?: string;
    pingUserId?: string;
    timezone?: string;
    lastSentDate?: string;
    schedule?: Record<string, ScheduleItem[] | ScheduleItem>;
    [key: string]: unknown;
}

export interface DayTimeInfo {
    dayKey: string;
    calendarStr: string;
    dateKey: string;
    hour: number;
    minute: number;
}
