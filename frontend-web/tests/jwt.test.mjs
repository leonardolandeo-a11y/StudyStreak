import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserFromToken } from '../src/utils/jwt.ts';

function token(claims) {
    return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
}

const valid = () => ({
    type: 'access', exp: Math.floor(Date.now() / 1000) + 3600,
    userId: 11, sub: 'student', email: 'student@example.invalid', role: 'USER',
});

test('accepts a current access JWT for UI identity', () => {
    assert.deepEqual(getUserFromToken(token(valid())), {
        id: 11, username: 'student', email: 'student@example.invalid', role: 'USER',
    });
});

test('rejects expired and nearly expired JWTs', () => {
    assert.equal(getUserFromToken(token({ ...valid(), exp: Math.floor(Date.now() / 1000) - 10 })), null);
    assert.equal(getUserFromToken(token({ ...valid(), exp: Math.floor(Date.now() / 1000) + 5 })), null);
});

test('rejects refresh JWTs as access tokens', () => {
    assert.equal(getUserFromToken(token({ ...valid(), type: 'refresh' })), null);
});

test('rejects missing or invalid claims', () => {
    assert.equal(getUserFromToken(token({ ...valid(), userId: '11' })), null);
    assert.equal(getUserFromToken(token({ ...valid(), role: 'OWNER' })), null);
    assert.equal(getUserFromToken(token({ ...valid(), exp: '2099' })), null);
    assert.equal(getUserFromToken(token({ ...valid(), sub: null })), null);
});

test('rejects malformed tokens', () => {
    assert.equal(getUserFromToken('broken'), null);
    assert.equal(getUserFromToken('head.!!!!.sig'), null);
});
