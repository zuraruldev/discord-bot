import { generateNewWord } from './dictionary';
import { evaluateGuess } from './logic';
import { ActiveGame, EndResult, SupportedLanguage, UserInfo } from './types';

export function beginGame(player: UserInfo, lang: SupportedLanguage): ActiveGame {
    if (player.current_game && player.current_game.state === EndResult.PLAYING) {
        throw new Error('User already has an active game');
    }

    const answer = generateNewWord(lang);

    const newGame: ActiveGame = {
        lang,
        answer,
        board_state: [],
        results: [],
        state: EndResult.PLAYING
    };

    return newGame;
}

export function enterGuess(guess: string, game: ActiveGame): EndResult {
    if (game.state !== EndResult.PLAYING) {
        return game.state;
    }

    const result = evaluateGuess(guess, game.answer);

    game.board_state.push(guess);
    game.results.push(result);

    const isAllCorrect = result.every(state => state === 'correct');
    if (isAllCorrect) {
        game.state = EndResult.WIN;
    } else if (game.board_state.length > game.answer.length) {
        game.state = EndResult.LOSE;
    }

    return game.state;
}
