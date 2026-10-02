import { Client } from 'oceanic.js';

import { logError } from './utils';

process.loadEnvFile();

export const client = new Client({
    auth: `Bot ${process.env.TOKEN}`,
    gateway: {
        intents: ['ALL'],
        autoReconnect: true,
        connectionTimeout: 30000,
        maxReconnectAttempts: Infinity
    },
    rest: {
        requestTimeout: 30000,
        maxRatelimitRetryWindow: 60000
    }
});

client.setMaxListeners(50);

client.on('error', (err, shard) => {
    console.error(`[Client Error${shard !== undefined ? ` (Shard ${shard})` : ''}]`, err);
    logError(err);
});

client.on('warn', (msg, shard) => {
    console.warn(`[Client Warn${shard !== undefined ? ` (Shard ${shard})` : ''}]`, msg);
});

client.on('shardDisconnect', (err, id) => {
    console.warn(`[Shard ${id}] Disconnected:`, err?.message || 'Unknown reason');
});

client.on('shardResume', (id) => {
    console.log(`[Shard ${id}] Resumed connection`);
});

client.on('shardReady', (id) => {
    console.log(`[Shard ${id}] Ready`);
});

client.on('disconnect', () => {
    console.warn('[Client] All shards disconnected');
});

process.on('unhandledRejection', (reason) => {
    console.error('[Unhandled Rejection]', reason);
    logError(reason);
});

process.on('uncaughtException', (error) => {
    console.error('[Uncaught Exception]', error);
    logError(error);
});

export let ownerID: string;

export function setOwnerID(id: string) {
    ownerID = id;
}
