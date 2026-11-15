import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { controls } from './helpers/appearanceNativeMock.mjs';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { MenuActionContext } = await import('../src/contexts/MenuActionContext.tsx');
const { MenuTabBar } = await import('../src/components/navigation/MenuTabBar.tsx');
const { PageControls } = await import('../src/components/ui/PageControls.tsx');
const { AppIcon } = await import('../src/components/ui/AppIcon.tsx');
const { ValidationPartnerRow } = await import('../src/components/validations/ValidationPartnerRow.tsx');
const { menuTabs } = await import('../src/features/navigation/menu.ts');
const h=React.createElement,store=createAppearanceStore({read:async()=>null,write:async()=>{}});
const render=child=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences}},child));
test('pixel goal action follows all forty family/mode/accent pairs and retains its callback',async()=>{
 let created=0;
 const state={routes:menuTabs.map(item=>({name:item.name,key:item.name})),index:0};
 const bar=index=>h(MenuActionContext.Provider,{value:{action:{label:'Create a goal',hidden:false,run:()=>created++},setAction(){}}},h(MenuTabBar,{state:{...state,index},insets:{bottom:8},emitter:{emit:()=>({})},navigateToTab(){}}));
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark'])for(const accent of ['mint','blue','purple','orange']){
  await store.setPreferences({background,mode,accent,reduceMotion:true});controls.clear();
  const html=render(bar(0));assert.match(html,/pixel-goal-action/);assert.ok(html.includes(store.getSnapshot().theme.colors.primary));
  controls.get('Create a goal').onPress();assert.equal(controls.get('Create a goal').disabled,false);
  for(const name of ['copy','refresh','chevron-left','chevron-right','check'])assert.doesNotThrow(()=>render(h(AppIcon,{name,color:store.getSnapshot().theme.colors.primary})));
 }
 assert.equal(created,40);assert.doesNotMatch(render(bar(1)),/pixel-goal-action/);
});
test('compact pagination keeps accessible names, bounds and the original target pages',()=>{
 const changes=[];
 controls.clear();const first=render(h(PageControls,{compact:true,page:0,totalPages:3,onChange:p=>changes.push(p)}));
 assert.match(first,/icon-chevron-left/);assert.match(first,/icon-chevron-right/);assert.doesNotMatch(first,/>Previous<|>Next</);
 assert.equal(controls.get('Previous').disabled,true);controls.get('Next').onPress();assert.deepEqual(changes,[1]);
 render(h(PageControls,{compact:true,page:2,totalPages:3,onChange:p=>changes.push(p)}));assert.equal(controls.get('Next').disabled,true);controls.get('Previous').onPress();assert.deepEqual(changes,[1,1]);
 assert.equal(render(h(PageControls,{compact:true,page:0,totalPages:1,onChange(){}})),'');
 assert.match(render(h(PageControls,{page:0,totalPages:3,onChange(){}})),/>Previous</,'other screens retain the default controls');
});
test('partner selection has one action and no fabricated zero while count loads',()=>{
 let selected=0;controls.clear();
 const html=render(h(ValidationPartnerRow,{id:3,name:'LunaStudy',selected:true,onSelect:()=>selected++}));
 assert.match(html,/Loading Goals/);assert.doesNotMatch(html,/0 Goals|Review goals from/);
 assert.equal(controls.get('Select tracking partner LunaStudy').accessibilityState.selected,true);
 controls.get('Select tracking partner LunaStudy').onPress();assert.equal(selected,1);
});
