import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import axios, { AxiosError } from 'axios';
import { files } from './helpers/appearanceFileSystemMock.mjs';
import { setPickerResult, setPickerFailure, requests as pickerRequests } from './helpers/profilePickerMock.mjs';
process.env.EXPO_PUBLIC_API_URL = 'https://profile-fixture.invalid';
const { apiClient } = await import('../src/services/apiClient.ts');
const { tokenStorage } = await import('../src/services/tokenStorage.ts');
const { beginSessionChange } = await import('../src/services/authSession.ts');
const { getOwnProfile } = await import('../src/services/ownProfileService.ts');
const { OwnProfileMedia, cleanStaleProfileMedia } = await import('../src/features/profile/ownProfileMedia.ts');
const { saveOwnProfile } = await import('../src/features/profile/saveOwnProfile.ts');
const { pickProfileImage } = await import('../src/features/profile/pickProfileImage.ts');
const { profileTextError, normalizeProfileName } = await import('../src/features/profile/profileValidation.ts');
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
const credentials = id => ({ token: `fixture.${Buffer.from(JSON.stringify({ type:'access', userId:id, sub:'fixture', email:'fixture@example.invalid', role:'USER', exp:Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.signature`, refreshToken: `fixture-refresh-${id}` });
let adapter;
apiClient.interceptors.request.use(config => { config.adapter = adapter; return config; });
const ok = (config,data={},headers={}) => ({ config,data,headers,status:200,statusText:'OK' });
function reject(config,status) { throw new AxiosError('Fixture HTTP failure','ERR_BAD_RESPONSE',config,undefined,{...ok(config),status}); }
beforeEach(async () => { await tokenStorage.clear(); await tokenStorage.setTokens(credentials(1)); files.clear(); adapter=async config=>ok(config); axios.defaults.adapter=config=>adapter(config); });
const asset = uri => ({ uri, mimeType:'image/png', fileName:'Fixture.png', width:10, height:10 });

test('download is authenticated, single-flight, caches missing media and clears private files on dispose', async () => {
  let count=0;
  adapter=async config=>{ count++; assert.ok(config.headers.get('Authorization')?.startsWith('Bearer ')); assert.equal(config.responseType,'arraybuffer'); return ok(config,png.buffer,{'content-type':'image/png'}); };
  const media=new OwnProfileMedia(1); const [a,b]=await Promise.all([media.load('avatar'),media.load('avatar')]);
  assert.equal(a,b); assert.equal(count,1); assert.ok(files.has(a)); await media.load('avatar'); assert.equal(count,1);
  media.invalidate('avatar'); const c=await media.load('avatar'); assert.notEqual(a,c); assert.equal(files.has(a),false);
  adapter=async config=>reject(config,404); assert.equal(await media.load('banner'),null); assert.equal(await media.load('banner'),null);
  media.dispose(); assert.equal(files.size,0); assert.throws(()=>media.load('avatar'),/cancelled/);
});
test('403 remains an error and a later retry succeeds without bypassing permissions', async () => {
  const media=new OwnProfileMedia(1); adapter=async config=>reject(config,403);
  await assert.rejects(media.load('avatar'),error=>error.response?.status===403);
  adapter=async config=>ok(config,png.buffer,{'content-type':'image/png'}); assert.ok(await media.load('avatar')); media.dispose();
});
test('image 401 uses the existing refresh and retries once; rejected refresh remains 401', async () => {
  let refresh=0,gets=0; const tokens=credentials(1);
  adapter=async config=>{ if(config.url==='/refresh'){ refresh++; return ok(config,tokens); } gets++; if(gets===1) return reject(config,401); return ok(config,png.buffer,{'content-type':'image/png'}); };
  const media=new OwnProfileMedia(1); assert.ok(await media.load('avatar')); assert.equal(refresh,1); assert.equal(gets,2); media.dispose();
  adapter=async config=>reject(config,401); const denied=new OwnProfileMedia(1); await assert.rejects(denied.load('banner')); denied.dispose();
});
test('selection validates bytes, sizes, MIME and dimensions; cancel makes no changes and originals survive', async () => {
  const media=new OwnProfileMedia(1),uri='test://library/original.png'; files.set(uri,png);
  const selected=await media.prepare('avatar',asset(uri)); assert.notEqual(selected.uri,uri); assert.ok(files.has(uri)); assert.equal(selected.type,'image/png');
  assert.deepEqual(new Uint8Array(await media.bytes(selected)),png); media.release(selected.uri); assert.ok(files.has(uri));
  await assert.rejects(media.prepare('avatar',{...asset(uri),fileSize:2097153}),/2 MiB/);
  await assert.rejects(media.prepare('banner',{...asset(uri),fileSize:5242881}),/5 MiB/);
  files.set('test://library/large',new Uint8Array(2097153)); await assert.rejects(media.prepare('avatar',asset('test://library/large')),/2 MiB/);
  await assert.rejects(media.prepare('avatar',{...asset(uri),width:8193}),/8192/);
  await assert.rejects(media.prepare('avatar',{...asset(uri),mimeType:'image/jpeg'}),/does not match/);
  files.set(uri,new Uint8Array()); await assert.rejects(media.prepare('avatar',asset(uri)));
  files.set(uri,Buffer.from('<svg/>')); await assert.rejects(media.prepare('avatar',asset(uri)),/PNG/);
  const temporary='test://cache/ImagePicker/fixture.png'; files.set(temporary,png); await media.prepare('banner',asset(temporary)); assert.equal(files.has(temporary),false);
  setPickerResult({canceled:true,assets:null}); assert.equal(await pickProfileImage(),null); assert.deepEqual(pickerRequests.at(-1).mediaTypes,['images']);
  setPickerFailure(new Error('Photo library access denied')); await assert.rejects(pickProfileImage(),/access denied/);
  media.dispose(); assert.ok(files.has(uri));
});
test('save sends only editable text and binary image bodies, preserves partial failure and uses DELETE', async () => {
  const requests=[]; adapter=async config=>{ requests.push(config); return ok(config); };
  const controller=new AbortController(); const draft={uri:'test://draft',type:'image/png',size:png.length,name:'Fixture.png'};
  await saveOwnProfile({displayName:'  Ada  ',bio:'Math\nnotes',images:{avatar:draft,banner:'remove'}},controller.signal,async()=>png.buffer);
  assert.deepEqual(requests.map(config=>[config.method,config.url]),[['patch','/api/profile'],['put','/api/profile/avatar'],['delete','/api/profile/banner']]);
  assert.deepEqual(JSON.parse(requests[0].data),{displayName:'Ada',bio:'Math\nnotes'});
  assert.ok(requests[1].data instanceof ArrayBuffer); assert.equal(requests[1].headers.get('Content-Type'),'image/png'); assert.deepEqual(new Uint8Array(requests[1].data),png);
  adapter=async config=>{ if(config.method==='put') return reject(config,403); return ok(config); };
  await assert.rejects(saveOwnProfile({displayName:'Ada',bio:'',images:{avatar:draft,banner:null}},controller.signal,async()=>png.buffer),error=>error.response.status===403);
});
test('logout/account change cancels old downloads and prevents later writes under the new account', async () => {
  const media=new OwnProfileMedia(1); let finish;
  adapter=config=>new Promise(resolve=>{finish=()=>resolve(ok(config,png.buffer,{'content-type':'image/png'}));});
  const pending=media.load('avatar'); while(!finish) await new Promise(resolve=>setImmediate(resolve));
  beginSessionChange(); media.dispose(); finish(); await assert.rejects(pending); assert.equal(files.size,0);
  const requests=[]; adapter=async config=>{requests.push(config.url); return ok(config);};
  const draft={uri:'test://draft',type:'image/png',size:png.length,name:'Fixture.png'};
  await assert.rejects(saveOwnProfile({displayName:'Ada',bio:'',images:{avatar:draft,banner:null}},new AbortController().signal,async()=>{beginSessionChange();return png.buffer;}),/session changed/);
  assert.deepEqual(requests,['/api/profile']);
});
test('text matches Unicode scalar limits and stale cleanup only removes private profile caches', () => {
  assert.equal(normalizeProfileName('\u00a0 Ada \u3000'),'Ada'); assert.equal(profileTextError('😀'.repeat(60),'line\n\tnotes'),null);
  assert.match(profileTextError('😀'.repeat(61),''),/60/); assert.match(profileTextError('Ada','x'.repeat(301)),/300/);
  assert.ok(profileTextError('Ada\0','')); assert.ok(profileTextError('Ada','\uD800'));
  files.set('test://cache/own-profile-1-old.png',png); files.set('test://cache/own-avatar-1-old.png',png); files.set('test://cache/focus-audio.wav',png);
  cleanStaleProfileMedia(); assert.deepEqual([...files.keys()],['test://cache/focus-audio.wav']);
});

test('an explicitly cancelled save performs no writes; a cancelled selection removes its private preview', async () => {
  const requests=[]; adapter=async config=>{requests.push(config.url);return ok(config);};
  const controller=new AbortController();controller.abort();
  await assert.rejects(saveOwnProfile({displayName:'Ada',bio:'',images:{avatar:null,banner:null}},controller.signal,async()=>png.buffer),/cancelled/);
  assert.deepEqual(requests,[]);
  const media=new OwnProfileMedia(1),uri='test://library/selection.png'; files.set(uri,png);
  const draft=await media.prepare('avatar',asset(uri));media.release(draft.uri);assert.equal(files.has(draft.uri),false);assert.ok(files.has(uri));media.dispose();
});

test('a replaced pending image cannot evict the fresh cache when its older request fails', async () => {
  const media=new OwnProfileMedia(1);let finishOld;let count=0;
  adapter=config=>{count++;if(count===1)return new Promise((resolve,rejectOld)=>{finishOld=()=>rejectOld(new AxiosError('Old fixture denied','ERR_BAD_RESPONSE',config,undefined,{...ok(config),status:403}));});return Promise.resolve(ok(config,png.buffer,{'content-type':'image/png'}));};
  const old=media.load('banner');while(!finishOld)await new Promise(resolve=>setImmediate(resolve));
  media.invalidate('banner');const fresh=await media.load('banner');finishOld();await assert.rejects(old);
  assert.equal(await media.load('banner'),fresh);assert.equal(count,2);media.dispose();
});

test('profile reads queued before a session change never execute with the next account credentials', async () => {
  let sent=0;adapter=async config=>{sent++;return ok(config);};
  const pending=getOwnProfile(new AbortController().signal);beginSessionChange();
  await assert.rejects(pending,/session changed/);assert.equal(sent,0);
});
