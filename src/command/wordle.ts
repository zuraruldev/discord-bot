import { Message } from 'oceanic.js';

import { defineCommand } from '../Command';
import { PREFIX } from '../constants';
import { reply } from '../utils';
import { getAlphabetFor, isValidWord, languages } from '../wordle/dictionary';
import { beginGame, enterGuess } from '../wordle/game';
import { getEmotesForColorblind, renderResult } from '../wordle/logic';
import { getUserInfo, saveDb, setUserInfo } from '../wordle/store';
import { EndResult, SupportedLanguage } from '../wordle/types';

function getHelpText(): string {
    return `**Wordy is a Wordle-like clone that supports multiple languages.**

Choose the command fitting to the language you want to use and guess a word. If Wordy returns a gray icon ⬛ the letter does not exist. If it returns a yellow icon 🟨 the letter exists but is on the wrong spot. If Wordy returns a green icon 🟩 the letter is on the correct spot.

In colorblind mode 🟦 represents the right letter on the wrong position and 🟧 the right letter on the right position.

**To enter a guess (games are started automatically):** \`\`\`
${PREFIX} wordy <guess>      ${languages.en.help}
${PREFIX} katla <guess>      ${languages.id.help}
\`\`\`
To give up (or to switch languages) use \`${PREFIX} surrender\`.
To toggle colorblind mode on or off use \`${PREFIX} colorblind\`.
To show your current board use \`${PREFIX} show\`.
To view your stats use \`${PREFIX} stats\`.

*Wordy saves your DiscordID together with your Discord name and your game stats to provide game statistics.*`;
}

async function handleShow(message: Message) {
    const player = getUserInfo(message.author.id, message.author.username);
    if (!player.current_game) {
        return reply(message, "You haven't started a game yet!");
    }

    let description = 'Your board:\n```\n';
    for (let i = 0; i < player.current_game.board_state.length; i++) {
        description += `${renderResult(player.current_game.results[i], player.settings.colorblind)} ${player.current_game.board_state[i]}\n`;
    }
    description += '```';

    return reply(message, description);
}

async function handleColorblind(message: Message) {
    const player = getUserInfo(message.author.id, message.author.username);
    player.settings.colorblind = !player.settings.colorblind;
    setUserInfo(message.author.id, player);
    await saveDb();

    const { absent, present, correct } = getEmotesForColorblind(player.settings.colorblind);
    const description = `Colorblind mode is turned ${player.settings.colorblind ? 'ON' : 'OFF'} for you.\n\nYour icon colors are: absent letter ${absent}, wrong position ${present}, and correct ${correct}.`;

    return reply(message, description);
}

import { createUnifiedStatsEmbed } from './stats';

async function handleStats(message: Message) {
    const avatarUrl = message.author.avatarURL('png');
    const embed = await createUnifiedStatsEmbed(message.author.id, message.author.username, avatarUrl);
    return reply(message, { embeds: [embed] });
}

async function handleSurrender(message: Message) {
    const player = getUserInfo(message.author.id, message.author.username);
    if (!player.current_game) {
        return reply(message, "You haven't started a game yet!");
    }

    player.stats.surrenders++;
    const gameLang = player.current_game.lang;
    player.stats.games[gameLang] = (player.stats.games[gameLang] || 0) + 1;
    const answer = player.current_game.answer;
    player.current_game = null;
    setUserInfo(message.author.id, player);
    await saveDb();

    return reply(message, `You coward! 🙄\nYour word was \`${answer}\`!`);
}

async function handleNewGuess(message: Message, guess: string | undefined, lang: SupportedLanguage) {
    if (!guess) {
        const cmd = languages[lang].command;
        return reply(message, `To play Wordy simply type \`${PREFIX} ${cmd} <guess>\` to start or continue your own personal game.`);
    }

    guess = guess.toLowerCase().replace(/^guess:/, '').trim();
    if (guess.length !== 5) {
        return reply(message, 'Guess must be 5 letters long');
    }

    if (!isValidWord(lang, guess)) {
        return reply(message, "That's not a valid word!");
    }

    let description = '';
    const player = getUserInfo(message.author.id, message.author.username);

    if (!player.current_game || player.current_game.state !== EndResult.PLAYING) {
        description += 'Starting a new game...\n';
        player.current_game = beginGame(player, lang);
    }

    if (player.current_game.lang !== lang) {
        return reply(message, `You are already playing in a different language! Use \`${PREFIX} surrender\` to end it.`);
    }

    if (player.current_game.board_state.includes(guess)) {
        return reply(message, "You've already guessed that word!");
    }

    const alphabet = getAlphabetFor(lang);
    if ([...guess].some(char => !alphabet.includes(char))) {
        return reply(message, `You can only use the following letters: \`${alphabet}\``);
    }

    enterGuess(guess, player.current_game);

    description += 'Your results so far:\n```\n';
    for (let i = 0; i < player.current_game.board_state.length; i++) {
        description += `${renderResult(player.current_game.results[i], player.settings.colorblind)} ${player.current_game.board_state[i]}\n`;
    }
    description += '```';

    if (player.current_game.state === EndResult.WIN) {
        description += `\nCongratulations! 🎉\nCompleted in ${player.current_game.board_state.length} guesses!\n`;
        player.stats.wins++;
    } else if (player.current_game.state === EndResult.LOSE) {
        description += `\nNo more guesses! 😭\nYour word was \`${player.current_game.answer}\`!\n`;
        player.stats.losses++;
    }

    await reply(message, {
        embeds: [{
            title: 'Wordy',
            description: description.trim(),
            color: 0x5865F2
        }]
    });

    if (player.current_game.state !== EndResult.PLAYING) {
        const finishedLang = player.current_game.lang;
        player.stats.games[finishedLang] = (player.stats.games[finishedLang] || 0) + 1;
        player.current_game = null;
    }

    setUserInfo(message.author.id, player);
    await saveDb();
}

defineCommand({
    name: 'wordy',
    aliases: ['wordle'],
    description: 'Guess a 5-letter word in your personal Wordy game [English]',
    usages: ['<guess>', 'id <guess>', 'surrender', 'stats', 'show', 'colorblind', 'help'],
    async run(message, args) {
        const sub = args[0]?.toLowerCase();
        if (!sub) {
            return reply(message, `To play Wordy simply type \`${PREFIX} wordy <guess>\` to start or continue your own personal game.\nUse \`${PREFIX} wordy help\` for full guide.`);
        }

        if (sub === 'help') {
            return reply(message, getHelpText());
        }
        if (sub === 'surrender') {
            return handleSurrender(message);
        }
        if (sub === 'stats') {
            return handleStats(message);
        }
        if (sub === 'show') {
            return handleShow(message);
        }
        if (sub === 'colorblind') {
            return handleColorblind(message);
        }
        if (sub === 'id' || sub === 'indonesia' || sub === 'indonesian' || sub === 'katla') {
            return handleNewGuess(message, args[1], 'id');
        }
        if (sub === 'en' || sub === 'english') {
            return handleNewGuess(message, args[1], 'en');
        }

        const player = getUserInfo(message.author.id, message.author.username);
        const lang: SupportedLanguage = player.current_game ? player.current_game.lang : 'en';
        return handleNewGuess(message, args[0], lang);
    }
});

defineCommand({
    name: 'katla',
    aliases: ['wordy_id', 'wordle_id', 'wordleid'],
    description: 'Tebak kata 5 huruf dalam permainan Wordy pribadimu [Bahasa Indonesia]',
    usages: ['<tebakan>', 'help'],
    async run(message, args) {
        const sub = args[0]?.toLowerCase();
        if (!sub) {
            return reply(message, `Untuk bermain Katla, ketik \`${PREFIX} katla <tebakan>\`.\nGunakan \`${PREFIX} wordy help\` untuk panduan lengkap.`);
        }
        if (sub === 'help') {
            return reply(message, getHelpText());
        }
        return handleNewGuess(message, args[0], 'id');
    }
});

defineCommand({
    name: 'surrender',
    description: 'Give up your active Wordy game and reveal the word',
    usages: [''],
    async run(message) {
        return handleSurrender(message);
    }
});

defineCommand({
    name: 'colorblind',
    description: 'Toggle Wordy colorblind mode on or off',
    usages: [''],
    async run(message) {
        return handleColorblind(message);
    }
});

defineCommand({
    name: 'show',
    description: 'Show your current Wordy board state',
    usages: [''],
    async run(message) {
        return handleShow(message);
    }
});
