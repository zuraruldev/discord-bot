import type { EmbedOptions } from 'oceanic.js';
import { CreateMessageOptions, Message } from 'oceanic.js';

import { client } from './Client';
import { commands } from './Command';
import { PREFIX } from './constants';

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

export function splitMessage(text: string, maxLength = 1950): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining.trim());
            break;
        }

        let splitIndex = -1;
        const searchWindow = remaining.slice(0, maxLength);

        // 1. Divider line (e.g. \n---\n or \n---)
        const dividerMatch = [...searchWindow.matchAll(/\n---(?:\n|$)/g)].pop();
        if (dividerMatch && dividerMatch.index !== undefined && dividerMatch.index > 200) {
            splitIndex = dividerMatch.index + dividerMatch[0].length;
        }

        // 2. Section header (e.g. \n### )
        if (splitIndex === -1) {
            const headerMatch = [...searchWindow.matchAll(/\n(?=#{1,4}\s)/g)].pop();
            if (headerMatch && headerMatch.index !== undefined && headerMatch.index > 200) {
                splitIndex = headerMatch.index;
            }
        }

        // 3. Double newline (paragraph break)
        if (splitIndex === -1) {
            const dblNewline = searchWindow.lastIndexOf('\n\n');
            if (dblNewline > 200) {
                splitIndex = dblNewline + 2;
            }
        }

        // 4. Single newline
        if (splitIndex === -1) {
            const singleNewline = searchWindow.lastIndexOf('\n');
            if (singleNewline > 200) {
                splitIndex = singleNewline + 1;
            }
        }

        // 5. Sentence end (. / ! / ?)
        if (splitIndex === -1) {
            const sentenceEnd = Math.max(
                searchWindow.lastIndexOf('. '),
                searchWindow.lastIndexOf('! '),
                searchWindow.lastIndexOf('? ')
            );
            if (sentenceEnd > 200) {
                splitIndex = sentenceEnd + 2;
            }
        }

        // 6. Space
        if (splitIndex === -1) {
            const spaceIndex = searchWindow.lastIndexOf(' ');
            if (spaceIndex > 0) {
                splitIndex = spaceIndex + 1;
            }
        }

        // 7. Hard cut fallback
        if (splitIndex === -1) {
            splitIndex = maxLength;
        }

        let chunk = remaining.slice(0, splitIndex).trim();
        let nextRemaining = remaining.slice(splitIndex).trim();

        // Handle open code blocks across chunks
        const codeBlockCount = (chunk.match(/```/g) || []).length;
        if (codeBlockCount % 2 !== 0) {
            const lastOpening = chunk.lastIndexOf('```');
            const lang = chunk.slice(lastOpening + 3).match(/^\w+/)?.[0] || '';
            chunk += '\n```';
            nextRemaining = '```' + lang + '\n' + nextRemaining;
        }

        if (chunk) {
            chunks.push(chunk);
        }
        remaining = nextRemaining;
    }

    return chunks;
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

export async function reply(message: Message, options: CreateMessageOptions | string) {
    if (typeof options === 'string') options = { content: options };

    try {
        if (options.content && options.content.length > 2000 && (!options.files || options.files.length === 0)) {
            const chunks = splitMessage(options.content, 1950);
            if (chunks.length > 1) {
                let firstResult: Message | undefined;
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    if (i === 0) {
                        firstResult = await reply(message, {
                            ...options,
                            content: chunk
                        });
                    } else {
                        await new Promise(r => setTimeout(r, 250));
                        if (message.channel) {
                            await message.channel.createMessage({ content: chunk });
                        } else {
                            await client.rest.channels.createMessage(message.channelID, { content: chunk });
                        }
                    }
                }
                return firstResult;
            }
        }

        const oldReply = message.channel?.messages.toArray().find(m => m.author.id === client.user.id && m.messageReference?.messageID === message.id);
        if (oldReply) return await oldReply.edit(uploadAsFileIfTooLong(options));

        options.messageReference = { messageID: message.id };

        return await message.channel?.createMessage(uploadAsFileIfTooLong(options));
    } catch (err) {
        console.error('[reply] Failed to reply:', err);
        return undefined;
    }
}

export async function send(channelID: string, options: CreateMessageOptions | string) {
    if (typeof options === 'string') options = { content: options };

    if (options.content && options.content.length > 2000 && (!options.files || options.files.length === 0)) {
        const chunks = splitMessage(options.content, 1950);
        if (chunks.length > 1) {
            let firstResult: Message | undefined;
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (i === 0) {
                    firstResult = await send(channelID, { ...options, content: chunk });
                } else {
                    await new Promise(r => setTimeout(r, 250));
                    await client.rest.channels.createMessage(channelID, { content: chunk });
                }
            }
            return firstResult;
        }
    }

    return await client.rest.channels.createMessage(channelID, uploadAsFileIfTooLong(options));
}

let isLoggingError = false;

export async function logError(error: unknown) {
    console.error(error);

    if (isLoggingError) return;
    const errorLogChannel = process.env.ERROR_LOG_CHANNEL_ID || process.env.BUG_CHANNEL_ID;
    if (!errorLogChannel || !(error instanceof Error)) return;

    isLoggingError = true;
    try {
        const content = '```\n' + (error.stack || error.message).replace(/`{3}/g, '\u200b`\u200b`\u200b`\u200b') + '\n```';
        await send(errorLogChannel, content);
    } catch (err) {
        console.error('[logError] Failed to forward error to channel:', err);
    } finally {
        isLoggingError = false;
    }
}

export function numberFormat(number: number) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number);
}

function autoCategory(commandName: string): 'General' | 'Geography Quiz' | 'Wordle Quiz' | 'Coding Quiz' {
    const geoQuiz = [
        'flag',
        'capital',
        'united-states',
        'kabupaten',
        'province',
        'language',
        'aliases'
    ];
    const wordleQuiz = [
        'wordy',
        'katla',
        'surrender',
        'colorblind',
        'show'
    ];
    const codingQuiz = [
        'code',
        'php',
        'devops',
        'hardware',
        'learn',
        'practice'
    ];

    if (geoQuiz.includes(commandName)) return 'Geography Quiz';
    if (wordleQuiz.includes(commandName)) return 'Wordle Quiz';
    if (codingQuiz.includes(commandName)) return 'Coding Quiz';
    return 'General';
}

export function commandListEmbed(showAdmin = false): EmbedOptions {
    const filteredCommands = commands.filter(({ ownerOnly, adminOnly, hidden }) => {
        if (ownerOnly || adminOnly || hidden) {
            return showAdmin;
        }
        return true;
    });

    const grouped: Record<string, string[]> = {
        General: [],
        'Geography Quiz': [],
        'Wordle Quiz': [],
        'Coding Quiz': []
    };

    if (showAdmin) {
        grouped.Admin = [];
    }

    for (const cmd of filteredCommands) {
        const isCmdAdmin = cmd.ownerOnly || cmd.adminOnly || cmd.hidden;
        const cat = isCmdAdmin ? 'Admin' : autoCategory(cmd.name);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(`\`${cmd.name}\` - ${cmd.description || 'No description'}`);
    }

    const fields = Object.entries(grouped)
        .filter(([, list]) => list.length > 0)
        .map(([cat, list]) => ({
            name: cat,
            value: list.join('\n'),
            inline: false
        }));

    let botAvatar: string | undefined;
    try {
        if (client.ready) {
            botAvatar = client.user?.avatarURL('png') ?? client.user?.defaultAvatarURL;
        }
    } catch {
        botAvatar = undefined;
    }

    return {
        title: `Command List - Prefix is \`${PREFIX}\``,
        description: `Here are all available commands\nUse \`${PREFIX} help [command]\` for more details`,
        color: 0x5865f2,
        fields,
        thumbnail: botAvatar ? {
            url: botAvatar
        } : undefined,
        footer: {
            text: `Example: ${PREFIX} help flag`
        }
    };
}
