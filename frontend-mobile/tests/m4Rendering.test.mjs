import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { controls } from './helpers/appearanceNativeMock.mjs';
const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
const {SharedRoomDial}=await import('../src/components/study/SharedRoomDial.tsx');
const {RoomModeration}=await import('../src/components/media/RoomModeration.tsx');
const {NotificationCard}=await import('../src/components/notifications/NotificationCard.tsx');
const {NotificationPopups}=await import('../src/components/notifications/NotificationPopups.tsx');
const {LocalMusicLibrary}=await import('../src/components/focus/LocalMusicLibrary.tsx');
const {notificationRoute}=await import('../src/features/notifications/notificationRoute.ts');
const h=React.createElement,appearance=createAppearanceStore({read:async()=>null,write:async()=>{}});
const render=child=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...appearance.getSnapshot(),setPreferences:appearance.setPreferences}},child));
const notification={id:1,type:'DAILY_RECORD_CREATED',message:'Review this record',createdAt:'2026-11-14T12:00:00Z',read:false,relatedGoalId:7,relatedDailyRecordId:11};
test('room, local library and notification surfaces follow ten family/mode pairs',async()=>{
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark']){
  await appearance.setPreferences({background,mode,accent:'orange',reduceMotion:true});controls.clear();
  const colors=appearance.getSnapshot().theme.colors;
  const dial=render(h(SharedRoomDial,{seconds:1200,phase:'FOCUS',time:'20:00',status:'Paused'}));assert.match(dial,/shared-pomodoro-circle/);assert.ok(dial.includes(colors.surfaceRaised));
  const host={id:'r',host:true,members:[{userId:2,username:'Luna',host:false}]};
  const moderation=render(h(RoomModeration,{room:host,disabled:true}));assert.ok(moderation.includes(colors.error));assert.equal(controls.get('Remove Luna from room').disabled,true);
  assert.equal(render(h(RoomModeration,{room:{...host,host:false}})),'');
  const card=render(h(NotificationCard,{notification,busy:false,disabled:false,onOpen(){},onMarkRead(){},onDelete(){}}));assert.ok(card.includes(colors.error));assert.ok(controls.has('Delete notification'));assert.equal(controls.has('Delete'),false);
  const popups=render(h(NotificationPopups,{userId:1,notifications:[notification],dismiss(){},refresh:async()=>{}}));assert.match(popups,/notification-popup-1/);assert.ok(popups.includes(colors.surfaceRaised));assert.match(popups,/Dismiss notification 1/);
  const music={tracks:[],activeId:null,playing:false,loading:false,error:null,importError:null,importing:false,importMusic:async()=>{},remove(){},pause(){},play:async()=>{}};
  assert.match(render(h(LocalMusicLibrary,{music,ready:true})),/Import Music/);
 }
});
test('floating notifications use the existing contextual destinations',()=>{
 assert.deepEqual(notificationRoute(notification),{pathname:'/(app)/goals/[goalId]/records/[recordId]',params:{goalId:'7',recordId:'11',review:'1'}});
 assert.equal(notificationRoute({...notification,type:'TRACKING_REQUESTED'}),'/tracking');
 assert.deepEqual(notificationRoute({...notification,type:'GOAL_COMPLETED'}),{pathname:'/(app)/goals/[goalId]',params:{goalId:'7'}});
});
