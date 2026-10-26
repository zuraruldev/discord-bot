import assert from 'node:assert';
import test from 'node:test';
import { getFintracQuote, getFintracStatus } from '../src/fintrac/bridge.ts';

test('getFintracStatus calls python CLI and returns valid status', async () => {
    const status = await getFintracStatus();
    assert.strictEqual(typeof status.cash, 'number');
    assert.strictEqual(typeof status.total_assets, 'number');
    assert.strictEqual(typeof status.quota_completed, 'boolean');
});

test('getFintracQuote retrieves setup for valid IDX80 ticker', async () => {
    const quote = await getFintracQuote('BBCA');
    assert.strictEqual(quote.success, true);
    assert.ok(quote.ticker?.includes('BBCA'));
    assert.strictEqual(typeof quote.price, 'number');
    assert.strictEqual(typeof quote.tp1, 'number');
    assert.strictEqual(typeof quote.tp2, 'number');
    assert.strictEqual(typeof quote.stop_loss, 'number');
});

test('getFintracQuote returns failure for invalid ticker', async () => {
    const quote = await getFintracQuote('INVALID999');
    assert.strictEqual(quote.success, false);
    assert.ok(quote.error);
});
