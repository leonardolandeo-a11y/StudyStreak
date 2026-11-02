import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackPage, recoverPageParams } from '../src/utils/pageBounds.ts';

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


test('recovers all invalid tracking lists in one URL update', () => {
    const before = new URLSearchParams('page=7&pendingPage=4&activePage=9&tab=connections');
    const after = recoverPageParams(before, [
        { key: 'page', current: 7, totalPages: 4 },
        { key: 'pendingPage', current: 4, totalPages: 0 },
        { key: 'activePage', current: 9, totalPages: 2 }
    ]);
    assert.equal(after?.toString(), 'page=3&activePage=1&tab=connections');
    assert.equal(before.get('page'), '7');
});

test('leaves valid tracking pages untouched without navigation', () => {
    const after = recoverPageParams(new URLSearchParams('page=1&pendingPage=0'), [
        { key: 'page', current: 1, totalPages: 3 },
        { key: 'pendingPage', current: 0, totalPages: 0 }
    ]);
    assert.equal(after, null);
});

test('returns a deleted list to the first page', () => {
    const after = recoverPageParams(new URLSearchParams('pendingPage=10'), [
        { key: 'pendingPage', current: 10, totalPages: 1 }
    ]);
    assert.equal(after?.has('pendingPage'), false);
});

test('preserves unrelated filters while recovering a single list', () => {
    const after = recoverPageParams(new URLSearchParams('filter=unread&page=5'), [
        { key: 'page', current: 5, totalPages: 2 }
    ]);
    assert.equal(after?.get('filter'), 'unread');
    assert.equal(after?.get('page'), '1');
});

test('stays stable after a tracking URL has been recovered', () => {
    const after = recoverPageParams(new URLSearchParams('page=3'), [
        { key: 'page', current: 3, totalPages: 4 }
    ]);
    assert.equal(after, null);
});
