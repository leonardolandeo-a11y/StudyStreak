import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
const source=readFileSync(new URL('../public/appearance.js',import.meta.url),'utf8');
const prefix='studystreak:appearance:v2';
const defaults={mode:'system',background:'neutral',accent:'mint',reduceMotion:false};
const plain=value=>JSON.parse(JSON.stringify(value));
function setup(values=new Map(),tab=new Map(),denied=false){
 const storage=map=>({getItem:k=>{if(denied)throw Error('Denied');return map.get(k)??null;},setItem:(k,v)=>{if(denied)throw Error('Denied');map.set(k,v);},removeItem:k=>map.delete(k)});
 const context={window:{},document:{documentElement:{dataset:{}}},localStorage:storage(values),sessionStorage:storage(tab)};
 runInNewContext(source,context);return{api:context.window.studyStreakAppearance,root:context.document.documentElement.dataset,values,tab};
}
test('fresh and invalid configurations use Neutral/System and only known fields survive all combinations',()=>{
 for(const raw of [undefined,'broken','null','[]','true','{"background":"unknown","mode":"dawn","accent":"red"}']){
  const values=new Map(raw===undefined?[]:[[`${prefix}:42`,raw]]),{api}=setup(values);
  assert.deepEqual(plain(api.read(42)),defaults);
 }
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const accent of ['mint','blue','purple','orange']){
  const {api}=setup();api.activate(42);const pref={background,mode,accent,reduceMotion:true};assert.equal(api.save({...pref,token:'discard'}),true);assert.deepEqual(plain(api.read()),pref);
 }
});
test('a legacy browser preference is preserved unchanged, migrated once, and never inherited by another account',()=>{
 const previous={mode:'light',accent:'orange',reduceMotion:true},raw=JSON.stringify(previous),values=new Map([['studystreak:appearance:v1',raw]]);
 const {api,tab}=setup(values);assert.deepEqual(plain(api.read()),{...previous,background:'lavender'});
 api.activate(42);assert.deepEqual(plain(api.read()),{...previous,background:'lavender'});assert.equal(values.get('studystreak:appearance:v1'),raw);
 api.save({...defaults,background:'sage'});api.activate(77);assert.deepEqual(plain(api.read()),defaults);
 api.save({...defaults,background:'sky',accent:'purple'});api.activate(42);assert.equal(api.read().background,'sage');
 const restarted=setup(values,tab);assert.equal(restarted.root.background,'sage');assert.equal(restarted.root.theme,'system');
 restarted.api.activate(null);assert.deepEqual(plain(restarted.api.read()),defaults);
 restarted.api.save({...defaults,background:'amber'});restarted.api.activate(88);assert.deepEqual(plain(restarted.api.read()),defaults,'guest changes do not initialize a new account');
});
test('restore writes only appearance for its account; damaged scoped preferences do not resurrect legacy values',()=>{
 const untouched=new Map([['studystreak:study-environment:v1:42','environment'],['studystreak-dashboard-v1-42','widgets'],['focus-settings','focus']]);
 const {api,values}=setup(new Map(untouched));api.activate(42);api.save({...defaults,background:'lavender',accent:'blue'});api.save(api.defaults);
 assert.deepEqual(plain(api.read()),defaults);for(const [key,value]of untouched)assert.equal(values.get(key),value);
 values.set('studystreak:appearance:v1',JSON.stringify({mode:'dark',accent:'blue'}));values.set(`${prefix}:42`,'bad');assert.deepEqual(plain(api.read()),defaults);
 assert.equal(api.save(defaults,0),false);assert.equal(api.save(defaults,NaN),false);
});
test('storage denial leaves static appearance usable without writing secrets or tokens',()=>{
 const {api,root}=setup(new Map(),new Map(),true);api.activate(42);assert.equal(api.save(defaults),false);api.apply({...defaults,background:'sage',mode:'dark'});assert.equal(root.background,'sage');assert.equal(root.theme,'dark');assert.deepEqual(plain(api.read()),defaults);
});
