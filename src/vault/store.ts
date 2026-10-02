import { mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from 'fs/promises';

import { isAdmin } from '../constants';
import type { DirEntry, UserVault, VaultDb, VaultNode } from './types';

const VAULT_FILE = './data/vault.json';
const DATA_DIR = './data';

let cachedDb: VaultDb | null = null;

async function ensureDir(): Promise<void> {
    try {
        await fsMkdir(DATA_DIR, { recursive: true });
    } catch {
        return;
    }
}

export async function loadVaultDb(): Promise<VaultDb> {
    if (cachedDb) return cachedDb;
    await ensureDir();
    try {
        const raw = await fsReadFile(VAULT_FILE, 'utf-8');
        cachedDb = JSON.parse(raw);
        return cachedDb!;
    } catch {
        cachedDb = {
            allowedUsers: [],
            users: {}
        };
        return cachedDb;
    }
}

export async function saveVaultDb(db: VaultDb): Promise<void> {
    cachedDb = db;
    await ensureDir();
    await fsWriteFile(VAULT_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export async function isVaultAllowed(userId: string): Promise<boolean> {
    if (isAdmin(userId)) return true;
    const db = await loadVaultDb();
    return db.allowedUsers.includes(userId);
}

export async function addVaultUser(userId: string, username: string): Promise<boolean> {
    const db = await loadVaultDb();
    if (!db.allowedUsers.includes(userId)) {
        db.allowedUsers.push(userId);
    }
    if (!db.users[userId]) {
        db.users[userId] = {
            userId,
            username,
            createdAt: Date.now(),
            nodes: {
                '/': {
                    type: 'dir',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
            }
        };
    }
    await saveVaultDb(db);
    return true;
}

export async function removeVaultUser(userId: string): Promise<boolean> {
    const db = await loadVaultDb();
    const index = db.allowedUsers.indexOf(userId);
    if (index !== -1) {
        db.allowedUsers.splice(index, 1);
    }
    delete db.users[userId];
    await saveVaultDb(db);
    return true;
}

export async function listVaultUsers(): Promise<{ userId: string; username: string; nodeCount: number }[]> {
    const db = await loadVaultDb();
    return db.allowedUsers.map(id => {
        const user = db.users[id];
        return {
            userId: id,
            username: user?.username || 'Unknown',
            nodeCount: user ? Object.keys(user.nodes).length : 0
        };
    });
}

export function normalizePath(inputPath: string): string {
    const trimmed = inputPath.trim();
    if (!trimmed || trimmed === '/') return '/';

    const segments = trimmed.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const segment of segments) {
        if (segment === '.') continue;
        if (segment === '..') {
            if (resolved.length > 0) resolved.pop();
        } else {
            resolved.push(segment);
        }
    }

    return '/' + resolved.join('/');
}

function getParentPath(normalizedPath: string): string {
    if (normalizedPath === '/') return '/';
    const idx = normalizedPath.lastIndexOf('/');
    if (idx <= 0) return '/';
    return normalizedPath.slice(0, idx);
}

function getBaseName(normalizedPath: string): string {
    if (normalizedPath === '/') return '/';
    const idx = normalizedPath.lastIndexOf('/');
    return normalizedPath.slice(idx + 1);
}

export async function getOrCreateUserVault(userId: string, username = 'User'): Promise<UserVault> {
    const db = await loadVaultDb();
    if (!db.users[userId]) {
        db.users[userId] = {
            userId,
            username,
            createdAt: Date.now(),
            nodes: {
                '/': {
                    type: 'dir',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
            }
        };
        await saveVaultDb(db);
    }
    return db.users[userId];
}

export async function createDirectory(userId: string, targetPath: string, username = 'User'): Promise<string> {
    const normalized = normalizePath(targetPath);
    if (normalized === '/') {
        return '/';
    }

    const db = await loadVaultDb();
    const vault = await getOrCreateUserVault(userId, username);

    const segments = normalized.split('/').filter(Boolean);
    let current = '';

    for (const segment of segments) {
        current += '/' + segment;
        const existing = vault.nodes[current];
        if (existing) {
            if (existing.type === 'file') {
                throw new Error(`Cannot create directory: path ${current} is a file`);
            }
        } else {
            vault.nodes[current] = {
                type: 'dir',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        }
    }

    await saveVaultDb(db);
    return normalized;
}

export async function touchFile(userId: string, targetPath: string, username = 'User'): Promise<{ path: string; created: boolean }> {
    const normalized = normalizePath(targetPath);
    if (normalized === '/') {
        throw new Error('Cannot touch root directory /');
    }

    const parent = getParentPath(normalized);
    if (parent !== '/') {
        await createDirectory(userId, parent, username);
    }

    const db = await loadVaultDb();
    const vault = await getOrCreateUserVault(userId, username);

    const existing = vault.nodes[normalized];
    if (existing) {
        if (existing.type === 'dir') {
            throw new Error(`Cannot touch: ${normalized} is a directory`);
        }
        existing.updatedAt = Date.now();
        await saveVaultDb(db);
        return { path: normalized, created: false };
    }

    vault.nodes[normalized] = {
        type: 'file',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    await saveVaultDb(db);
    return { path: normalized, created: true };
}

export const MAX_USER_QUOTA_BYTES = 1024 * 1024;

export async function getUserVaultUsage(userId: string): Promise<{ usedBytes: number; quotaBytes: number; percent: number }> {
    const db = await loadVaultDb();
    const vault = db.users[userId];
    if (!vault) {
        return { usedBytes: 0, quotaBytes: MAX_USER_QUOTA_BYTES, percent: 0 };
    }

    let usedBytes = 0;
    for (const node of Object.values(vault.nodes)) {
        if (node.type === 'file') {
            usedBytes += Buffer.byteLength(node.content, 'utf-8');
        }
    }

    return {
        usedBytes,
        quotaBytes: MAX_USER_QUOTA_BYTES,
        percent: Math.min(100, (usedBytes / MAX_USER_QUOTA_BYTES) * 100)
    };
}

export async function writeToFile(userId: string, targetPath: string, content: string, append: boolean, username = 'User'): Promise<{ path: string; bytesWritten: number }> {
    const normalized = normalizePath(targetPath);
    if (normalized === '/') {
        throw new Error('Cannot write to root directory /');
    }

    const parent = getParentPath(normalized);
    if (parent !== '/') {
        await createDirectory(userId, parent, username);
    }

    const db = await loadVaultDb();
    const vault = await getOrCreateUserVault(userId, username);

    const existing = vault.nodes[normalized];
    if (existing && existing.type === 'dir') {
        throw new Error(`Cannot write to ${normalized}: path is a directory`);
    }

    let finalContent = content;
    if (existing && append) {
        finalContent = existing.content + content;
    }

    const currentUsage = await getUserVaultUsage(userId);
    const existingBytes = (existing && existing.type === 'file') ? Buffer.byteLength(existing.content, 'utf-8') : 0;
    const newBytes = Buffer.byteLength(finalContent, 'utf-8');
    const projectedBytes = currentUsage.usedBytes - existingBytes + newBytes;

    if (projectedBytes > MAX_USER_QUOTA_BYTES) {
        throw new Error(`Storage quota exceeded: ${projectedBytes} / ${MAX_USER_QUOTA_BYTES} bytes (Max 1 MB)`);
    }

    vault.nodes[normalized] = {
        type: 'file',
        content: finalContent,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now()
    };

    await saveVaultDb(db);
    return { path: normalized, bytesWritten: Buffer.byteLength(content, 'utf-8') };
}

export async function readFile(userId: string, targetPath: string): Promise<{ path: string; content: string; updatedAt: number }> {
    const normalized = normalizePath(targetPath);
    const db = await loadVaultDb();
    const vault = db.users[userId];
    if (!vault) {
        throw new Error(`No such file or directory: ${normalized}`);
    }

    const node = vault.nodes[normalized];
    if (!node) {
        throw new Error(`No such file or directory: ${normalized}`);
    }
    if (node.type === 'dir') {
        throw new Error(`Cannot read ${normalized}: path is a directory (use ls instead)`);
    }

    return { path: normalized, content: node.content, updatedAt: node.updatedAt };
}

export async function listDirectory(userId: string, targetPath = '/'): Promise<{ currentPath: string; entries: DirEntry[] }> {
    const normalized = normalizePath(targetPath);
    const db = await loadVaultDb();
    const vault = db.users[userId];
    if (!vault) {
        return { currentPath: normalized, entries: [] };
    }

    const targetNode = vault.nodes[normalized];
    if (!targetNode && normalized !== '/') {
        throw new Error(`No such directory: ${normalized}`);
    }
    if (targetNode && targetNode.type === 'file') {
        return {
            currentPath: normalized,
            entries: [{
                name: getBaseName(normalized),
                path: normalized,
                type: 'file',
                size: Buffer.byteLength(targetNode.content, 'utf-8'),
                updatedAt: targetNode.updatedAt
            }]
        };
    }

    const prefix = normalized === '/' ? '/' : normalized + '/';
    const entriesMap = new Map<string, DirEntry>();

    for (const [nodePath, node] of Object.entries(vault.nodes)) {
        if (nodePath === normalized || nodePath === '/') continue;

        if (normalized === '/' && nodePath.startsWith('/')) {
            const rel = nodePath.slice(1);
            const firstSlash = rel.indexOf('/');
            const directChildName = firstSlash === -1 ? rel : rel.slice(0, firstSlash);
            const directChildPath = '/' + directChildName;

            if (!entriesMap.has(directChildName)) {
                const isDir = firstSlash !== -1 || node.type === 'dir';
                entriesMap.set(directChildName, {
                    name: directChildName,
                    path: directChildPath,
                    type: isDir ? 'dir' : 'file',
                    size: (!isDir && node.type === 'file') ? Buffer.byteLength(node.content, 'utf-8') : 0,
                    updatedAt: node.updatedAt
                });
            }
        } else if (nodePath.startsWith(prefix)) {
            const rel = nodePath.slice(prefix.length);
            const firstSlash = rel.indexOf('/');
            const directChildName = firstSlash === -1 ? rel : rel.slice(0, firstSlash);
            const directChildPath = prefix + directChildName;

            if (!entriesMap.has(directChildName)) {
                const isDir = firstSlash !== -1 || node.type === 'dir';
                entriesMap.set(directChildName, {
                    name: directChildName,
                    path: directChildPath,
                    type: isDir ? 'dir' : 'file',
                    size: (!isDir && node.type === 'file') ? Buffer.byteLength(node.content, 'utf-8') : 0,
                    updatedAt: node.updatedAt
                });
            }
        }
    }

    const entries = Array.from(entriesMap.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return { currentPath: normalized, entries };
}

export async function removePath(userId: string, targetPath: string): Promise<string> {
    const normalized = normalizePath(targetPath);
    if (normalized === '/') {
        throw new Error('Cannot delete root directory /');
    }

    const db = await loadVaultDb();
    const vault = db.users[userId];
    if (!vault) {
        throw new Error(`Path does not exist: ${normalized}`);
    }

    const prefix = normalized + '/';
    let removedCount = 0;

    for (const nodePath of Object.keys(vault.nodes)) {
        if (nodePath === normalized || nodePath.startsWith(prefix)) {
            delete vault.nodes[nodePath];
            removedCount++;
        }
    }

    if (removedCount === 0) {
        throw new Error(`Path does not exist: ${normalized}`);
    }

    await saveVaultDb(db);
    return normalized;
}

export async function copyFile(userId: string, srcPath: string, destPath: string, username = 'User'): Promise<void> {
    const normSrc = normalizePath(srcPath);
    const normDest = normalizePath(destPath);

    const file = await readFile(userId, normSrc);
    await writeToFile(userId, normDest, file.content, false, username);
}

export async function movePath(userId: string, srcPath: string, destPath: string, username = 'User'): Promise<void> {
    const normSrc = normalizePath(srcPath);
    let normDest = normalizePath(destPath);

    if (normSrc === '/' || normDest === '/') {
        throw new Error('Cannot move or overwrite root directory /');
    }

    const db = await loadVaultDb();
    const vault = await getOrCreateUserVault(userId, username);

    const destNode = vault.nodes[normDest];
    if (destNode && destNode.type === 'dir') {
        normDest = normalizePath(`${normDest}/${getBaseName(normSrc)}`);
    }

    const srcNode = vault.nodes[normSrc];
    if (!srcNode) {
        throw new Error(`Source does not exist: ${normSrc}`);
    }

    if (srcNode.type === 'file') {
        vault.nodes[normDest] = {
            ...srcNode,
            updatedAt: Date.now()
        };
        delete vault.nodes[normSrc];
    } else {
        const prefix = normSrc + '/';
        const toMove: [string, VaultNode][] = [];

        for (const [nodePath, node] of Object.entries(vault.nodes)) {
            if (nodePath === normSrc || nodePath.startsWith(prefix)) {
                toMove.push([nodePath, node]);
            }
        }

        for (const [oldPath, node] of toMove) {
            delete vault.nodes[oldPath];
            const newPath = oldPath === normSrc
                ? normDest
                : normDest + oldPath.slice(normSrc.length);
            vault.nodes[newPath] = {
                ...node,
                updatedAt: Date.now()
            };
        }
    }

    await saveVaultDb(db);
}

export async function buildTree(userId: string, targetPath = '/'): Promise<string> {
    const normalized = normalizePath(targetPath);
    const db = await loadVaultDb();
    const vault = db.users[userId];
    if (!vault || Object.keys(vault.nodes).length <= 1) {
        return `${normalized} (empty vault)`;
    }

    const paths = Object.keys(vault.nodes)
        .filter(p => p !== '/' && (normalized === '/' || p === normalized || p.startsWith(normalized + '/')))
        .sort();

    if (paths.length === 0) {
        return `${normalized} (empty)`;
    }

    const lines: string[] = [normalized];

    const hierarchy: Record<string, string[]> = {};
    for (const p of paths) {
        const parent = getParentPath(p);
        if (!hierarchy[parent]) hierarchy[parent] = [];
        hierarchy[parent].push(p);
    }

    function renderNode(parent: string, prefix: string) {
        const children = hierarchy[parent] || [];
        children.forEach((childPath, idx) => {
            const isLast = idx === children.length - 1;
            const marker = isLast ? '└── ' : '├── ';
            const base = getBaseName(childPath);
            const isDir = vault!.nodes[childPath]?.type === 'dir';
            lines.push(`${prefix}${marker}${base}${isDir ? '/' : ''}`);
            const childPrefix = prefix + (isLast ? '    ' : '│   ');
            if (isDir) {
                renderNode(childPath, childPrefix);
            }
        });
    }

    renderNode(normalized === '/' ? '/' : getParentPath(normalized), '');
    return lines.join('\n');
}

export async function grepFiles(userId: string, query: string, targetPath = '/'): Promise<{ path: string; line: number; text: string }[]> {
    const normalized = normalizePath(targetPath);
    const db = await loadVaultDb();
    const vault = db.users[userId];
    if (!vault) return [];

    const results: { path: string; line: number; text: string }[] = [];
    const prefix = normalized === '/' ? '/' : normalized + '/';

    for (const [nodePath, node] of Object.entries(vault.nodes)) {
        if (node.type !== 'file') continue;
        if (normalized !== '/' && nodePath !== normalized && !nodePath.startsWith(prefix)) continue;

        const lines = node.content.split('\n');
        lines.forEach((lineText, idx) => {
            if (lineText.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    path: nodePath,
                    line: idx + 1,
                    text: lineText
                });
            }
        });
    }

    return results;
}

export async function shareFile(ownerId: string, ownerName: string, targetId: string, targetPath: string): Promise<string> {
    const normalized = normalizePath(targetPath);
    const db = await loadVaultDb();
    const vault = db.users[ownerId];
    if (!vault) throw new Error('Vault not initialized');

    const node = vault.nodes[normalized];
    if (!node || node.type !== 'file') {
        throw new Error(`Cannot share: ${normalized} is not a valid file`);
    }

    if (!node.sharedWith) node.sharedWith = [];
    if (!node.sharedWith.includes(targetId)) {
        node.sharedWith.push(targetId);
    }

    if (!db.shares) db.shares = {};
    if (!db.shares[targetId]) db.shares[targetId] = [];

    const existingIdx = db.shares[targetId].findIndex(s => s.ownerId === ownerId && s.path === normalized);
    if (existingIdx === -1) {
        db.shares[targetId].push({
            ownerId,
            ownerName,
            path: normalized,
            sharedAt: Date.now()
        });
    }

    await saveVaultDb(db);
    return normalized;
}

export async function unshareFile(ownerId: string, targetId: string, targetPath: string): Promise<void> {
    const normalized = normalizePath(targetPath);
    const db = await loadVaultDb();
    const vault = db.users[ownerId];
    if (vault && vault.nodes[normalized] && vault.nodes[normalized].type === 'file') {
        const fileNode = vault.nodes[normalized];
        if (fileNode.sharedWith) {
            fileNode.sharedWith = fileNode.sharedWith.filter(id => id !== targetId);
        }
    }

    if (db.shares && db.shares[targetId]) {
        db.shares[targetId] = db.shares[targetId].filter(s => !(s.ownerId === ownerId && s.path === normalized));
    }

    await saveVaultDb(db);
}

export async function listSharedFiles(targetId: string): Promise<{ ownerId: string; ownerName: string; path: string; sharedAt: number }[]> {
    const db = await loadVaultDb();
    return db.shares?.[targetId] || [];
}

export async function readSharedFile(viewerId: string, ownerId: string, targetPath: string): Promise<{ path: string; content: string; ownerName: string }> {
    const normalized = normalizePath(targetPath);
    const db = await loadVaultDb();
    const ownerVault = db.users[ownerId];
    if (!ownerVault) throw new Error(`Owner vault not found for user ${ownerId}`);

    const node = ownerVault.nodes[normalized];
    if (!node || node.type !== 'file') {
        throw new Error(`Shared file not found: ${normalized}`);
    }

    if (!node.sharedWith?.includes(viewerId) && !isAdmin(viewerId)) {
        throw new Error('You do not have permission to view this shared file');
    }

    return {
        path: normalized,
        content: node.content,
        ownerName: ownerVault.username
    };
}

export async function fetchUrlToVault(
    userId: string,
    url: string,
    targetPath: string,
    append: boolean,
    username = 'User'
): Promise<{ path: string; bytesWritten: number }> {
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error(`Invalid URL: ${url}`);
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    const res = await fetch(parsedUrl.toString(), {
        signal: AbortSignal.timeout(10000),
        headers: {
            'User-Agent': 'DiscordBot-Vault/1.0'
        }
    });

    if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    if (text.length > 200000) {
        throw new Error('Fetched content exceeds 200 KB limit');
    }

    return await writeToFile(userId, targetPath, text, append, username);
}
