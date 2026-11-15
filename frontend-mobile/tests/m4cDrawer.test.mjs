import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { controls } from './helpers/appearanceNativeMock.mjs';
import { authCalls } from './helpers/appearanceAuthMock.mjs';
const { AppearanceContext }=await import('../src/contexts/AppearanceContext.ts');
const { NavigationDataContext }=await import('../src/contexts/NavigationDataContext.tsx');
const { createAppearanceStore }=await import('../src/features/appearance/appearanceStore.ts');
const { StudyDrawerContent }=await import('../src/components/navigation/StudyDrawerContent.tsx');
const { skylinePixels }=await import('../src/components/navigation/SidebarSkyline.tsx');
const h=React.createElement,store=createAppearanceStore({read:async()=>null,write:async()=>{}});
const data={profile:{id:1,username:'ada',presentationName:'Ada Lovelace'},avatar:null,unread:7};
const render=()=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences}},h(NavigationDataContext.Provider,{value:data},h(StudyDrawerContent,{active:'dashboard',close(){},navigate(){}}))));
test('drawer preserves identity, badge, selected section and accessible single logout in ten family/mode pairs',async()=>{
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark']){
  await store.setPreferences({background,mode});controls.clear();const html=render();
  assert.match(html,/@ada/);assert.match(html,/Ada Lovelace/);assert.match(html,/width:80px;height:80px/);
  assert.equal((html.match(/drawer-selected-star/g)||[]).length,1);assert.equal(controls.get('Dashboard').accessibilityState.selected,true);
  assert.equal((html.match(/aria-label="Sign out"/g)||[]).length,1);assert.match(html,/unread-badge/);assert.match(html,/Animate StudyStreak cup/);
  assert.ok(html.indexOf('drawer-skyline')<html.indexOf('drawer-brand-actions'));assert.ok(html.includes(store.getSnapshot().theme.colors.error));
 }
 const before=authCalls.signOut;controls.get('Sign out').onPress();await Promise.resolve();assert.equal(authCalls.signOut,before+1);
});
test('native skyline reuses every original Web rectangle without drawing new artwork',()=>{
 const source=readFileSync(new URL('../../frontend-web/src/components/layout/SidebarSkyline.tsx',import.meta.url),'utf8');
 const original=JSON.parse(source.slice(source.indexOf('[\n'),source.indexOf('] as const;')+1).replace(/,\s*]/g,']'));
 assert.deepEqual(skylinePixels,original);
});
