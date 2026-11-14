import test from 'node:test';
import assert from 'node:assert/strict';
import {createNotificationCursor} from '../src/features/notifications/incomingNotifications.ts';
const note=(id,time='2026-11-14T10:00:00',read=false)=>({id,createdAt:time,read,message:'Test',type:'WEEKLY_SUMMARY'});
test('baseline is silent, only new rows emit and duplicates/reconnections remain silent',()=>{
 const cursor=createNotificationCursor();assert.deepEqual(cursor.observe([note(2),note(1,'2026-11-13T10:00:00')]),[]);
 assert.deepEqual(cursor.observe([note(3),note(2)]).map(n=>n.id),[3]);assert.deepEqual(cursor.observe([note(3),note(2)]),[]);
 assert.deepEqual(cursor.observe([note(1,'2026-11-13T10:00:00')]),[]);
 assert.deepEqual(cursor.observe([note(4,'2026-11-15T10:00:00',true)]),[]);
 assert.deepEqual(cursor.observe([note(4,'2026-11-15T10:00:00',false)]),[]);
});
test('empty baseline, repeated IDs, malformed records and independent account cursors',()=>{
 const a=createNotificationCursor(),b=createNotificationCursor();a.observe([]);
 assert.deepEqual(a.observe([note(1),note(1)]).map(n=>n.id),[1]);assert.deepEqual(b.observe([note(1)]),[]);
 assert.deepEqual(a.observe([{id:NaN,createdAt:'bad'},note(2,'bad')]),[]);
});
