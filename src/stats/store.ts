import { mkdir, readFile, writeFile } from 'fs/promises';

import { ExamRecord, ExamTopic, UserStats } from './types';

const DB_DIR = './data';
const DB_FILE = './data/user-stats.json';

let isLoaded = false;
let isDirty = false;
let isSaving = false;
const statsStore = new Map<string, UserStats>();

export const TOPIC_TITLES: Record<ExamTopic, string> = {
    'php-basic': '[PHP Junior Developer]',
    'php-advance': '[PHP Senior Architect]',
    'devops': '[DevOps & Cloud Engineer]',
    'hardware': '[Computer Hardware Specialist]'
};

export const TOPIC_NAMES: Record<ExamTopic, string> = {
    'php-basic': 'PHP Dasar (Basic)',
    'php-advance': 'PHP Lanjutan (Advance)',
    'devops': 'DevOps & Networking',
    'hardware': 'Computer Hardware'
};

function createDefaultExamRecord(): ExamRecord {
    return {
        attempts: 0,
        passed: false,
        firstTryScore: null,
        firstTryPassed: false,
        bestScore: 0,
        grade: '-',
        title: null,
        lastTakenAt: ''
    };
}

async function ensureDir(): Promise<void> {
    try {
        await mkdir(DB_DIR, { recursive: true });
    } catch {
        return;
    }
}

export async function loadStatsDb(): Promise<void> {
    if (isLoaded) return;
    try {
        await ensureDir();
        const content = await readFile(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as Record<string, UserStats>;
        for (const [id, user] of Object.entries(parsed)) {
            statsStore.set(id, user);
        }
    } catch {
        // file doesn't exist yet, ok
    }
    isLoaded = true;
}

export async function saveStatsDb(): Promise<void> {
    if (!isDirty || isSaving) return;
    isSaving = true;
    try {
        await ensureDir();
        const obj: Record<string, UserStats> = {};
        for (const [id, user] of statsStore.entries()) {
            obj[id] = user;
        }
        await writeFile(DB_FILE, JSON.stringify(obj, null, 2), 'utf-8');
        isDirty = false;
    } catch (error) {
        console.error('Failed to save user-stats database:', error);
    } finally {
        isSaving = false;
    }
}

export function getUserStats(userId: string, username?: string): UserStats {
    let stats = statsStore.get(userId);
    if (!stats) {
        stats = {
            userId,
            username,
            exams: {
                'php-basic': createDefaultExamRecord(),
                'php-advance': createDefaultExamRecord(),
                'devops': createDefaultExamRecord(),
                'hardware': createDefaultExamRecord()
            },
            totalExamsPassed: 0,
            titles: [],
            geography: {
                totalAnswered: 0,
                correct: 0,
                wrong: 0,
                byCategory: {}
            }
        };
        statsStore.set(userId, stats);
        isDirty = true;
    }

    if (username && stats.username !== username) {
        stats.username = username;
        isDirty = true;
    }

    // Ensure all topic records exist
    const topics: ExamTopic[] = ['php-basic', 'php-advance', 'devops', 'hardware'];
    for (const t of topics) {
        if (!stats.exams[t]) {
            stats.exams[t] = createDefaultExamRecord();
            isDirty = true;
        }
    }

    return stats;
}

export async function recordExamResult(
    userId: string,
    topic: ExamTopic,
    correctCount: number,
    totalQuestions: number,
    username?: string
): Promise<{
    passed: boolean;
    grade: string;
    title: string | null;
    isFirstTry: boolean;
    percentage: number;
    attemptNumber: number;
}> {
    const stats = getUserStats(userId, username);
    const exam = stats.exams[topic];

    exam.attempts += 1;
    const isFirstTry = exam.attempts === 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= 90;

    if (isFirstTry) {
        exam.firstTryScore = percentage;
        exam.firstTryPassed = passed;
    }

    if (percentage > exam.bestScore) {
        exam.bestScore = percentage;
    }

    let grade = '-';
    if (passed) {
        if (isFirstTry) {
            grade = percentage === 100 ? 'Grade S+ (Perfect First Try)' : 'Grade S (Cum Laude / First Try)';
        } else {
            // Retake grade
            grade = exam.firstTryPassed
                ? exam.grade // keep previous first-try grade if they already had it
                : `Grade B (Retake Pass - Ke-${exam.attempts})`;
        }

        exam.passed = true;
        exam.title = TOPIC_TITLES[topic];

        if (!stats.titles.includes(TOPIC_TITLES[topic])) {
            stats.titles.push(TOPIC_TITLES[topic]);
        }
    } else {
        if (!exam.passed) {
            grade = percentage >= 70 ? 'Grade C (Belum Lulus)' : 'Grade F (Gagal)';
        } else {
            grade = exam.grade; // preserve previously achieved passing grade
        }
    }

    exam.grade = grade;
    exam.lastTakenAt = new Date().toISOString();

    // Recalculate total exams passed
    stats.totalExamsPassed = Object.values(stats.exams).filter(e => e.passed).length;

    isDirty = true;
    await saveStatsDb();

    return {
        passed,
        grade,
        title: passed ? TOPIC_TITLES[topic] : null,
        isFirstTry,
        percentage,
        attemptNumber: exam.attempts
    };
}

export async function recordGeographyAnswer(
    userId: string,
    isCorrect: boolean,
    category: string,
    username?: string
): Promise<void> {
    const stats = getUserStats(userId, username);
    stats.geography.totalAnswered += 1;
    if (isCorrect) {
        stats.geography.correct += 1;
    } else {
        stats.geography.wrong += 1;
    }

    if (!stats.geography.byCategory[category]) {
        stats.geography.byCategory[category] = { correct: 0, wrong: 0 };
    }

    if (isCorrect) {
        stats.geography.byCategory[category].correct += 1;
    } else {
        stats.geography.byCategory[category].wrong += 1;
    }

    isDirty = true;
    await saveStatsDb();
}

await loadStatsDb();
