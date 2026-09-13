import { client } from '../Client';
import { defineCommand } from '../Command';
import { UnitedStates } from '../data/americanStates';
import { reply } from '../utils';

interface StateData {
    image_url: string;
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
    name: 'united-states',
    description: 'Guess the American state from its map',
    aliases: ['us-state', 'usa'],
    usages: [''],
    async run(message) {
        if (!message.channel) return;
        const channelId = message.channel.id;
        if (activeQuizzes.has(channelId)) {
            return reply(message, 'A quiz is already active in this channel!');
        }

        const entries = Object.entries(UnitedStates as Record<string, StateData>);
        const [name, data] = entries[Math.floor(Math.random() * entries.length)];

        activeQuizzes.set(channelId, { userId: message.author.id, answer: data.answer, name });

        setTimeout(() => {
            if (activeQuizzes.has(channelId)) {
                activeQuizzes.delete(channelId);
                reply(message, {
                    embeds: [{
                        title: 'Time\'s up!',
                        description: `The answer was **${name}**`,
                        color: 0xED4245
                    }]
                });
            }
        }, 30000);

        return await reply(message, {
            embeds: [{
                title: 'US States Quiz',
                description: data.question,
                image: { url: data.image_url },
                color: 0x5865f2,
                footer: { text: 'You have 30 seconds to answer' }
            }]
        });
    }
});
