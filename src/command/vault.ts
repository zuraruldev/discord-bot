import { defineCommand } from '../Command';
import { isAdmin, PREFIX } from '../constants';
import { reply } from '../utils';
import {
    addVaultUser,
    buildTree,
    copyFile,
    createDirectory,
    fetchUrlToVault,
    getUserVaultUsage,
    grepFiles,
    isVaultAllowed,
    listDirectory,
    listSharedFiles,
    listVaultUsers,
    movePath,
    normalizePath,
    readFile,
    readSharedFile,
    removePath,
    removeVaultUser,
    shareFile,
    touchFile,
    unshareFile,
    writeToFile
} from '../vault/store';

function unescapeString(str: string): string {
    let clean = str.trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith('\'') && clean.endsWith('\''))) {
        clean = clean.slice(1, -1);
    }

    return clean
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, '\'');
}

defineCommand({
    name: 'vault',
    description: 'Personal virtual drive and notepad database',
    aliases: ['v', 'drive'],
    usages: [
        'ls [path]',
        'mkdir <path>',
        'touch <path>',
        'printf "<text>" >> <path>',
        'cat <path>',
        'curl <url> > <path>',
        'wget <url> [path]',
        'share <path> <@user>',
        'unshare <path> <@user>',
        'shared',
        'shared cat <@user> <path>',
        'df',
        'rm <path>',
        'cp <src> <dest>',
        'mv <src> <dest>',
        'tree [path]',
        'grep <query> [path]',
        'user add <@user | id>',
        'user remove <@user | id>',
        'user list'
    ],
    async run(message, args) {
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'user') {
            if (!isAdmin(message.author.id)) {
                return reply(message, 'Command ini hanya dapat digunakan oleh admin.');
            }

            const action = args[1]?.toLowerCase();
            const target = args[2]?.replace(/[<@!>]/g, '');

            if (action === 'add') {
                if (!target) {
                    return reply(message, `Gunakan: \`${PREFIX} vault user add <@user | id>\``);
                }
                await addVaultUser(target, target);
                return reply(message, `User <@${target}> (\`${target}\`) telah ditambahkan ke database vault.`);
            }

            if (action === 'remove' || action === 'rm' || action === 'del') {
                if (!target) {
                    return reply(message, `Gunakan: \`${PREFIX} vault user remove <@user | id>\``);
                }
                await removeVaultUser(target);
                return reply(message, `User <@${target}> (\`${target}\`) telah dihapus dari database vault.`);
            }

            if (action === 'list') {
                const users = await listVaultUsers();
                if (users.length === 0) {
                    return reply(message, 'Belum ada user yang terdaftar di database vault.');
                }
                const list = users.map(u => `• <@${u.userId}> (\`${u.userId}\`) - ${u.nodeCount} node(s)`).join('\n');
                return reply(message, {
                    embeds: [{
                        title: 'Vault Users',
                        description: list,
                        color: 0x5865F2,
                        timestamp: new Date().toISOString()
                    }]
                });
            }

            return reply(message, `Gunakan: \`${PREFIX} vault user add <user>\`, \`remove <user>\`, atau \`list\``);
        }

        const allowed = await isVaultAllowed(message.author.id);
        if (!allowed) {
            return reply(message, 'Anda belum memiliki akses vault /home. Silakan minta admin untuk membuat database anda.');
        }

        if (!subCommand || subCommand === 'help') {
            return reply(message, {
                embeds: [{
                    title: 'Vault Help - Linux Style Notepad & Database',
                    description: `Prefix: \`${PREFIX} vault <command>\`\n\n` +
                        '`mkdir <path>` - Create directory\n' +
                        '`touch <path>` - Create file\n' +
                        '`printf "<text>" >> <path>` - Append text to file\n' +
                        '`printf "<text>" > <path>` - Overwrite text to file\n' +
                        '`curl <url> > <path>` - Download text from URL\n' +
                        '`wget <url> [path]` - Download URL content\n' +
                        '`cat <path>` - Read file content\n' +
                        '`share <path> <@user>` - Share file with user\n' +
                        '`unshare <path> <@user>` - Revoke file share\n' +
                        '`shared` - View shared files\n' +
                        '`df` - View storage quota usage\n' +
                        '`ls [path]` - List files in directory\n' +
                        '`tree [path]` - View directory tree\n' +
                        '`rm <path>` - Delete file or directory\n' +
                        '`cp <src> <dest>` - Copy file\n' +
                        '`mv <src> <dest>` - Move or rename\n' +
                        '`grep <query> [path]` - Search content in files\n\n' +
                        'Contoh:\n' +
                        `\`${PREFIX} vault mkdir /notes\`\n` +
                        `\`${PREFIX} vault touch /notes/todo.txt\`\n` +
                        `\`${PREFIX} vault printf "Line 1\\nLine 2\\n" >> /notes/todo.txt\`\n` +
                        `\`${PREFIX} vault cat /notes/todo.txt\`\n` +
                        `\`${PREFIX} vault curl https://icanhazip.com > /notes/myip.txt\``,
                    color: 0x5865F2,
                    footer: { text: 'Vault personal filesystem' }
                }]
            });
        }

        if (subCommand === 'df' || subCommand === 'quota') {
            const usage = await getUserVaultUsage(message.author.id);
            return reply(message, {
                embeds: [{
                    title: 'Vault Storage Quota',
                    description: `Used: \`${(usage.usedBytes / 1024).toFixed(2)} KB\` / \`${(usage.quotaBytes / 1024).toFixed(2)} KB\` (${usage.percent.toFixed(1)}%)\nAvailable: \`${((usage.quotaBytes - usage.usedBytes) / 1024).toFixed(2)} KB\``,
                    color: usage.percent > 85 ? 0xED4245 : 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (subCommand === 'curl') {
            const rawContent = message.content.slice(PREFIX.length).trim();
            const pattern = new RegExp('^vault\\s+curl\\s+(\\S+)\\s*(>>|>)\\s*(\\S+)$', 's');
            const match = rawContent.match(pattern);

            if (!match) {
                return reply(message, `Gunakan: \`${PREFIX} vault curl <url> > <path>\` atau \`${PREFIX} vault curl <url> >> <path>\``);
            }

            const url = match[1];
            const op = match[2];
            const targetPath = match[3];

            try {
                const res = await fetchUrlToVault(message.author.id, url, targetPath, op === '>>', message.author.username);
                return reply(message, `${op === '>>' ? 'Appended' : 'Saved'} ${res.bytesWritten} bytes from URL to \`${res.path}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'wget') {
            const url = args[1];
            if (!url) {
                return reply(message, `Gunakan: \`${PREFIX} vault wget <url> [path]\``);
            }

            let dest = args[2];
            if (!dest) {
                try {
                    const parsed = new URL(url);
                    const pathEnd = parsed.pathname.split('/').filter(Boolean).pop();
                    dest = pathEnd ? `/${pathEnd}` : '/download.txt';
                } catch {
                    dest = '/download.txt';
                }
            }

            try {
                const res = await fetchUrlToVault(message.author.id, url, dest, false, message.author.username);
                return reply(message, `Downloaded ${res.bytesWritten} bytes to \`${res.path}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'share') {
            const filePath = args[1];
            const targetUser = args[2]?.replace(/[<@!>]/g, '');
            if (!filePath || !targetUser) {
                return reply(message, `Gunakan: \`${PREFIX} vault share <path> <@user | id>\``);
            }

            try {
                const norm = await shareFile(message.author.id, message.author.username, targetUser, filePath);
                return reply(message, `File \`${norm}\` berhasil dibagikan ke <@${targetUser}>.`);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'unshare') {
            const filePath = args[1];
            const targetUser = args[2]?.replace(/[<@!>]/g, '');
            if (!filePath || !targetUser) {
                return reply(message, `Gunakan: \`${PREFIX} vault unshare <path> <@user | id>\``);
            }

            try {
                await unshareFile(message.author.id, targetUser, filePath);
                return reply(message, `Akses file \`${normalizePath(filePath)}\` untuk <@${targetUser}> telah dicabut.`);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'shared') {
            const action = args[1]?.toLowerCase();
            if (action === 'cat') {
                const targetOwner = args[2]?.replace(/[<@!>]/g, '');
                const filePath = args[3];
                if (!targetOwner || !filePath) {
                    return reply(message, `Gunakan: \`${PREFIX} vault shared cat <@user | ownerId> <path>\``);
                }

                try {
                    const file = await readSharedFile(message.author.id, targetOwner, filePath);
                    const ext = file.path.endsWith('.json') ? 'json' : '';
                    return reply(message, `**${file.path}** *(shared by ${file.ownerName})*\n\`\`\`${ext}\n${file.content}\n\`\`\``);
                } catch (err) {
                    return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
                }
            }

            const shared = await listSharedFiles(message.author.id);
            if (shared.length === 0) {
                return reply(message, 'Tidak ada file yang dibagikan kepada anda.');
            }

            const list = shared.map(s => `• \`${s.path}\` (shared by <@${s.ownerId}>)`).join('\n');
            return reply(message, {
                embeds: [{
                    title: 'Files Shared With You',
                    description: `${list}\n\nBaca dengan: \`${PREFIX} vault shared cat <@owner> <path>\``,
                    color: 0x5865F2,
                    timestamp: new Date().toISOString()
                }]
            });
        }

        if (subCommand === 'mkdir') {
            const targetPath = args[1];
            if (!targetPath) {
                return reply(message, `Gunakan: \`${PREFIX} vault mkdir <path>\``);
            }
            try {
                const created = await createDirectory(message.author.id, targetPath, message.author.username);
                return reply(message, `Directory created: \`${created}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'touch') {
            const targetPath = args[1];
            if (!targetPath) {
                return reply(message, `Gunakan: \`${PREFIX} vault touch <path>\``);
            }
            try {
                const result = await touchFile(message.author.id, targetPath, message.author.username);
                return reply(message, `File ${result.created ? 'created' : 'timestamp updated'}: \`${result.path}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'printf' || subCommand === 'echo') {
            const rawContent = message.content.slice(PREFIX.length).trim();
            const pattern = new RegExp('^vault\\s+(?:printf|echo)\\s+(.+?)\\s*(>>|>)\\s*(\\S+)$', 's');
            const match = rawContent.match(pattern);

            if (!match) {
                return reply(message, `Gunakan: \`${PREFIX} vault printf "<content>" >> <path>\` atau \`${PREFIX} vault printf "<content>" > <path>\``);
            }

            const rawText = match[1];
            const op = match[2];
            const targetPath = match[3];

            const parsedContent = unescapeString(rawText);
            const isAppend = op === '>>';

            try {
                const result = await writeToFile(message.author.id, targetPath, parsedContent, isAppend, message.author.username);
                return reply(message, `${isAppend ? 'Appended' : 'Written'} ${result.bytesWritten} bytes to \`${result.path}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'cat') {
            const targetPath = args[1];
            if (!targetPath) {
                return reply(message, `Gunakan: \`${PREFIX} vault cat <path>\` atau \`${PREFIX} vault cat <@user>:<path>\``);
            }

            const sharedMatch = targetPath.match(/^(?:<@!?)?(\d+)>?:(.+)$/);
            if (sharedMatch) {
                const ownerId = sharedMatch[1];
                const filePath = sharedMatch[2];
                try {
                    const file = await readSharedFile(message.author.id, ownerId, filePath);
                    const ext = file.path.endsWith('.json') ? 'json' : '';
                    return reply(message, `**${file.path}** *(shared by ${file.ownerName})*\n\`\`\`${ext}\n${file.content}\n\`\`\``);
                } catch (err) {
                    return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
                }
            }

            try {
                const file = await readFile(message.author.id, targetPath);
                if (!file.content) {
                    return reply(message, `File \`${file.path}\` is empty.`);
                }
                const ext = file.path.endsWith('.json') ? 'json' : '';
                return reply(message, `**${file.path}**\n\`\`\`${ext}\n${file.content}\n\`\`\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'ls') {
            const targetPath = args[1] || '/';
            try {
                const res = await listDirectory(message.author.id, targetPath);
                if (res.entries.length === 0) {
                    return reply(message, `Directory \`${res.currentPath}\` is empty.`);
                }
                const formatted = res.entries.map(e => {
                    if (e.type === 'dir') {
                        return `[DIR]  ${e.name}/`;
                    }
                    return `[FILE] ${e.name} (${e.size} bytes)`;
                }).join('\n');

                return reply(message, `**Directory: ${res.currentPath}**\n\`\`\`\n${formatted}\n\`\`\`\nTotal: ${res.entries.length} item(s)`);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'rm' || subCommand === 'delete') {
            const targetPath = args[1];
            if (!targetPath) {
                return reply(message, `Gunakan: \`${PREFIX} vault rm <path>\``);
            }
            try {
                const removed = await removePath(message.author.id, targetPath);
                return reply(message, `Removed: \`${removed}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'cp' || subCommand === 'copy') {
            const src = args[1];
            const dest = args[2];
            if (!src || !dest) {
                return reply(message, `Gunakan: \`${PREFIX} vault cp <src> <dest>\``);
            }
            try {
                await copyFile(message.author.id, src, dest, message.author.username);
                return reply(message, `Copied \`${normalizePath(src)}\` to \`${normalizePath(dest)}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'mv' || subCommand === 'move') {
            const src = args[1];
            const dest = args[2];
            if (!src || !dest) {
                return reply(message, `Gunakan: \`${PREFIX} vault mv <src> <dest>\``);
            }
            try {
                await movePath(message.author.id, src, dest, message.author.username);
                return reply(message, `Moved \`${normalizePath(src)}\` to \`${normalizePath(dest)}\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'tree') {
            const targetPath = args[1] || '/';
            try {
                const treeOutput = await buildTree(message.author.id, targetPath);
                return reply(message, `\`\`\`\n${treeOutput}\n\`\`\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (subCommand === 'grep') {
            const query = args[1];
            const targetPath = args[2] || '/';
            if (!query) {
                return reply(message, `Gunakan: \`${PREFIX} vault grep <query> [path]\``);
            }
            try {
                const results = await grepFiles(message.author.id, query, targetPath);
                if (results.length === 0) {
                    return reply(message, `No matches found for "${query}" in \`${targetPath}\``);
                }
                const lines = results.slice(0, 15).map(r => `${r.path}:${r.line}: ${r.text}`).join('\n');
                const truncated = results.length > 15 ? `\n...and ${results.length - 15} more matches` : '';
                return reply(message, `**Search matches for "${query}":**\n\`\`\`\n${lines}${truncated}\n\`\`\``);
            } catch (err) {
                return reply(message, `Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        return reply(message, `Unknown vault command: \`${subCommand}\`. Use \`${PREFIX} vault help\`.`);
    }
});
