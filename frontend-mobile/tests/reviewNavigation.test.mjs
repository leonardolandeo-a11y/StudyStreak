import test from 'node:test';
import assert from 'node:assert/strict';
import { validationLookupState, reviewedRecordExit } from '../src/utils/reviewNavigation.ts';

test('missing validation (404) allows a new review', () => {
  assert.equal(validationLookupState(404), 'missing');
});

test('forbidden validation (403) blocks editing another reviewer decision', () => {
  assert.equal(validationLookupState(403), 'forbidden');
});

test('unauthorized and server errors do not allow unverified editing', () => {
  assert.equal(validationLookupState(401), 'unavailable');
  assert.equal(validationLookupState(500), 'unavailable');
});

test('network failures do not present the editor as an empty review', () => {
  assert.equal(validationLookupState(undefined), 'unavailable');
});

test('partner record notification returns to partner validations', () => {
  assert.equal(reviewedRecordExit(true), 'validations');
});

test('personal record keeps navigation to own goal details', () => {
  assert.equal(reviewedRecordExit(false), 'goal');
});
