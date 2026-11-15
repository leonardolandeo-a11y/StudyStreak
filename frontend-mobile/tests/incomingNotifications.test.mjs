import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationCursor, appendNotificationPopups } from '../src/features/notifications/incomingNotifications.ts';
import { createUnreadCounter } from '../src/features/notifications/unreadCounter.ts';
const base=Date.parse('2026-11-14T12:00:00Z');
const row=(id,offset=0,read=false)=>({id,createdAt:new Date(base+offset).toISOString(),read,message:'Notification '+id,type:'WEEKLY_SUMMARY'});
test('initial history is silent; duplicates, read and older server rows never re-alert',()=>{
 const cursor=createNotificationCursor(()=>base);assert.deepEqual(cursor.observe([row(1)]),[]);
 const fresh=cursor.observe([row(2,1000),row(2,1000),row(1),row(3,-1000),row(4,2000,true)]);assert.deepEqual(fresh.map(n=>n.id),[2]);
 assert.deepEqual(cursor.observe([row(2,3000),row(4,2000,true)]),[],'dismissed or mutated IDs cannot reappear');
 assert.deepEqual(cursor.observe([row(5,3000)]).map(n=>n.id),[5]);
});
test('empty initial baseline rejects historical backfill; offsets and same-time IDs compare correctly',()=>{
 const cursor=createNotificationCursor(()=>base);cursor.observe([]);assert.deepEqual(cursor.observe([row(1,-60000)]),[]);
 assert.deepEqual(cursor.observe([row(2,1000)]).map(n=>n.id),[2]);
 const equivalent={...row(3,1000),createdAt:'2026-11-14T07:00:01-05:00'};assert.deepEqual(cursor.observe([equivalent]).map(n=>n.id),[3]);
 assert.deepEqual(cursor.observe([{...row(9),createdAt:'bad'},{...row(10),message:null}]),[]);
});
test('a batch caps the stack at three; overflow and dismissed items do not replay',()=>{
 const cursor=createNotificationCursor(()=>base);cursor.observe([row(1)]);const fresh=cursor.observe([2,3,4,5].map(id=>row(id,id*1000)));
 const popups=appendNotificationPopups([],fresh);assert.deepEqual(popups.map(n=>n.id),[3,4,5]);
 const dismissed=popups.filter(n=>n.id!==4);assert.deepEqual(appendNotificationPopups(dismissed,cursor.observe(fresh)),dismissed);
 assert.deepEqual(createNotificationCursor(()=>base).observe(fresh),[],'a new account scope starts silent');
});
test('background cancellation discards late polls and foreground refresh can resume',async()=>{
 const pending=[],counts=[];const counter=createUnreadCounter(signal=>new Promise(resolve=>pending.push({signal,resolve})),value=>counts.push(value));
 const old=counter.refresh();await Promise.resolve();counter.cancel();assert.equal(pending[0].signal.aborted,true);
 const current=counter.refresh();await Promise.resolve();pending[1].resolve(2);await current;pending[0].resolve(8);await old;
 assert.deepEqual(counts,[2]);counter.dispose();
});
