import { mkdir, readFile, writeFile } from 'fs/promises';
import { Message } from 'oceanic.js';

import { client } from '../Client';
import { IDLEFARM_ID } from '../constants';

const DB_FILE = './data/idle-items.json';
const DB_DIR = './data';

interface IdleItem {
    name: string;
    type?: string;
    price?: number;
    percent?: number;
    pack?: number;
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

async function saveDB(items: IdleItem[]): Promise<void> {
    await ensureDir();
    await writeFile(DB_FILE, JSON.stringify(items, null, 2));
}

client.on('messageCreate', idleMa);
client.on('messageUpdate', idleMa);

async function idleMa(message: Message) {
    if (message.timestamp.getTime() < Date.now() - 120000) return;
    if (message.author.id !== IDLEFARM_ID) return;
    if (!message.embeds[0]?.description?.startsWith('This is the **idle market**')) return;
    if (message.embeds[0].fields?.[0]?.value === 'Raw items of low value') return;

    const { fields } = message.embeds[0];
    if (!fields) return;

    const today0UTC = new Date().setUTCHours(0, 0, 0, 0);
    const db = await loadDB();

    for (const field of fields) {
        const lastUpdate = Date.now();

        if (/ (box|container|ship|spaceship)\*\*/.test(field.name)) {
            const name = field.name.match(/(?<=\*\*).+?(?= (box|container|ship|spaceship)\*\*)/)?.[0];
            if (!name) continue;

            const type = field.name.includes(':box:') ? 'material'
                : field.name.includes(':container:') ? 'refined'
                    : field.name.includes(':ship:') ? 'product'
                        : field.name.includes(':spaceship:') ? 'assembly' : undefined;

            const pack = Number(field.value.match(/(?<=\*\*Price\*\*: )[\d,]+/)?.[0]?.replace(/,/g, ''));

            const existing = db.find(item => item.name === name);
            if (existing) {
                existing.type = type;
                existing.pack = pack;
            } else {
                db.push({ name, type, pack, lastUpdate });
            }
        } else {
            const name = field.name.match(/(?<=\*\*).+?(?=\*\*)/)?.[0];
            if (!name) continue;

            const type = name.endsWith('scythe') ? 'tool' : undefined;
            const note = field.name.match(/⚠️ .+$/)?.[0]?.replace(/(\*\*OUT OF STOCK\*\*: |\*\*OVERSTOCKED\*\*: )/g, '') || '';
            const price = Number(field.value.match(/(?<=\*\*Price\*\*: )[\d,]+/)?.[0]?.replace(/,/g, ''));
            const percent = Number(field.value.match(/(?<=`)[+-]?\d+(?=%`)/)?.[0]);

            const existing = db.find(item => item.name === name);

            if (existing && existing.lastUpdate < today0UTC && existing.percent !== null) {
                existing.type = type;
                existing.price = price;
                existing.percent = percent;
                existing.note = note;
                existing.lastUpdate = lastUpdate;
            } else if (existing) {
                existing.type = type;
                existing.price = price;
                existing.percent = percent;
                existing.note = note;
                existing.lastUpdate = lastUpdate;
            } else {
                db.push({ name, type, price, percent, note, lastUpdate });
            }
        }
    }

    await saveDB(db);
}
