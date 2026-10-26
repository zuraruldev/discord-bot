import assert from 'node:assert';
import test from 'node:test';
import { allowFintracUser, getFintracAuthorizedUsers, isFintracAuthorized, revokeFintracUser } from '../src/fintrac/auth.ts';

test('isFintracAuthorized allows admin users', () => {
    // Admin user from constants: '1256220010859466795'
    assert.strictEqual(isFintracAuthorized('1256220010859466795'), true);
});

test('isFintracAuthorized blocks non-authorized users', () => {
    assert.strictEqual(isFintracAuthorized('999999999999999999'), false);
});

test('allowFintracUser and revokeFintracUser manage permissions', () => {
    const testUserId = '888888888888888888';
    assert.strictEqual(isFintracAuthorized(testUserId), false);

    const added = allowFintracUser(testUserId);
    assert.strictEqual(added, true);
    assert.strictEqual(isFintracAuthorized(testUserId), true);
    assert.ok(getFintracAuthorizedUsers().includes(testUserId));

    const revoked = revokeFintracUser(testUserId);
    assert.strictEqual(revoked, true);
    assert.strictEqual(isFintracAuthorized(testUserId), false);
});
