import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import { beforeEach,test } from 'node:test';
import { files } from './helpers/appearanceFileSystemMock.mjs';
process.env.EXPO_PUBLIC_API_URL='https://social-fixture.invalid';
const { apiClient }=await import('../src/services/apiClient.ts');
const { tokenStorage }=await import('../src/services/tokenStorage.ts');
const { beginSessionChange }=await import('../src/services/authSession.ts');
const { socialService }=await import('../src/services/socialService.ts');
const { OwnProfileMedia,cleanStaleProfileMedia }=await import('../src/features/profile/ownProfileMedia.ts');
let adapter;apiClient.interceptors.request.use(config=>{config.adapter=adapter;return config;});
const ok=(config,data={},headers={})=>({config,data,headers,status:200,statusText:'OK'});
beforeEach(async()=>{await tokenStorage.clear();await tokenStorage.setTokens({token:'fixture-access',refreshToken:'fixture-refresh'});files.clear();});
test('social REST contracts keep JWT and paginated ACCEPTED authorization, ignoring pending/unrelated links',async()=>{
  const paths=[],privacy={showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false};
  adapter=async config=>{
    paths.push(config.url);assert.equal(config.headers.get('Authorization'),'Bearer fixture-access');
    if(config.url==='/api/tracking-links/active')return ok(config,{content:config.params.page===0?[{requesterId:1,receiverId:3,status:'ACCEPTED'},{requesterId:1,receiverId:4,status:'PENDING'}]:[{requesterId:5,receiverId:1,status:'ACCEPTED'},{requesterId:9,receiverId:10,status:'ACCEPTED'}],totalPages:2});
    if(config.method==='put')assert.deepEqual(JSON.parse(config.data),privacy);
    if(config.url==='/api/presence/heartbeat')assert.deepEqual(JSON.parse(config.data),{sessionId:'00000000-0000-4000-8000-000000000001'});
    return ok(config,privacy);
  };
  const signal=new AbortController().signal;
  assert.deepEqual([...await socialService.accepted(1,signal)],[3,5]);await socialService.privacy(signal);await socialService.savePrivacy(privacy,signal);await socialService.heartbeat('00000000-0000-4000-8000-000000000001',signal);await socialService.profile(3,signal);await socialService.presence(3,signal);
  assert.ok(paths.includes('/api/users/3/profile'));assert.ok(paths.includes('/api/users/3/presence'));
});
test('social protected images reuse native files and cleanup never deletes own profile or Focus data',async()=>{
  const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'));
  let reads=0;adapter=async config=>{reads++;assert.equal(config.url,'/api/users/3/profile/avatar');return ok(config,png.buffer,{'content-type':'image/png'});};
  const media=new OwnProfileMedia(1,'/api/users/3/profile','social');const uri=await media.load('avatar');assert.match(uri,/social-profile-1-/);await media.load('avatar');assert.equal(reads,1);
  files.set('test://cache/own-profile-1.png',png);files.set('test://cache/focus-audio.wav',png);cleanStaleProfileMedia('social');assert.equal(files.has(uri),false);assert.equal(files.size,2);media.dispose();
});
test('social requests queued under an old account do not execute with new credentials',async()=>{
  let sent=0;adapter=async config=>{sent++;return ok(config);};const request=socialService.profile(3,new AbortController().signal);beginSessionChange();await assert.rejects(request,/session changed/);assert.equal(sent,0);
});

test('panel and social rows share native avatar downloads; closing a panel preserves an active row lease',async()=>{
  const { SocialDirectory }=await import('../src/features/social/socialDirectory.ts');
  const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'));
  let finish,reads=0,transportSignal;
  adapter=config=>{reads++;transportSignal=config.signal;return new Promise(resolve=>{finish=()=>resolve(ok(config,png.buffer,{'content-type':'image/png'}));});};
  const directory=new SocialDirectory(1,{accepted:async()=>new Set([3])},{every:()=>()=>{}});directory.setActive(true);const stop=directory.watch(3,'avatar');
  while(!finish)await new Promise(resolve=>setImmediate(resolve));
  const panel=new AbortController();const request=directory.partnerAvatar(3,panel.signal);panel.abort();
  assert.equal(transportSignal.aborted,false);finish();await assert.rejects(request);await directory.refresh();assert.equal(reads,1);assert.ok(directory.avatar(3));
  const cached=await directory.partnerAvatar(3,new AbortController().signal);assert.equal(cached,directory.avatar(3));assert.equal(reads,1);
  directory.revoke(3);assert.equal(files.has(cached),false);stop();directory.dispose();
});
test('closing a panel cancels an avatar download with no remaining consumers',async()=>{
  const { SocialDirectory }=await import('../src/features/social/socialDirectory.ts');let finish,signal;
  adapter=config=>{signal=config.signal;return new Promise(resolve=>{finish=()=>resolve(ok(config,new Uint8Array().buffer,{'content-type':'image/png'}));});};
  const directory=new SocialDirectory(1,{}, {every:()=>()=>{}});directory.setActive(true);
  const panel=new AbortController(),request=directory.partnerAvatar(3,panel.signal);while(!finish)await new Promise(resolve=>setImmediate(resolve));panel.abort();assert.equal(signal.aborted,true);finish();await assert.rejects(request);assert.equal(files.size,0);directory.dispose();
});
