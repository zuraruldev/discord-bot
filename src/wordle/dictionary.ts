import { enAccepted, enSolutions } from '../data/wordle/en';
import { idAccepted, idSolutions } from '../data/wordle/id';
import { SupportedLanguage, WordleLanguage } from './types';

export const languages: Record<SupportedLanguage, WordleLanguage> = {
    en: {
        site: 'https://www.powerlanguage.co.uk/wordle/',
        alphabet: 'qwertyuiopasdfghjklzxcvbnm',
        command: 'wordy',
        help: 'Guess a word in your own personal Wordy game! [English]',
        flag: 'gb'
    },
    id: {
        site: 'https://katla.vercel.app/',
        alphabet: 'qwertyuiopasdfghjklzxcvbnm',
        command: 'katla',
        help: 'Tebak kata dalam permainan Wordy pribadimu! [Bahasa Indonesia]',
        flag: 'id'
    }
};

const enValidSet = new Set<string>([...enSolutions, ...enAccepted]);
const idValidSet = new Set<string>([...idSolutions, ...idAccepted]);

export function getAlphabetFor(lang: SupportedLanguage): string {
    return languages[lang].alphabet;
}

export function getSolutionWordsFor(lang: SupportedLanguage): string[] {
    return lang === 'en' ? enSolutions : idSolutions;
}

export function isValidWord(lang: SupportedLanguage, word: string): boolean {
    const validSet = lang === 'en' ? enValidSet : idValidSet;
    return validSet.has(word);
}

export function generateNewWord(lang: SupportedLanguage): string {
    const words = getSolutionWordsFor(lang);
    return words[Math.floor(Math.random() * words.length)];
}
