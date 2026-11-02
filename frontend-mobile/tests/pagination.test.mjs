import test from 'node:test';
import assert from 'node:assert/strict';
import { getPageFallback } from '../src/utils/pageBounds.ts';

test('keeps a valid first page', () => {
  assert.equal(getPageFallback(0, 0), null);
  assert.equal(getPageFallback(0, 3), null);
});

test('keeps an existing middle or last page', () => {
  assert.equal(getPageFallback(1, 3), null);
  assert.equal(getPageFallback(2, 3), null);
});

test('returns to the last page when the current page was deleted', () => {
  assert.equal(getPageFallback(3, 3), 2);
  assert.equal(getPageFallback(4, 3), 2);
});

test('returns to the first page when all records were deleted', () => {
  assert.equal(getPageFallback(1, 0), 0);
  assert.equal(getPageFallback(4, 0), 0);
});

test('avoids a second redirect after reaching the fallback page', () => {
  const fallback = getPageFallback(3, 2);
  assert.equal(fallback, 1);
  assert.equal(getPageFallback(fallback, 2), null);
});
