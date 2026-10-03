export type ExamTopic = 'php-basic' | 'php-advance' | 'devops' | 'hardware';

export interface ExamRecord {
    attempts: number;
    passed: boolean;
    firstTryScore: number | null;
    firstTryPassed: boolean;
    bestScore: number;
    grade: string;
    title: string | null;
    lastTakenAt: string;
}

export interface GeographyCategoryStats {
    correct: number;
    wrong: number;
}

export interface GeographyStats {
    totalAnswered: number;
    correct: number;
    wrong: number;
    byCategory: Record<string, GeographyCategoryStats>;
}

export interface UserStats {
    userId: string;
    username?: string;
    exams: Record<ExamTopic, ExamRecord>;
    totalExamsPassed: number;
    titles: string[];
    geography: GeographyStats;
}
