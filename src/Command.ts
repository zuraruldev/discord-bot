import { Collection, Message } from 'oceanic.js';

export interface Command {
    name: string;
    aliases?: string[];
    description: string;
    usages?: string[];
    ownerOnly?: boolean;
    adminOnly?: boolean;
    rawContent?: boolean;
    hidden?: boolean;
    run: (message: Message, args: string[]) => Promise<void | unknown> | void | unknown;
}

export const commands = new Collection<string, Command>();

export function defineCommand(command: Command) {
    commands.set(command.name, command);
}
