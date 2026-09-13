import { mkdir, readFile } from 'fs/promises';
import { Message } from 'oceanic.js';

import { client } from '../Client';
import { IDLEFARM_ID } from '../constants';
import { numberFormat, reply } from '../utils';

const DB_FILE = './data/idle-items.json';
const DB_DIR = './data';

interface IdleItem {
    name: string;
    price?: number;
    percent?: number;
    note?: string;
    lastUpdate: number;
}

async function ensureDir(): Promise<void> {
    try {
        await mkdir(DB_DIR, { recursive: true });
    } catch {
        // Directory already exists
    }
}

async function loadDB(): Promise<IdleItem[]> {
    try {
        await ensureDir();
        const content = await readFile(DB_FILE, 'utf-8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

client.on('messageCreate', idleI);
client.on('messageUpdate', idleI);

async function idleI(message: Message) {
    if (message.timestamp.getTime() < Date.now() - 120000) return;
    if (message.author.id !== IDLEFARM_ID) return;
    if (!message.embeds[0]?.author?.name.endsWith(' — inventory')) return;

    const invField = message.embeds[0].fields?.find(field => field.name === '')?.value;
    if (!invField) return;

    const invItems = invField.match(/(?<=\*\*).+?(?=\*\*:)/g);
    if (!invItems) return;

    const today0UTC = new Date().setUTCHours(0, 0, 0, 0);
    const db = await loadDB();

    const outdated = db.filter(item => item.lastUpdate < today0UTC);
    if (outdated.length) {
        return reply(message, {
            embeds: [
                {
                    title: 'Outdated Items',
                    description: outdated.map(item => `• ${item.name}`).join('\n'),
                    color: 0xed4245,
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }

    const idleItems = db
        .filter(item => invItems.includes(item.name))
        .sort((a, b) => (b.percent || 0) - (a.percent || 0));

    if (!idleItems.length) return;

    try {
        let pageName = message.embeds[0].fields?.[0]?.name ?? '';

        pageName = pageName
            .replace(/<a?:\w+:\d+>/g, '')
            .replace(/:[a-zA-Z0-9_]+:/g, '')
            .trim();

        let regex: RegExp;
        if (pageName.startsWith('⚠️ Debt items')) {
            regex = /(?<=\*\*.+?\*\*: -)[\d,]+/g;
        } else {
            regex = /(?<=\*\*.+?\*\*: )[\d,]+/g;
        }

        const invAmounts = invField.match(regex)?.map(a => Number(a.replace(/,/g, '')));
        if (!invAmounts) return;

        const itemWorths = invAmounts.map((amount, i) => {
            const price = idleItems.find(item => item.name === invItems[i])?.price;
            return amount * (price || 0);
        });

        const totalValue = itemWorths.reduce((acc, v) => acc + v, 0);
        let totalLine: string;

        if (pageName.startsWith('⚠️ Debt items')) {
            totalLine = `**Total debt:** ${numberFormat(totalValue)}`;
        } else {
            const afterTax = Math.floor(totalValue * 0.8);
            totalLine = `**Total worth:** ${numberFormat(afterTax)} *(after 20% tax)*`;
        }

        const longestWorth = Math.max(...itemWorths.map(w => numberFormat(w).length));

        const fields = idleItems.map(item => {
            const index = invItems.indexOf(item.name);
            if (index === -1) return null;

            const worth = itemWorths[index];
            const paddedWorth = numberFormat(worth).padStart(longestWorth, ' ');
            const note = item.note ? `${paddedWorth}  ${item.note}` : paddedWorth;

            return {
                name: item.name,
                value: note,
                inline: true
            };
        }).filter(Boolean) as { name: string; value: string; inline: boolean }[];

        await reply(message, {
            embeds: [
                {
                    title: pageName || 'Idle Inventory',
                    description: totalLine,
                    color: 0x57f287,
                    fields,
                    timestamp: new Date().toISOString()
                }
            ]
        });
    } catch (error) {
        if (!(error instanceof Error)) return;
        await reply(message, {
            embeds: [
                {
                    title: 'Error',
                    description: error.message,
                    color: 0xed4245,
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }
}
