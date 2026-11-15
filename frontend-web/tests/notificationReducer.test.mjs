import assert from 'node:assert/strict';
import test from 'node:test';
import { initialNotificationState, notificationReducer } from '../src/reducers/notificationReducer.ts';

const page = { content: [{ id: 7, message: 'Confirmed notification' }], page: 0, size: 20, totalPages: 1, totalElements: 1, empty: false, first: true, last: true };

test('failed background refresh retains confirmed notifications and exposes a warning', () => {
  const loaded = notificationReducer(initialNotificationState, { type: 'LOAD_SUCCESS', payload: page });
  const stale = notificationReducer(loaded, { type: 'REFRESH_ERROR', payload: 'Notifications could not refresh.' });
  assert.equal(stale.notificationPage, page);
  assert.equal(stale.refreshError, 'Notifications could not refresh.');
  assert.equal(stale.error, null);
  const recovered = notificationReducer(stale, { type: 'LOAD_SUCCESS', payload: page });
  assert.equal(recovered.refreshError, null);
});

test('explicit retry clears stale warnings and new load errors remain visible', () => {
  const loaded = notificationReducer(initialNotificationState, { type: 'LOAD_SUCCESS', payload: page });
  const stale = notificationReducer(loaded, { type: 'REFRESH_ERROR', payload: 'Connection unavailable.' });
  const retrying = notificationReducer(stale, { type: 'LOAD_START' });
  assert.equal(retrying.refreshError, null);
  assert.equal(retrying.loading, true);
  assert.equal(notificationReducer(retrying, { type: 'LOAD_ERROR', payload: 'Could not load notifications.' }).error, 'Could not load notifications.');
});
