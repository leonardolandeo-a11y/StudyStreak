import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnvironmentStore, parseEnvironment, defaultEnvironment, resolveEnvironment, environmentKey } from '../src/features/environment/environmentPreferences.ts';
test('only environment ID and motion persist; invalid and old values normalize safely',()=>{
 for(const raw of [null,'bad','[]','null','{}'])assert.deepEqual(parseEnvironment(raw),defaultEnvironment());
 assert.deepEqual(parseEnvironment('{"selection":"invalid","motion":false,"token":"discard"}'),{selection:'automatic',motion:false});
 assert.deepEqual(parseEnvironment('{"selection":"library","motion":"false","email":"discard"}'),{selection:'library',motion:true});
});
test('automatic follows the three local time periods without weather inference; manual stays fixed',()=>{
 assert.equal(resolveEnvironment('automatic','morning'),'cafe');assert.equal(resolveEnvironment('automatic','afternoon'),'campus');assert.equal(resolveEnvironment('automatic','night'),'night');
 for(const id of ['campus','library','night','cafe'])for(const period of ['morning','afternoon','night'])assert.equal(resolveEnvironment(id,period),id);
});
test('two accounts restore independently without changing widget or appearance storage',()=>{
 const disk=new Map([['studystreak-dashboard-v1-101','keep-widgets'],['studystreak:appearance:v1','keep-theme']]);
 const make=id=>createEnvironmentStore({read:()=>disk.get(environmentKey(id))??null,write:value=>disk.set(environmentKey(id),value)});
 const a=make(101),b=make(202);a.hydrate();b.hydrate();a.update({selection:'library',motion:false});b.update({selection:'cafe'});
 const again=make(101);again.hydrate();assert.deepEqual(again.getSnapshot().preferences,{selection:'library',motion:false});
 assert.deepEqual(b.getSnapshot().preferences,{selection:'cafe',motion:true});assert.equal(disk.get('studystreak-dashboard-v1-101'),'keep-widgets');assert.equal(disk.get('studystreak:appearance:v1'),'keep-theme');
 a.update(defaultEnvironment());assert.deepEqual(a.getSnapshot().preferences,defaultEnvironment());assert.equal(b.getSnapshot().preferences.selection,'cafe');
 assert.throws(()=>environmentKey(-1));assert.throws(()=>environmentKey(NaN));
});
test('failed read/write are explicit; preview remains usable and retry can save',()=>{
 let fail=true, saved;
 const store=createEnvironmentStore({read:()=>{throw Error('blocked')},write:value=>{if(fail)throw Error('quota');saved=value;}});
 store.hydrate();assert.match(store.getSnapshot().error,/could not be loaded/);
 store.update({selection:'night'});assert.equal(store.getSnapshot().preferences.selection,'night');assert.match(store.getSnapshot().error,/could not be saved/);
 fail=false;store.update({});assert.equal(store.getSnapshot().error,null);assert.equal(JSON.parse(saved).selection,'night');
});
