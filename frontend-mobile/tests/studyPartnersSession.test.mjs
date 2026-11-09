import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError } from 'axios';
const { StudyPartnersSession,partnerGroup }=await import('../src/features/social/studyPartnersSession.ts');
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve();};
const presence=(status='ONLINE',lastSeenAt=null)=>({status,lastSeenAt,serverNow:'2026-11-08T12:00:00Z'});
const link=(id,status='ACCEPTED')=>({id,requesterId:1,receiverId:id,requesterUsername:'viewer',receiverUsername:`partner-${id}`,status});
const page=(ids,totalPages=1)=>({content:ids.map(id=>link(id)),totalPages,totalElements:ids.length});
const denied=()=>new AxiosError('Fixture denied','ERR_BAD_RESPONSE',{},undefined,{status:404,data:{},headers:{}});
function fixture(){
  const jobs=new Set(),revoked=new Set(),images=[],invalidated=[],profiles=[],presences=[];let response=page([2,3,4]),bad=false;
  const directory={ownerId:1,subscribeRevocations(fn){revoked.add(fn);return()=>revoked.delete(fn);},partnerAvatar:async id=>{images.push(id);return `file:///cache/${id}.png`;},invalidatePartnerAvatar:id=>invalidated.push(id),revoke(id){for(const listener of revoked)listener(id);}};
  const api={activePage:async()=>{if(bad)throw new Error('Offline');return response;},profile:async id=>{profiles.push(id);return {id,username:`partner-${id}`,presentationName:`Partner ${id}`,presence:presence(id===2?'ONLINE':id===3?'OFFLINE':'HIDDEN')};},presence:async id=>{presences.push(id);return presence('ONLINE');}};
  const timer={every(fn,ms){assert.equal(ms,60000);jobs.add(fn);return()=>jobs.delete(fn);},tick(){for(const fn of jobs)fn();}};
  const session=new StudyPartnersSession(directory,api,timer);
  return {session,directory,api,timer,jobs,images,profiles,presences,invalidated,setResponse(value){response=value;},setBad(value){bad=value;}};
}
test('accepted-only pages group explicit states without hidden/offline inference and poll at 60/180 seconds',async()=>{
  const f=fixture();f.setResponse({...page([2,3,4]),content:[link(2),link(3),link(4),link(5,'PENDING'),{...link(6),requesterId:9}]});
  f.session.setActive(true);await f.session.refresh();assert.deepEqual(f.session.getSnapshot().items.map(partnerGroup),['Online','Offline','Other partners']);assert.deepEqual(f.images.sort(),[2,3,4]);
  f.timer.tick();await f.session.refresh();f.timer.tick();await f.session.refresh();assert.equal(f.presences.includes(4),false);
  f.timer.tick();await f.session.refresh();assert.equal(f.presences.filter(id=>id===4).length,1);assert.equal(f.profiles.length,3);assert.equal(f.images.length,3);
  f.session.dispose();assert.equal(f.jobs.size,0);assert.deepEqual(f.session.getSnapshot().items,[]);
});
test('hidden last activity uses the regular interval, partial failures remain neutral and denials remove rows immediately',async()=>{
  const f=fixture();f.api.profile=async id=>{if(id===3)throw new Error('Network');return {id,username:`p${id}`,presentationName:`P${id}`,presence:presence('HIDDEN','2026-11-08T11:00:00Z')};};
  f.session.setActive(true);await f.session.refresh();assert.equal(f.session.getSnapshot().partial,true);assert.equal(partnerGroup(f.session.getSnapshot().items.find(row=>row.id===3)),'Other partners');
  f.api.presence=async id=>{if(id===2)throw denied();return presence('OFFLINE');};f.timer.tick();await f.session.refresh();assert.equal(f.session.getSnapshot().items.some(row=>row.id===2),false);
  f.directory.revoke(4);assert.equal(f.session.getSnapshot().items.some(row=>row.id===4),false);f.session.dispose();
});
test('relationship revocation is applied before waiting on slow remaining rows',async()=>{
  const f=fixture();f.session.setActive(true);await f.session.refresh();f.setResponse(page([2]));let finish;
  f.api.presence=()=>new Promise(resolve=>{finish=()=>resolve(presence());});const request=f.session.refresh();await flush();
  assert.deepEqual(f.session.getSnapshot().items.map(row=>row.id),[2]);assert.ok(f.invalidated.includes(3));finish();await request;f.session.dispose();
});
test('pagination cancels old pages, handles an invalid final page and clears data on error/retry',async()=>{
  const f=fixture();f.setResponse(page([2],2));f.session.setActive(true);await f.session.refresh();
  let signal;f.api.activePage=async(p,s)=>{signal=s;return p===1?page([9],2):page([2],2);};f.session.setPage(1);await f.session.refresh();assert.equal(f.session.getSnapshot().items[0].id,9);
  f.api.activePage=async()=>page([],0);await f.session.refresh();await flush();await f.session.refresh();assert.equal(f.session.getSnapshot().page,0);assert.deepEqual(f.session.getSnapshot().items,[]);
  f.api.activePage=async()=>{throw new Error('Offline');};await f.session.refresh();assert.ok(f.session.getSnapshot().error);
  f.api.activePage=async()=>page([2]);await f.session.retry();assert.equal(f.session.getSnapshot().items[0].id,2);f.session.dispose();assert.equal(signal.aborted,true);
});
test('foreground and closing abort requests, avoid duplicate ticks and isolate a new panel/account',async()=>{
  const f=fixture();let finish,signal,reads=0;
  f.api.activePage=(p,s)=>{reads++;signal=s;return new Promise(resolve=>{finish=()=>resolve(page([2]));});};
  f.session.setActive(true);f.timer.tick();f.timer.tick();assert.equal(reads,1);const old=f.session.refresh();
  f.session.setActive(false);assert.equal(signal.aborted,true);assert.equal(f.jobs.size,0);finish();await old;assert.deepEqual(f.session.getSnapshot().items,[]);
  f.api.activePage=async()=>page([]);f.session.setActive(true);await f.session.refresh();assert.equal(f.session.getSnapshot().loading,false);f.session.dispose();assert.equal(f.jobs.size,0);
  const next=fixture();next.setResponse(page([]));next.session.setActive(true);await next.session.refresh();assert.deepEqual(next.session.getSnapshot().items,[]);next.session.dispose();
});
test('panel limits profile/avatar work to two and late responses cannot repopulate a closed panel',async()=>{
  const f=fixture();f.setResponse(page([2,3,4,5,6,7,8,9,10,11]));let current=0,max=0;const finish=[];
  f.api.profile=id=>new Promise(resolve=>{current++;max=Math.max(max,current);finish.push(()=>{current--;resolve({id,username:`p${id}`,presentationName:`P${id}`,presence:null});});});
  f.session.setActive(true);await flush();assert.equal(max,2);const request=f.session.refresh();f.session.dispose();for(const run of finish)run();await request;assert.equal(max,2);assert.deepEqual(f.session.getSnapshot().items,[]);assert.equal(f.images.length,0);
});

test('a transient presence error keeps the authorized cached avatar and recovers without downloading it again',async()=>{
  const f=fixture();f.session.setActive(true);await f.session.refresh();const avatar=f.session.getSnapshot().items.find(row=>row.id===2).avatar;
  f.api.presence=async()=>{throw new Error('Network');};await f.session.refresh();let row=f.session.getSnapshot().items.find(row=>row.id===2);assert.equal(row.presence,null);assert.equal(row.avatar,avatar);
  f.api.presence=async()=>presence('OFFLINE');await f.session.refresh();row=f.session.getSnapshot().items.find(row=>row.id===2);assert.equal(row.presence.status,'OFFLINE');assert.equal(row.avatar,avatar);assert.equal(f.images.length,3);f.session.dispose();
});
