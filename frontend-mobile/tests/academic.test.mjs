import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
const {AcademicHeading,AcademicPanel,AcademicEmpty,PixelProgress}=await import('../src/components/academic/Academic.tsx');
const h=React.createElement,store=createAppearanceStore({read:async()=>null,write:async()=>{}});
const render=element=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences,retryPersistence:store.retryPersistence}},element));
test('academic surfaces use the existing provider in all modes/palettes, with readable headers and truthful progress',async()=>{
 for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
  await store.setPreferences({mode,accent,reduceMotion:true});
  const html=render(h(AcademicPanel,{},h(AcademicHeading,{title:'Focus Studio',eyebrow:'YOUR FOCUS SPACE',focus:true}),h(PixelProgress,{value:25,max:100,label:'Session progress'}),h(AcademicEmpty,{},h('span',{},'No verified sessions yet.'))));
  assert.match(html,/aria-valuenow="25"/);assert.match(html,/aria-valuemax="100"/);assert.match(html,/role="header"/);assert.match(html,/aria-label="Session progress"/);assert.match(html,/pixel-glyph-book/);
  assert.ok(html.includes(store.getSnapshot().theme.colors.primary));assert.ok(html.includes(store.getSnapshot().theme.colors.surface));
  assert.doesNotMatch(html,/https?:|<svg|<canvas|99999/);
 }
});
