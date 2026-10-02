import '~command';
import '~module';

import { client } from './Client.js';
import { commands, defineCommand } from './Command.js';
import { isAdmin, PREFIX } from './constants.js';
import { commandListEmbed, logError, reply } from './utils.js';

defineCommand({
    name: 'help',
    description: 'Show all available commands',
    aliases: ['h'],
    usages: ['', '[command]'],
    async run(message, args) {
        const userIsAdmin = isAdmin(message.author.id);
        if (args[0]) {
            const query = args[0].toLowerCase();
            if (query === 'code' || query === 'coding') {
                return reply(message, {
                    embeds: [{
                        title: 'Help: Coding Quiz',
                        description: 'Interactive programming and algorithm quizzes.\nStatus: (coming soon)',
                        color: 0x5865f2
                    }]
                });
            }

            const cmd = commands.find(c => c.name === query || c.aliases?.includes(query));
            if (!cmd || ((cmd.ownerOnly || cmd.adminOnly || cmd.hidden) && !userIsAdmin)) {
                return reply(message, `Command \`${args[0]}\` not found.`);
            }

            const usageText = cmd.usages?.length ? `\n**Usage:** \`${PREFIX} ${cmd.name} ${cmd.usages.join('` or `' + PREFIX + ' ' + cmd.name + ' ')}\`` : '';
            return reply(message, {
                embeds: [{
                    title: `Help: ${cmd.name}`,
                    description: `${cmd.description}${usageText}`,
                    color: 0x5865f2
                }]
            });
        }

        return reply(message, { embeds: [commandListEmbed(userIsAdmin)] });
    }
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    if (!content.startsWith(PREFIX)) return;

    const withoutPrefix = message.content.slice(PREFIX.length).trim();
    const args = withoutPrefix.split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = commands.find(cmd =>
        cmd.name === commandName || cmd.aliases?.includes(commandName)
    );
    if (!command) return;

    if ((command.ownerOnly || command.adminOnly) && !isAdmin(message.author.id)) {
        return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
    }

    try {
        await command.run(message, args);
    } catch (error) {
        console.error(error);
        logError(error);
    }
});

client.connect();
