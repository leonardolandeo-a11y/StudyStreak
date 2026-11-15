import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
const { AppearanceContext }=await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore }=await import('../src/features/appearance/appearanceStore.ts');
const { StudyPartnersBody }=await import('../src/components/social/StudyPartnersPanel.tsx');
const { controls }=await import('./helpers/appearanceNativeMock.mjs');
const appearance=createAppearanceStore({read:async()=>null,write:async()=>{}}),h=React.createElement;
const state={items:['ONLINE','OFFLINE','HIDDEN',null].map((status,index)=>({id:index+2,username:`p${index}`,name:`Partner ${index}`,presence:status?{status,lastSeenAt:status==='OFFLINE'?'2026-11-08T11:00:00Z':null}:null,avatar:null,imageError:false,profileReady:true})),page:0,pages:2,total:12,loading:false,refreshing:false,error:null,partial:false};
const render=props=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...appearance.getSnapshot(),setPreferences:appearance.setPreferences,retryPersistence:appearance.retryPersistence}},h(StudyPartnersBody,{state,onClose(){},onMember(){},onManage(){},onRetry(){},onPage(){},...props})));
test('all themes show explicit groups, authorized last activity, accessible rows and pagination without presence dots',async()=>{
  for(const mode of ['dark','light'])for(const accent of ['mint','blue','purple','orange']){
    await appearance.setPreferences({mode,accent});const html=render({});
    for(const text of ['Online','Offline','Other partners','Status hidden','Status unavailable','Last seen','Study Partners'])assert.ok(html.includes(text));
    assert.match(html,/initials/);assert.doesNotMatch(html,/●|Invite|Message|Chat/);assert.ok(controls.has('Open partner profile Partner 0'));assert.ok(controls.has('Next'));assert.match(controls.get('Open partner profile Partner 1').accessibilityHint,/Offline.*Last seen/);assert.match(controls.get('Open partner profile Partner 3').accessibilityHint,/Status unavailable/);assert.ok(html.includes(appearance.getSnapshot().theme.colors.success));
  }
});
test('panel close, navigation, retry and pagination delegate existing actions; empty/error/partial states remain distinct',()=>{
  const calls=[];render({onClose(){calls.push('close');},onMember(id){calls.push(id);},onManage(){calls.push('tracking');},onPage(page){calls.push(page);}});
  controls.get('Close Study Partners').onPress();controls.get('Open partner profile Partner 0').onPress();controls.get('Manage Tracking').onPress();controls.get('Next').onPress();assert.deepEqual(calls,['close',2,'tracking',1]);
  assert.match(render({state:{...state,items:[],pages:1}}),/No accepted study partners/);
  assert.match(render({state:{...state,items:[],error:'Fixture error'}}),/Fixture error/);assert.ok(controls.has('Retry Study Partners'));
  assert.match(render({state:{...state,partial:true}}),/Some partner details/);
});
