import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { moveWidgetTo, widgetDropIndex } = await import('../src/features/dashboard/widgetReorder.ts');
const { defaultWidgets } = await import('../src/features/dashboard/widgetPreferences.ts');
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { WidgetReorderList } = await import('../src/components/dashboard/WidgetReorderList.tsx');
const { StudyAnalyticsDetails } = await import('../src/components/focus/StudyAnalyticsDetails.tsx');
import { controls } from './helpers/appearanceNativeMock.mjs';
const store=createAppearanceStore({read:async()=>null,write:async()=>{}}),h=React.createElement;
const render=element=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences}},element));
test('drop moves either direction exactly once, clamps bounds and preserves visibility/source',()=>{
 const rows=defaultWidgets().map((row,index)=>({...row,visible:index%2===0}));
 for(const row of rows)for(let destination=0;destination<rows.length;destination++){
  const next=moveWidgetTo(rows,row.id,destination);assert.equal(next[destination].id,row.id);
  assert.deepEqual(next.filter(item=>item.id!==row.id),rows.filter(item=>item.id!==row.id));
  assert.equal(next[destination].visible,row.visible);
 }
 assert.equal(moveWidgetTo(rows,'quick',NaN),rows);assert.equal(moveWidgetTo(rows,'quick',7),rows);
 assert.equal(moveWidgetTo(rows,'quick',-1)[0].id,'quick');assert.equal(moveWidgetTo(rows,'quick',999).at(-1).id,'quick');
 const frames=[{y:16,height:80},{y:106,height:100},{y:216,height:80}];
 assert.equal(widgetDropIndex(0,frames),0);assert.equal(widgetDropIndex(150,frames),1);assert.equal(widgetDropIndex(1000,frames),2);assert.equal(widgetDropIndex(0,[]),-1);
});
test('handles expose position picker and native accessible actions without arrow controls',()=>{
 let saved,chosen;const announcements=[];const rows=defaultWidgets();
 render(h(WidgetReorderList,{rows,save:async next=>{saved=next;},choose:id=>{chosen=id;},announce:message=>announcements.push(message)}));
 const handle=controls.get('Reorder Study Streak');
 handle.onAccessibilityAction({nativeEvent:{actionName:'increment'}});assert.equal(saved[rows.findIndex(row=>row.id==='streak')+1].id,'streak');
 handle.onAccessibilityAction({nativeEvent:{actionName:'first'}});assert.equal(saved[0].id,'streak');
 handle.onPress();assert.equal(chosen,'streak');assert.match(announcements.at(-1),/position 1 of 9/);
 assert.equal(controls.has('Move Study Streak up'),false);
});
test('Journey references the external calendar or renders its own, using the same activity snapshot',()=>{
 const data={days:7,timeZone:'UTC',daily:[],weekly:[],monthly:[],byGoal:[],activity:[],hourly:[],activeDays:0,bestStudyStreak:0,completionPercent:null};
 const external=render(h(StudyAnalyticsDetails,{data,calendarExternal:true}));assert.match(external,/See the Activity Calendar widget/);assert.doesNotMatch(external,/recorded-activity-calendar/);
 const internal=render(h(StudyAnalyticsDetails,{data}));assert.equal((internal.match(/data-testid="recorded-activity-calendar"/g)||[]).length,1);
});

test('direct drag preserves hidden widgets and resolves two-column targets',async()=>{
 const {moveVisibleWidgetTo}=await import('../src/features/dashboard/widgetReorder.ts');
 const rows=defaultWidgets().map(row=>({...row,visible:row.id==='activity'||row.id==='quick'}));
 const next=moveVisibleWidgetTo(rows,'quick','activity');
 assert.equal(next[0].id,'quick');assert.deepEqual(next.filter(row=>!row.visible),rows.filter(row=>!row.visible));
 assert.equal(next.length,9);
 const grid=[{x:0,y:0,width:140,height:120},{x:154,y:0,width:140,height:120},{x:0,y:140,width:294,height:200}];
 assert.equal(widgetDropIndex(60,grid,200),1);assert.equal(widgetDropIndex(160,grid,40),2);
});
