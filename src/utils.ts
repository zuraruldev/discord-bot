import type { EmbedOptions } from 'oceanic.js';
import { CreateMessageOptions, Message } from 'oceanic.js';

import { client } from './Client';
import { commands } from './Command';

function createBaseEmbed(title: string, description: string, color: number): EmbedOptions {
    return {
        title,
        description,
        color,
        timestamp: new Date().toISOString()
    };
}

export function createInfoEmbed(title: string, description: string): EmbedOptions {
    return createBaseEmbed(title, description, 0x5865F2);
}

export function createSuccessEmbed(title: string, description: string): EmbedOptions {
    return createBaseEmbed(title, description, 0x57F287);
}

export function createErrorEmbed(title: string, description: string): EmbedOptions {
    return createBaseEmbed(title, description, 0xED4245);
}

function uploadAsFileIfTooLong(options: CreateMessageOptions) {
    if (!options.content) return options;

    if (options.content.length > 2000) {
        const lang = options.content.match(/(?<=^`{3})\w{0,14}(?=\n)/)?.[0];

        if (lang !== undefined && options.content.endsWith('```')) {
            options.content = options.content.slice(3 + lang.length + 1, -3).replace(/\u200b`\u200b`\u200b`\u200b/g, '```');
        }

        options.files ??= [];
        options.files.push({
            name: `message.${lang || 'txt'}`,
            contents: Buffer.from(options.content)
        });
        options.content = '';
    }

    return options;
}

export function reply(message: Message, options: CreateMessageOptions | string) {
    if (typeof options === 'string') options = { content: options };

    const oldReply = message.channel?.messages.toArray().find(m => m.author.id === client.user.id && m.messageReference?.messageID === message.id);
    if (oldReply) return oldReply.edit(uploadAsFileIfTooLong(options));

    options.messageReference = { messageID: message.id };

    return message.channel?.createMessage(uploadAsFileIfTooLong(options));
}

export function send(channelID: string, options: CreateMessageOptions | string) {
    if (typeof options === 'string') options = { content: options };

    return client.rest.channels.createMessage(channelID, uploadAsFileIfTooLong(options));
}

export function logError(error: unknown) {
    console.error(error);

    const { ERROR_LOG_CHANNEL_ID } = process.env;
    if (!ERROR_LOG_CHANNEL_ID || !(error instanceof Error)) return;

    const content = '```\n' + (error.stack || error.message).replace(/`{3}/g, '\u200b`\u200b`\u200b`\u200b') + '\n```';
    send(ERROR_LOG_CHANNEL_ID, content);
}

export function numberFormat(number: number) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number);
}

function autoCategory(commandName: string): 'General' | 'Quiz' | 'Bot' {
    const quiz = [
        'flag',
        'capital',
        'united-states',
        'kabupaten',
        'province',
        'language',
        'aliases',
        'wordy',
        'katla',
        'surrender',
        'stats',
        'colorblind',
        'show'
    ];
    const bot = ['calculator', 'reminder'];

    if (quiz.includes(commandName)) return 'Quiz';
    if (bot.includes(commandName)) return 'Bot';
    return 'General';
}

export function commandListEmbed(): EmbedOptions {
    const filteredCommands = commands.filter(({ ownerOnly, hidden }) => !ownerOnly && !hidden);

    const grouped: Record<string, string[]> = {
        General: [],
        Quiz: [],
        Bot: []
    };

    for (const cmd of filteredCommands) {
        const cat = autoCategory(cmd.name);
        grouped[cat].push(`\`${cmd.name}\` - ${cmd.description || 'No description'}`);
    }

    const fields = Object.entries(grouped)
        .filter(([, list]) => list.length > 0)
        .map(([cat, list]) => ({
            name: cat,
            value: list.join('\n'),
            inline: false
        }));

    const botAvatar =
        client.user?.avatarURL('png') ??
        client.user?.defaultAvatarURL;

    return {
        title: 'Command List - Prefix is `Geo`',
        description: 'Here are all available commands\nUse `help [command]` for more details',
        color: 0x5865f2,
        fields,
        thumbnail: {
            url: botAvatar!
        },
        footer: {
            text: 'Example: Geo help flag'
        },
    };
}
