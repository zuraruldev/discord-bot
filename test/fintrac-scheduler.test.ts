import assert from 'node:assert';
import test from 'node:test';
import { getWibInfo } from '../src/module/fintrac.ts';

test('getWibInfo calculates Asia/Jakarta WIB date and weekday properly', () => {
    const info = getWibInfo();
    assert.ok(info.dateKey.match(/^\d{4}-\d{2}-\d{2}$/));
    assert.ok(info.timeKey.match(/^\d{2}:\d{2}$/));
    assert.strictEqual(typeof info.isWeekday, 'boolean');
});
