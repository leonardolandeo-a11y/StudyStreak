import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
const {StudyMark,StudyBrand}=await import('../src/components/branding/StudyBrand.tsx');
const {default:geometry}=await import('../src/components/branding/mark.ts');
const appearance=createAppearanceStore({read:async()=>null,write:async()=>{}}),h=React.createElement;
const render=element=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...appearance.getSnapshot(),setPreferences:appearance.setPreferences,retryPersistence:appearance.retryPersistence}},element));
test('native pixel mark and lockups use real theme roles across modes/palettes and keep a single accessible identity',async()=>{
 for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
  await appearance.setPreferences({mode,accent,reduceMotion:true});
  for(const size of [16,24,32,48,96]){
   const html=render(h(StudyMark,{size}));assert.match(html,/StudyStreak coffee mark/);assert.ok(html.includes(appearance.getSnapshot().theme.colors.primary));assert.doesNotMatch(html,/<img|<svg|blob:|https?:/);
  }
  for(const variant of ['navigation','compact','signature']){
   const html=render(h(StudyBrand,{variant}));assert.equal((html.match(/aria-label="StudyStreak"/g)||[]).length,1);assert.match(html,/Study/);assert.match(html,/Streak/);
  }
 }
 for(const [x,y,w,height]of geometry.rects)assert.ok(x+w<=32&&y+height<=32);
});
