import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedTimeRemaining, displayRoomTime, isNewerRoom } from '../src/services/studyRoomClock.ts';

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

 test('late responses cannot restore an old timer, owner, or another room', () => {
   const current = { ...room, id: 'a', version: 5 };
   assert.equal(isNewerRoom(current, { ...current, version: 4, serverNow: '2026-11-04T00:00:00Z' }), false);
   assert.equal(isNewerRoom(current, { ...current, serverNow: '2026-11-02T00:00:00Z' }), false);
   assert.equal(isNewerRoom(current, { ...current, version: 6 }), true);
   assert.equal(isNewerRoom(current, { ...current, id: 'b', version: 6 }), false);
 });
