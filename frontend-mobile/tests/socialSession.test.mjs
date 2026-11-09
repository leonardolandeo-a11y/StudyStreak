import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError } from 'axios';
const { PresenceSession } = await import('../src/features/social/presenceSession.ts');
const { SocialDirectory } = await import('../src/features/social/socialDirectory.ts');
const off={showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false};
const hidden={status:'HIDDEN',lastSeenAt:null,serverNow:'2026-11-08T12:00:00Z'};
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
function timers(){const jobs=new Set();return {jobs,every(run,ms){assert.equal(ms,30000);jobs.add(run);return()=>jobs.delete(run);},tick(){for(const run of jobs)run();}};}
function denied(status=404){return new AxiosError('Fixture denied','ERR_BAD_RESPONSE',{},undefined,{status,data:{},headers:{}});}
test('privacy remains server-confirmed; opt-in creates one heartbeat, stats changes do not duplicate it, opt-out stops it',async()=>{
  const timer=timers(),beats=[];let confirm,fail=false;
  const session=new PresenceSession({privacy:async()=>off,savePrivacy:value=>fail?Promise.reject(denied(403)):new Promise(resolve=>{confirm=()=>resolve(value);}),heartbeat:async(id)=>{beats.push(id);return hidden;}},timer);
  session.setActive(true);await session.load();assert.equal(timer.jobs.size,0);assert.equal(beats.length,0);
  const saving=session.save({...off,showPresence:true});await flush();assert.equal(session.getSnapshot().privacy.showPresence,false);assert.equal(session.getSnapshot().saving,true);
  confirm();await saving;await flush();assert.equal(beats.length,1);assert.equal(timer.jobs.size,1);
  timer.tick();await flush();assert.equal(beats.length,2);assert.equal(new Set(beats).size,1);assert.match(beats[0],/^[\da-f-]{36}$/);
  const stats=session.save({...off,showPresence:true,shareVerifiedSessions:true});await flush();confirm();await stats;assert.equal(beats.length,2);
  fail=true;await session.save(off);assert.equal(session.getSnapshot().privacy.showPresence,true);assert.ok(session.getSnapshot().error);
  fail=false;const disable=session.save(off);await flush();confirm();await disable;assert.equal(timer.jobs.size,0);assert.equal(session.getSnapshot().presence,null);
  session.dispose();assert.equal(session.getSnapshot().privacy,null);
});
test('background aborts presence, foreground resumes without overlapping requests and logout clears timers/state',async()=>{
  const timer=timers(),calls=[];let finish;
  const session=new PresenceSession({privacy:async()=>({...off,showLastSeen:true}),savePrivacy:async value=>value,heartbeat:(id,signal)=>{calls.push({id,signal});return new Promise(resolve=>{finish=()=>resolve(hidden);});}},timer);
  session.setActive(true);await session.load();await flush();timer.tick();timer.tick();assert.equal(calls.length,1);
  session.setActive(false);assert.equal(calls[0].signal.aborted,true);assert.equal(timer.jobs.size,0);
  session.setActive(true);assert.equal(calls.length,1);finish();await flush();assert.equal(calls.length,2);assert.equal(calls[0].id,calls[1].id);
  session.dispose();finish();await flush();assert.equal(timer.jobs.size,0);assert.equal(session.getSnapshot().privacy,null);
  const next=new PresenceSession({privacy:async()=>off},timers());await next.load();assert.equal(next.getSnapshot().privacy.showLastSeen,false);next.dispose();
});
function directoryFixture(){
  const timer=timers(),loads=[],disposed=[],cache=new Map();let accepted=new Set([3]),failProfile=false;
  let profile={id:3,username:'partner',presentationName:'Partner',bio:'Algebra',registrationDate:null,statistics:{},presence:hidden};
  const api={accepted:async()=>new Set(accepted),profile:async()=>{if(failProfile)throw denied();return {...profile,statistics:{...profile.statistics}};},presence:async()=>hidden};
  const directory=new SocialDirectory(1,api,timer,id=>{
    const own=new Map();return {load:async slot=>{if(own.has(slot))return own.get(slot);const uri=`file:///private/${id}/${slot}.png`;loads.push([id,slot]);own.set(slot,uri);cache.set(uri,true);return uri;},invalidate:slot=>own.delete(slot),dispose:()=>{for(const uri of own.values()){disposed.push(uri);cache.delete(uri);}own.clear();}};
  });
  directory.setActive(true);
  return {directory,timer,loads,disposed,cache,api,setAccepted(value){accepted=new Set(value);},deny(){failProfile=true;},setProfile(value){profile={...profile,...value};}};
}
test('only accepted users get images; duplicates share downloads and revocation clears visible member data and files',async()=>{
  const f=directoryFixture(),a=f.directory.watch(3,'avatar'),b=f.directory.watch(3,'avatar'),c=f.directory.watch(4,'avatar');
  await f.directory.refresh();await flush();assert.deepEqual(f.loads,[[3,'avatar']]);assert.equal(f.directory.avatar(4),null);
  const member=f.directory.watch(3,'profile');await f.directory.refresh();await flush();
  assert.equal(f.directory.member(3).status,'ready');assert.deepEqual(f.directory.member(3).profile.statistics,{});assert.equal(f.directory.member(3).profile.presence.status,'HIDDEN');
  const count=f.loads.length;await f.directory.refresh(true);assert.equal(f.loads.length,count);
  f.setProfile({statistics:{verifiedMinutes:15},presence:{...hidden,status:'OFFLINE',lastSeenAt:'2026-11-08T11:00:00Z'}});await f.directory.loadMember(3);
  assert.equal(f.directory.member(3).profile.statistics.verifiedMinutes,15);
  f.setAccepted([]);f.deny();await f.directory.refresh(true);assert.equal(f.directory.avatar(3),null);assert.equal(f.directory.member(3).profile,null);assert.equal(f.cache.size,0);
  a();b();c();member();assert.equal(f.timer.jobs.size,0);f.directory.dispose();
});
test('loss of consent removes statistics on revalidation; background drops cached images and resumes authorization checks',async()=>{
  const f=directoryFixture();f.setProfile({statistics:{verifiedMinutes:20,verifiedSessions:2}});const stop=f.directory.watch(3,'profile');await f.directory.refresh();await flush();
  assert.equal(f.directory.member(3).profile.statistics.verifiedSessions,2);
  f.setProfile({statistics:{},presence:null});await f.directory.loadMember(3);assert.deepEqual(f.directory.member(3).profile.statistics,{});assert.equal(f.directory.member(3).profile.presence,null);
  f.directory.setActive(false);assert.equal(f.cache.size,0);assert.equal(f.directory.member(3),undefined);assert.equal(f.timer.jobs.size,0);
  f.setAccepted([]);f.deny();f.directory.setActive(true);await f.directory.refresh();await flush();assert.equal(f.directory.member(3).profile,null);stop();f.directory.dispose();
});
test('private image concurrency never exceeds three and queued images cannot outlive logout',async()=>{
  const timer=timers(),pending=[];let live=0,maximum=0;
  const directory=new SocialDirectory(1,{accepted:async()=>new Set([2,3,4,5,6,7])},timer,id=>({load:()=>new Promise(resolve=>{live++;maximum=Math.max(maximum,live);pending.push(()=>{live--;resolve(`file:///private/${id}.png`);});}),dispose(){}}));
  directory.setActive(true);const stops=[2,3,4,5,6,7].map(id=>directory.watch(id,'avatar'));await flush();assert.equal(maximum,3);
  directory.dispose();for(const finish of pending)finish();await flush();assert.equal(live,0);assert.equal(maximum,3);assert.equal(directory.avatar(2),null);assert.equal(timer.jobs.size,0);for(const stop of stops)stop();
});

test('React snapshots publish new permission/image objects and retire member data after revocation',async()=>{
  const f=directoryFixture(),first=f.directory.getSnapshot();let notifications=0;
  const unsubscribe=f.directory.subscribe(()=>notifications++),stop=f.directory.watch(3,'avatar');await f.directory.refresh();await flush();
  const loaded=f.directory.getSnapshot();assert.notEqual(loaded,first);assert.equal(first.accepted.has(3),false);assert.equal(loaded.accepted.has(3),true);assert.ok(loaded.avatars.get(3));
  f.directory.revoke(3);const revoked=f.directory.getSnapshot();assert.notEqual(revoked,loaded);assert.equal(revoked.accepted.has(3),false);assert.equal(revoked.avatars.has(3),false);assert.equal(revoked.members.get(3).profile,null);assert.ok(notifications>0);
  stop();unsubscribe();f.directory.dispose();
});

test('foreground does not wait for an obsolete profile request or accept its late response',async()=>{
  const f=directoryFixture();let finishOld,calls=0;
  f.api.profile=async()=>{calls++;if(calls===1)return new Promise(resolve=>{finishOld=()=>resolve({id:3,username:'old',presentationName:'Old data',statistics:{verifiedMinutes:999},presence:hidden});});return {id:3,username:'fresh',presentationName:'Fresh data',statistics:{},presence:hidden};};
  const stop=f.directory.watch(3,'profile');await flush();assert.ok(finishOld);
  f.directory.setActive(false);f.directory.setActive(true);await f.directory.refresh();await flush();
  assert.equal(f.directory.member(3).profile.presentationName,'Fresh data');finishOld();await flush();
  assert.equal(f.directory.member(3).profile.presentationName,'Fresh data');assert.deepEqual(f.directory.member(3).profile.statistics,{});stop();f.directory.dispose();
});

test('image denial revokes cached access while a missing image keeps an authorized profile with fallback',async()=>{
  const timer=timers();let disposed=0;
  const api={accepted:async()=>new Set([3]),profile:async()=>({id:3,username:'partner',presentationName:'Partner',statistics:{},presence:hidden})};
  const forbidden=new SocialDirectory(1,api,timer,()=>({load:async()=>{throw denied(403);},dispose(){disposed++;}}));
  forbidden.setActive(true);const stop=forbidden.watch(3,'avatar');await forbidden.refresh();await flush();
  assert.equal(forbidden.avatar(3),null);assert.equal(forbidden.getSnapshot().accepted.has(3),false);assert.ok(disposed>0);stop();forbidden.dispose();
  const missing=new SocialDirectory(1,api,timers(),()=>({load:async slot=>slot==='avatar'?null:'file:///private/banner.png',dispose(){}}));
  missing.setActive(true);const unwatch=missing.watch(3,'profile');await missing.refresh();await flush();
  assert.equal(missing.member(3).status,'ready');assert.equal(missing.member(3).avatar,null);assert.equal(missing.member(3).banner,'file:///private/banner.png');unwatch();missing.dispose();
});
