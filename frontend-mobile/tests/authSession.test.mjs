import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isSessionRejection,
  subscribeToSessionExpiration,
  notifySessionExpired,
} from '../src/services/authSession.ts';

test('recognizes explicit refresh rejection statuses', () => {
  assert.equal(isSessionRejection(400), true);
  assert.equal(isSessionRejection(401), true);
  assert.equal(isSessionRejection(403), true);
});

test('does not expire a session for network errors or server failures', () => {
  for (const status of [undefined, 0, 408, 429, 500, 503]) {
    assert.equal(isSessionRejection(status), false);
  }
});

test('notifies authenticated listeners and respects unsubscribe', () => {
  let hits = 0;
  const unsubscribe = subscribeToSessionExpiration(() => { hits += 1; });
  notifySessionExpired();
  unsubscribe();
  notifySessionExpired();
  assert.equal(hits, 1);
});

test('supports independent listeners', () => {
  const hits = [];
  const stopFirst = subscribeToSessionExpiration(() => hits.push('first'));
  const stopSecond = subscribeToSessionExpiration(() => hits.push('second'));
  notifySessionExpired();
  stopFirst();
  stopSecond();
  assert.deepEqual(hits, ['first', 'second']);
});
