import test from 'node:test';
import assert from 'node:assert/strict';
import { validationLookupState } from '../src/utils/validationAccess.ts';

test('404 means no review exists yet', () => {
    assert.equal(validationLookupState(404), 'create');
});
test('403 blocks an unauthorized editor', () => {
    assert.equal(validationLookupState(403), 'blocked');
});
test('401 and server failures must not open the editor', () => {
    assert.equal(validationLookupState(401), 'retry');
    assert.equal(validationLookupState(500), 'retry');
});
test('network errors must not open the editor', () => {
    assert.equal(validationLookupState(), 'retry');
});
