import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {studyPeriod,nextStudyBoundary,createStudyPeriodSchedule} from '../src/components/auth/studyPeriod.ts';
const at=(hour,minute=0)=>new Date(2026,10,9,hour,minute);
test('device-local boundaries select 05–12 morning, 12–18 afternoon and 18–05 night',()=>{
 for(const [hour,minute,expected]of [[0,0,'night'],[4,59,'night'],[5,0,'morning'],[11,59,'morning'],[12,0,'afternoon'],[17,59,'afternoon'],[18,0,'night'],[23,59,'night']])assert.equal(studyPeriod(at(hour,minute)),expected);
 for(const [hour,nextHour]of [[1,5],[5,12],[12,18],[18,5]]){const next=nextStudyBoundary(at(hour));assert.equal(next.getHours(),nextHour);assert.ok(next>at(hour));if(hour===18)assert.equal(next.getDate(),10);}
 assert.equal(nextStudyBoundary(new Date(2026,11,31,22)).getFullYear(),2027);
});
test('only one boundary timer exists; suspend cancels, foreground recalculates and dispose prevents restart',()=>{
 let now=at(4,59),serial=0;const timers=new Map(),published=[];
 const schedule=createStudyPeriodSchedule(value=>published.push(value),{now:()=>now,schedule(run,delay){const id=++serial;timers.set(id,{run,delay});return id;},cancel:id=>timers.delete(id)});
 assert.equal(timers.size,0);schedule.setActive(true);assert.equal(published.at(-1),'night');assert.equal([...timers.values()][0].delay,60000);
 const first=[...timers.values()][0];timers.clear();now=at(5);first.run();assert.equal(published.at(-1),'morning');assert.equal(timers.size,1);
 schedule.setActive(true);assert.equal(timers.size,1);schedule.setActive(false);assert.equal(timers.size,0);
 now=at(18,20);schedule.setActive(true);assert.equal(published.at(-1),'night');assert.equal(timers.size,1);
 schedule.dispose();schedule.dispose();assert.equal(timers.size,0);schedule.setActive(true);assert.equal(timers.size,0);
});
test('calendar boundary respects local DST instead of adding a fixed number of hours',()=>{
 const previous=process.env.TZ;
 try {
  process.env.TZ='America/New_York';
  const date=new Date(2026,2,8,1,30),next=nextStudyBoundary(date);
  assert.deepEqual({hour:next.getHours(),day:next.getDate(),hours:(next-date)/3600000},{hour:5,day:8,hours:2.5});
 } finally { if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous; }
});
test('Web and Native use identical generated scheduling code and scene geometry',()=>{
 for(const name of ['studyPeriod.ts','sceneData.ts'])assert.equal(readFileSync(new URL('../src/components/auth/'+name,import.meta.url),'utf8'),readFileSync(new URL('../../frontend-mobile/src/components/auth/'+name,import.meta.url),'utf8'));
});
