import { client } from '../Client';
import { defineCommand } from '../Command';
import { capitals } from '../data/capitals';
import { reply } from '../utils';

interface QuestionData {
    question: string;
    answer: string[];
}

const activeQuizzes = new Map<string, { userId: string; answer: string[]; name: string }>();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.channel) return;
    const quiz = activeQuizzes.get(message.channel.id);
    if (!quiz || quiz.userId !== message.author.id) return;

    const isCorrect = quiz.answer.some(a => a.toLowerCase() === message.content.toLowerCase());
    activeQuizzes.delete(message.channel.id);

    await reply(message, {
        embeds: [{
            title: isCorrect ? 'Correct!' : 'Wrong!',
            description: isCorrect ? `**${quiz.name}** is correct!` : `The answer was **${quiz.name}**`,
            color: isCorrect ? 0x57F287 : 0xED4245
        }]
    });
});

defineCommand({
    name: 'capital',
    description: 'Guess the capital of a country',
    usages: [''],
    async run(message) {
        if (!message.channel) return;
        const channelId = message.channel.id;
        if (activeQuizzes.has(channelId)) {
            return reply(message, 'A quiz is already active in this channel!');
        }

        const continents = Object.keys(capitals) as (keyof typeof capitals)[];
        const continent = continents[Math.floor(Math.random() * continents.length)];
        const countries = Object.entries(capitals[continent] as Record<string, QuestionData>);
        const [country, data] = countries[Math.floor(Math.random() * countries.length)];

        activeQuizzes.set(channelId, { userId: message.author.id, answer: data.answer, name: data.answer[0] });

        setTimeout(() => {
            if (activeQuizzes.has(channelId)) {
                activeQuizzes.delete(channelId);
                reply(message, {
                    embeds: [{
                        title: 'Time\'s up!',
                        description: `The answer was **${data.answer[0]}**`,
                        color: 0xED4245
                    }]
                });
            }
        }, 30000);

        return await reply(message, {
            embeds: [{
                title: 'Capital Quiz',
                description: `${data.question}\n\nCountry: **${country}**`,
                color: 0x5865f2,
                footer: { text: 'You have 30 seconds to answer' }
            }]
        });
    }
});
