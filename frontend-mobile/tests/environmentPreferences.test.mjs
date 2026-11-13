import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironmentStore,defaultEnvironment,parseEnvironment,resolveEnvironment,environmentKey,sceneLabels} from '../src/features/environment/environmentPreferences.ts';
import * as web from '../../frontend-web/src/features/environment/environmentPreferences.ts';
test('Mobile uses exactly the Web choices, defaults, keys, normalization and automatic schedule',()=>{
 assert.deepEqual(sceneLabels,web.sceneLabels);assert.deepEqual(defaultEnvironment(),web.defaultEnvironment());assert.equal(environmentKey(101),web.environmentKey(101));
 for(const raw of [null,'bad','{}','[]','{"selection":"library","motion":false,"token":"discard"}','{"selection":"unknown","motion":"true"}']) assert.deepEqual(parseEnvironment(raw),web.parseEnvironment(raw));
 for(const choice of ['automatic','campus','library','night','cafe'])for(const period of ['morning','afternoon','night'])assert.equal(resolveEnvironment(choice,period),web.resolveEnvironment(choice,period));
 assert.throws(()=>environmentKey(0));assert.throws(()=>environmentKey(NaN));
});
test('fresh stores restore each account and persist only sanitized environment preferences',async()=>{
 const disk=new Map();const make=id=>createEnvironmentStore({read:async()=>disk.get(environmentKey(id))??null,write:async v=>{disk.set(environmentKey(id),v);}});
 const a=make(101),b=make(202);await Promise.all([a.hydrate(),b.hydrate()]);
 await a.update({selection:'library',motion:false,token:'discard'});await b.update({selection:'cafe'});
 const again=make(101);await again.hydrate();assert.deepEqual(again.getSnapshot().preferences,{selection:'library',motion:false});assert.deepEqual(b.getSnapshot().preferences,{selection:'cafe',motion:true});
 assert.deepEqual(Object.keys(JSON.parse(disk.get(environmentKey(101)))),['selection','motion']);
 await a.update(defaultEnvironment());assert.equal(b.getSnapshot().preferences.selection,'cafe');
});
test('late and cancelled hydration cannot overwrite previews or publish after blur',async()=>{
 let finish;const store=createEnvironmentStore({read:()=>new Promise(r=>finish=r),write:async()=>{}});
 const hydration=store.hydrate();await store.update({selection:'night'});finish('{"selection":"library"}');await hydration;assert.equal(store.getSnapshot().preferences.selection,'night');
 const read=store.hydrate();store.cancelHydration();finish('{"selection":"cafe"}');await read;assert.equal(store.getSnapshot().preferences.selection,'night');
});
test('read/write failures remain explicit and retry preserves preview',async()=>{
 let fail=true,saved;
 const store=createEnvironmentStore({read:async()=>{throw Error('unavailable')},write:async value=>{if(fail)throw Error('quota');saved=value;}});
 await store.hydrate();assert.equal(store.getSnapshot().ready,true);assert.match(store.getSnapshot().error,/could not be loaded/);
 await store.update({selection:'night'});assert.equal(store.getSnapshot().preferences.selection,'night');assert.match(store.getSnapshot().error,/could not be saved/);
 fail=false;await store.update({});assert.equal(store.getSnapshot().error,null);assert.equal(JSON.parse(saved).selection,'night');
});

test('Back retains a loaded panorama while a fresh read is pending or fails',async()=>{
 let finish,reads=0,fail=false;
 const store=createEnvironmentStore({read:()=>{if(fail)return Promise.reject(Error('disk'));if(reads++===0)return Promise.resolve('{"selection":"campus","motion":true}');return new Promise(r=>finish=r);},write:async()=>{}});
 await store.hydrate();const refresh=store.hydrate();
 const retained=store.getSnapshot();finish('{"selection":"library","motion":false}');await refresh;
 assert.equal(retained.ready,true,'A returning screen must not unmount the loaded panorama');
 assert.equal(retained.preferences.selection,'campus');assert.equal(store.getSnapshot().preferences.selection,'library');
 fail=true;await store.hydrate();assert.equal(store.getSnapshot().preferences.selection,'library');assert.match(store.getSnapshot().error,/last available selection/);
});
