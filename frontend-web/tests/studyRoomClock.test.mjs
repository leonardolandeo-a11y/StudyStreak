import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedTimeRemaining, displayRoomTime } from '../src/services/studyRoomClock.ts';

const room = {
  timerStatus: 'RUNNING', remainingSeconds: 1500,
  serverNow: '2026-11-03T00:00:00Z',
  endsAt: '2026-11-03T00:25:00Z',
};

test('server clock offsets keep the room timer aligned across devices', () => {
  // One device clock is five hours ahead of another; both received the same server snapshot.
  assert.equal(sharedTimeRemaining(room, 100000, 100000), 1500);
  assert.equal(sharedTimeRemaining(room, 100000, 160000), 1440);
  assert.equal(sharedTimeRemaining(room, 9000000, 9060000), 1440);
  assert.equal(sharedTimeRemaining(room, 100000, 2000000), 0);
});

test('paused, finished and invalid timer payloads never become negative', () => {
  assert.equal(sharedTimeRemaining({ ...room, timerStatus: 'PAUSED', remainingSeconds: 280 }, 50, 950000), 280);
  assert.equal(sharedTimeRemaining({ ...room, timerStatus: 'COMPLETE' }, 50, 950000), 0);
  assert.equal(sharedTimeRemaining({ ...room, endsAt: null }, 50, 950000), 1500);
  assert.equal(displayRoomTime(1500), '25:00');
  assert.equal(displayRoomTime(0), '00:00');
  assert.equal(displayRoomTime(-90), '00:00');
});
