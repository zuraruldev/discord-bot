import { LetterState } from './types';

export function evaluateGuess(guess: string, answer: string): LetterState[] {
    if (guess.length !== answer.length) {
        throw new Error('Guess and answer must be of same length');
    }

    const answerCounts: Record<string, number> = {};
    for (let i = 0; i < answer.length; i++) {
        if (guess[i] !== answer[i]) {
            answerCounts[answer[i]] = (answerCounts[answer[i]] || 0) + 1;
        }
    }

    const results: LetterState[] = [];
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === answer[i]) {
            results.push('correct');
            continue;
        }

        if ((answerCounts[guess[i]] || 0) <= 0) {
            results.push('absent');
            continue;
        }

        answerCounts[guess[i]]--;
        results.push('present');
    }

    return results;
}

export function getEmotesForColorblind(colorblind: boolean): { absent: string; present: string; correct: string } {
    if (colorblind) {
        return { absent: '⬛', present: '🟦', correct: '🟧' };
    }
    return { absent: '⬛', present: '🟨', correct: '🟩' };
}

export function renderResult(result: LetterState[], colorblind = false): string {
    const { absent, present, correct } = getEmotesForColorblind(colorblind);

    return result
        .map(state => {
            if (state === 'absent') return absent;
            if (state === 'present') return present;
            return correct;
        })
        .join('');
}
