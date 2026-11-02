import assert from 'node:assert/strict';
import test from 'node:test';
import { recordAccess } from '../src/utils/recordAccess.ts';

test('only owners can edit, independently of the URL', () => {
    assert.equal(recordAccess(12, 12), 'owner');
    assert.equal(recordAccess(12, 55), 'reviewer');
});

test('unknown server ownership fails closed', () => {
    assert.equal(recordAccess(undefined, 12), 'unknown');
    assert.equal(recordAccess(null, 12), 'unknown');
    assert.equal(recordAccess(12, undefined), 'unknown');
    assert.equal(recordAccess(-1, 12), 'unknown');
    assert.equal(recordAccess(2.5, 12), 'unknown');
});
