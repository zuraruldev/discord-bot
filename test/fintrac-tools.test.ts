import assert from 'node:assert';
import test from 'node:test';
import { registerFintracTools } from '../src/tools/fintrac.ts';
import { toolRegistry } from '../src/tools/registry.ts';

registerFintracTools();

test('tool definitions omit fintrac tools for unauthorized users', () => {
    const unauthorizedDefs = toolRegistry.getAllDefinitions({
        isAdmin: false,
        userId: 'unauthorized_user_123'
    });
    const hasScan = unauthorizedDefs.some(t => t.function.name === 'fintrac_scan');
    assert.strictEqual(hasScan, false);
});

test('tool definitions include fintrac tools for admins', () => {
    const adminDefs = toolRegistry.getAllDefinitions({
        isAdmin: true,
        userId: '1256220010859466795'
    });
    const hasScan = adminDefs.some(t => t.function.name === 'fintrac_scan');
    const hasQuote = adminDefs.some(t => t.function.name === 'fintrac_quote');
    const hasStatus = adminDefs.some(t => t.function.name === 'fintrac_status');
    const hasLog = adminDefs.some(t => t.function.name === 'fintrac_log_trade');

    assert.strictEqual(hasScan, true);
    assert.strictEqual(hasQuote, true);
    assert.strictEqual(hasStatus, true);
    assert.strictEqual(hasLog, true);
});

test('fintrac tool execution rejects unauthorized users', async () => {
    const result = await toolRegistry.execute(
        'fintrac_status',
        {},
        {
            userId: 'unauthorized_user_123',
            authorName: 'RandomUser',
            channelId: '123',
            isAdmin: false,
            isCreator: false
        }
    ) as { success: boolean; message: string };

    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes('Akses ditolak'));
});
