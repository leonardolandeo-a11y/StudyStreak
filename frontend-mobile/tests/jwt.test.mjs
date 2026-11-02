import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserFromToken } from '../src/utils/jwt.ts';

function token(claims) {
  return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
}

const valid = () => ({
  type: 'access', exp: Math.floor(Date.now() / 1000) + 3600,
  userId: 10, sub: 'student', email: 'student@example.invalid', role: 'USER',
});

test('accepts an unexpired access token for display state', () => {
  assert.deepEqual(getUserFromToken(token(valid())), {
    id: 10, username: 'student', email: 'student@example.invalid', role: 'USER',
  });
});

test('rejects expired and nearly expired access tokens', () => {
  assert.equal(getUserFromToken(token({ ...valid(), exp: Math.floor(Date.now() / 1000) - 10 })), null);
  assert.equal(getUserFromToken(token({ ...valid(), exp: Math.floor(Date.now() / 1000) + 5 })), null);
});

test('rejects refresh tokens as access tokens', () => {
  assert.equal(getUserFromToken(token({ ...valid(), type: 'refresh' })), null);
});

test('rejects malformed tokens and invalid identity', () => {
  assert.equal(getUserFromToken('not-a-jwt'), null);
  assert.equal(getUserFromToken(token({ ...valid(), userId: 0 })), null);
  assert.equal(getUserFromToken(token({ ...valid(), role: 'UNKNOWN' })), null);
  assert.equal(getUserFromToken(token({ ...valid(), email: null })), null);
});
