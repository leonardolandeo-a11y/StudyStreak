import test from 'node:test';
import assert from 'node:assert/strict';
import { createFocusSessionId } from '../src/features/focus/focusSessionId.ts';

test('native idempotency keys are valid UUIDv4 and unique across many creations', () => {
  const generated = Array.from({ length: 250 }, () => createFocusSessionId());
  assert.equal(new Set(generated).size, generated.length);
  for (const id of generated) {
    assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  }
});
