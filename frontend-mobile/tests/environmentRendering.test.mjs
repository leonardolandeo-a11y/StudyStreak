import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import test from 'node:test';
import assert from 'node:assert/strict';
const {EnvironmentScene}=await import('../src/components/environment/EnvironmentScene.tsx');
const {StudyEnvironmentSettings}=await import('../src/components/environment/StudyEnvironmentSettings.tsx');
const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
const store=createAppearanceStore({read:async()=>null,write:async()=>{}});
const h=React.createElement;
const render=element=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences,retryPersistence:store.retryPersistence}},element));
test('local scenes and native selector render in all eight palettes without enabling motion during restoration',async()=>{
 for(const mode of ['dark','light'])for(const accent of ['mint','blue','purple','orange']){
  await store.setPreferences({mode,accent});const html=render(h(StudyEnvironmentSettings,{userId:101}));
  for(const name of ['Sunset Campus','Rainy Library','Night Desk','Cozy Café','Automatic','Ambient movement','Restore default environment'])assert.ok(html.includes(name));
  for(const id of ['campus','library','night','cafe']){const scene=render(h(EnvironmentScene,{sceneId:id,enabled:false}));assert.match(scene,new RegExp('environment-scene-'+id));assert.match(scene,/ambient-paused/);}
 }
});

test('Native masks and effects use the approved Web scene coordinates',async()=>{
 const {scenes:native}=await import('../src/components/environment/scenes.ts');
 const {scenes:web}=await import('../../frontend-web/src/components/environment/scenes.ts');
 for(const id of Object.keys(web))for(const field of ['panes','steam','effect'])assert.deepEqual(native[id][field],web[id][field]);
});

test('compact hero is artwork-only and its edge gradients follow all ten family/mode pairs',async()=>{
 const {StudyEnvironment}=await import('../src/components/environment/StudyEnvironment.tsx');
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark']){
  await store.setPreferences({background,mode});const html=render(h(StudyEnvironment));
  assert.match(html,/environment-edge-fade/);assert.match(html,/linear-gradient/);
  assert.ok(html.includes(store.getSnapshot().theme.colors.background));
  assert.doesNotMatch(html,/Good evening|Welcome back|Keep the momentum|Start focusing|Join a Study Room/);
 }
});
