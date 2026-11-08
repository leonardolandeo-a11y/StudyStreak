import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeProfileName, profileImageError, profileTextError, unicodeLength, PROFILE_LIMITS } from '../src/utils/profileValidation.ts';

test('profile text uses Unicode characters, optional fields and plain text', () => {
  assert.equal(unicodeLength('María 李 😀'), 9);
  assert.equal(profileTextError('  María 李 😀  ', '<b>Text only</b>\nStudy'), null);
  assert.equal(profileTextError('', ''), null);
  assert.equal(normalizeProfileName('\u001c\u00a0María 李\u202f\u001f'), 'María 李');
  assert.equal(profileTextError('\u001cName\u001f', ''), null);
  assert.equal(profileTextError('😀'.repeat(60), '😀'.repeat(300)), null);
  assert.match(profileTextError('😀'.repeat(61), ''), /60/);
  assert.match(profileTextError('', '😀'.repeat(301)), /300/);
  for (const value of ['bad\u0000', 'bad\ud800', 'bad\u0085', 'bad\u2028name']) assert.ok(profileTextError(value, ''));
  for (const value of ['bad\u0000', 'bad\udfff', 'bad\u001b']) assert.ok(profileTextError('', value));
});
test('profile file selection matches allowed types and exact upload limits', () => {
  for (const slot of ['avatar', 'banner']) {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      assert.equal(profileImageError(slot, { type, size: PROFILE_LIMITS[slot] }), null);
      assert.ok(profileImageError(slot, { type, size: PROFILE_LIMITS[slot] + 1 }));
    }
    assert.ok(profileImageError(slot, { type: 'image/svg+xml', size: 100 }));
    assert.ok(profileImageError(slot, { type: 'text/html', size: 100 }));
    assert.ok(profileImageError(slot, { type: 'image/png', size: 0 }));
  }
});
