import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
const {StudyScene}=await import('../src/components/auth/StudyScene.tsx');
const {default:SignIn}=await import('../src/app/sign-in.tsx');const {default:SignUp}=await import('../src/app/sign-up.tsx');
const store=createAppearanceStore({read:async()=>null,write:async()=>{}}),h=React.createElement;
const render=element=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences,retryPersistence:store.retryPersistence}},element));
test('native scenes are local primitives with the same dimensions in each period, independent of functional theme',async()=>{
 for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
  await store.setPreferences({mode,accent,reduceMotion:true});
  for(const period of ['morning','afternoon','night']){const html=render(h(StudyScene,{period,width:288}));assert.match(html,new RegExp('study-scene-'+period));assert.doesNotMatch(html,/<svg|<img|https?:|blob:/);}
  for(const Screen of [SignIn,SignUp]){const html=render(h(Screen));assert.match(html,/Small sessions/);assert.match(html,/aria-label="Username"/);assert.match(html,/aria-label="Password"/);assert.ok(html.includes(store.getSnapshot().theme.colors.text));}
 }
});
