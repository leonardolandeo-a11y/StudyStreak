import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { AxiosError } from 'axios';
import { files, File } from './helpers/appearanceFileSystemMock.mjs';
process.env.EXPO_PUBLIC_API_URL = 'https://goals-fixture.invalid';
const { apiClient } = await import('../src/services/apiClient.ts');
const { tokenStorage } = await import('../src/services/tokenStorage.ts');
const { beginSessionChange } = await import('../src/services/authSession.ts');
const { tagService } = await import('../src/services/tagService.ts');
const { tagNameError } = await import('../src/types/tag.ts');
const { downloadEvidence } = await import('../src/services/evidenceDownloadService.ts');
const { photoEvidenceService } = await import('../src/services/photoEvidenceService.ts');
const { voiceEvidenceService } = await import('../src/services/voiceEvidenceService.ts');
let adapter;
apiClient.interceptors.request.use(config => { config.adapter = adapter; return config; });
const ok = (config, data = {}) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
beforeEach(async () => { files.clear(); await tokenStorage.clear(); await tokenStorage.setTokens({token:'fixture-access', refreshToken:'fixture-refresh'}); });
test('tag CRUD keeps owner/goal paths, pagination, JWT, trim and PATCH contract', async () => {
  const calls=[]; adapter=async config=>{ calls.push(config); assert.equal(config.headers.get('Authorization'),'Bearer fixture-access'); return ok(config,{id:2,name:'Math'}); };
  const signal=new AbortController().signal;
  await tagService.list(1,7,2,signal); await tagService.create(1,7,{name:' Math '}); await tagService.update(1,7,2,{name:'Algebra'}); await tagService.remove(1,7,2);
  assert.deepEqual(calls.map(c=>[c.method,c.url]),[['get','/users/1/goals/7/tags'],['post','/users/1/goals/7/tags'],['patch','/users/1/goals/7/tags/2'],['delete','/users/1/goals/7/tags/2']]);
  assert.deepEqual(calls[0].params,{page:2,size:10}); assert.equal(calls[0].signal,signal); assert.equal(JSON.parse(calls[1].data).name,'Math');
});
test('invalid tags and IDs never send requests; account switch rejects queued tag mutations', async () => {
  let sent=0; adapter=async config=>{sent++;return ok(config);};
  assert.ok(tagNameError('  ')); assert.ok(tagNameError('a'.repeat(51))); assert.equal(tagNameError('a'.repeat(50)),null);
  await assert.rejects(tagService.create(1,7,{name:'  '})); await assert.rejects(tagService.update(1,7,2,{name:'a'.repeat(51)})); await assert.rejects(tagService.list(1,NaN,0));
  const queued=tagService.create(1,7,{name:'Math'}); beginSessionChange(); await assert.rejects(queued,/session changed/); assert.equal(sent,0);
});
test('tag permission failures remain failures without changing another goal', async () => {
  for(const status of [403,404]) {
    adapter=async config=>{throw new AxiosError('Fixture denial','ERR_BAD_RESPONSE',config,undefined,{...ok(config),status});};
    await assert.rejects(tagService.remove(1,7,2),error=>error.response?.status===status);
  }
});
test('evidence downloads use authenticated bytes, cancellation and cache cleanup', async () => {
  const bytes=new Uint8Array([1,2,3]).buffer;
  adapter=async config=>{assert.equal(config.headers.get('Authorization'),'Bearer fixture-access');assert.equal(config.responseType,'arraybuffer');return ok(config,bytes);};
  const file=await downloadEvidence(photoEvidenceService.url(7,11),'jpg'); assert.deepEqual(new Uint8Array(await file.arrayBuffer()),new Uint8Array(bytes)); file.delete(); assert.equal(files.size,0);
  for(const data of [new ArrayBuffer(0),new ArrayBuffer(2097153)]) { adapter=async config=>ok(config,data); await assert.rejects(downloadEvidence('/photo','jpg')); assert.equal(files.size,0); }
  let finish; const controller=new AbortController(); adapter=config=>new Promise(resolve=>{finish=()=>resolve(ok(config,bytes));});
  const pending=downloadEvidence('/photo','jpg',0,controller.signal); while(!finish) await new Promise(resolve=>setImmediate(resolve)); controller.abort(); finish(); await assert.rejects(pending); assert.equal(files.size,0);
});
test('account change while writing private evidence deletes late temporary files', async () => {
  const original=File.prototype.write;
  File.prototype.write=function(value){original.call(this,value);beginSessionChange();};
  adapter=async config=>ok(config,new Uint8Array([1]).buffer);
  try { await assert.rejects(downloadEvidence('/voice','m4a'),/session changed/); assert.equal(files.size,0); } finally {File.prototype.write=original;}
});
test('existing photo and voice uploads preserve native multipart field names and MIME', async () => {
  const original=globalThis.FormData, submissions=[];
  globalThis.FormData=class { get [Symbol.toStringTag](){return 'FormData';} fields=[];append(...field){this.fields.push(field);} };
  adapter=async config=>{submissions.push(config);return ok(config);};
  try {
    await photoEvidenceService.upload(7,11,'file://photo.jpg'); await voiceEvidenceService.upload(7,11,'file://voice.m4a');
    assert.deepEqual(submissions.map(c=>c.url),['/api/goals/7/daily-records/11/photo','/api/goals/7/daily-records/11/voice']);
    assert.deepEqual(submissions.map(c=>c.data.fields[0][0]),['photo','audio']);
    assert.deepEqual(submissions.map(c=>c.data.fields[0][1].type),['image/jpeg','audio/mp4']);
  } finally {globalThis.FormData=original;}
});
