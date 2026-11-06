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

import { recoverTrackedTimer, mergePending } from '../src/services/studyTrackingState.ts';
test('server session recovery survives serialized app state and device clock skew', () => {
 const previous = { preferences: { focusMinutes: 25 }, pendingFocusSessions: [] };
 const row = { id: 'session', goal_id: 7, planned_seconds: 300, observed_ms: 60000, ends_at: '2026-11-03T00:04:00Z', state: 'RUNNING' };
 const recovered = recoverTrackedTimer(JSON.parse(JSON.stringify(previous)), row, '2026-11-03T00:00:00Z', 1000);
 assert.equal(recovered.endsAt, 241000);
 assert.equal(recovered.activeFocusSession.sessionId, 'session');
 assert.equal(recovered.remainingMs, 240000);
 assert.equal(recoverTrackedTimer(previous, { ...row, state:'PAUSED', ends_at:null }, '2026-11-03T00:00:00Z',1000).endsAt,null);
});
test('outbox reload merges UUIDs once and does not restart a queued completion', () => {
 const item = { sessionId:'session',goalId:7,durationMinutes:5 };
 const pending = mergePending([item],JSON.parse(JSON.stringify([item])));
 assert.equal(pending.length,1);
 const previous = { preferences:{focusMinutes:5}, pendingFocusSessions:pending };
 assert.equal(recoverTrackedTimer(previous,{id:'session'},'2026-11-03T00:00:00Z'),previous);
});

import { createStudyOutbox } from '../src/services/studyOutbox.ts';
import { mkdtemp, readdir, readFile, writeFile, unlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('durable outbox survives restart, disconnect and simultaneous sessions without losing another account', async () => {
 const folder = await mkdtemp(join(tmpdir(), 'study-outbox-'));
 const disk = { keys:()=>readdir(folder), read:key=>readFile(join(folder,key),'utf8'), write:(key,value)=>writeFile(join(folder,key),value), remove:key=>unlink(join(folder,key)) };
 try {
  const first=createStudyOutbox(disk);
  const a={sessionId:'a963d0e1-a442-4c37-909f-a0415b903212',goalId:7,durationMinutes:5};
  const b={...a,sessionId:'b963d0e1-a442-4c37-909f-a0415b903212'};
  await Promise.all([first.save(1,a),first.save(1,b),first.save(2,a)]);
  // A new application instance reads disk; no network acknowledgment has occurred.
  const restarted=createStudyOutbox(disk);
  assert.equal((await restarted.read(1)).length,2);
  await restarted.save(1,a);assert.equal((await restarted.read(1)).length,2);
  await restarted.remove(1,a.sessionId);
  assert.deepEqual(await restarted.read(1),[b]);
  assert.deepEqual(await restarted.read(2),[a]);
 } finally { await rm(folder,{recursive:true,force:true}); }
});

 test('another tab can acknowledge an outbox entry while it is being restored', async () => {
  const key='study-outbox-v3-1--a963d0e1-a442-4c37-909f-a0415b903212.json';
  const outbox=createStudyOutbox({keys:async()=>[key],read:async()=>null,write:async()=>{},remove:async()=>{}});
  assert.deepEqual(await outbox.read(1),[]);
 });
 test('damaged pending entries surface an error without deleting data', async () => {
  let removed=false;
  const outbox=createStudyOutbox({keys:async()=>['study-outbox-v3-1--a963d0e1-a442-4c37-909f-a0415b903212.json'],read:async()=>'{broken',write:async()=>{},remove:async()=>{removed=true;}});
  await assert.rejects(outbox.read(1));assert.equal(removed,false);
 });
