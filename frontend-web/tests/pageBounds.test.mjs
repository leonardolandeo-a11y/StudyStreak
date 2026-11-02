import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackPage } from '../src/utils/pageBounds.ts';

test('keeps the first page even when the list is empty', () => {
    assert.equal(fallbackPage(0, 0), null);
});
test('keeps existing pages', () => {
    assert.equal(fallbackPage(1, 5), null);
    assert.equal(fallbackPage(4, 5), null);
});
test('returns to the last available page after deletion', () => {
    assert.equal(fallbackPage(4, 3), 2);
});
test('returns to page zero when every record was deleted', () => {
    assert.equal(fallbackPage(2, 0), 0);
});
test('does not keep redirecting after recovery', () => {
    const fallback = fallbackPage(7, 2);
    assert.equal(fallback, 1);
    assert.equal(fallbackPage(fallback, 2), null);
});
