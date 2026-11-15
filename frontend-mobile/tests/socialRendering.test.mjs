import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
const { AppearanceContext }=await import('../src/contexts/AppearanceContext.ts');
const { SocialContext }=await import('../src/contexts/SocialContext.tsx');
const { createAppearanceStore }=await import('../src/features/appearance/appearanceStore.ts');
const { PresenceLabel }=await import('../src/components/social/PresenceLabel.tsx');
const { MemberProfileContent }=await import('../src/components/social/MemberProfileContent.tsx');
const { SocialPrivacySettings }=await import('../src/components/social/SocialPrivacySettings.tsx');
const { controls }=await import('./helpers/appearanceNativeMock.mjs');
const h=React.createElement,appearance=createAppearanceStore({read:async()=>null,write:async()=>{}});
const render=(element,social=null)=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...appearance.getSnapshot(),setPreferences:appearance.setPreferences,retryPersistence:appearance.retryPersistence}},h(SocialContext.Provider,{value:social},element)));
const profile={id:3,username:'partner',presentationName:'Partner',bio:'Algebra',registrationDate:'2026-01-04',statistics:{},presence:{status:'HIDDEN',lastSeenAt:null,serverNow:'2026-11-08T12:00:00Z'}};
const member={status:'ready',profile,avatar:'file:///private/avatar.png',banner:'file:///private/banner.png',imageError:false};
test('presence is textual, never infers offline, and only displays server-provided last activity',()=>{
  for(const [status,label] of [['ONLINE','Online'],['OFFLINE','Offline'],['HIDDEN','Status hidden']]){
    const html=render(h(PresenceLabel,{presence:{...profile.presence,status}}));assert.ok(html.includes(label));assert.doesNotMatch(html,/Last seen|●/);
    if(status==='ONLINE')assert.ok(html.includes(appearance.getSnapshot().theme.colors.success));
  }
  const unknown=render(h(PresenceLabel,{presence:null}));assert.match(unknown,/Status unavailable/);assert.doesNotMatch(unknown,/Offline/);
  assert.match(render(h(PresenceLabel,{presence:{...profile.presence,lastSeenAt:'2026-11-08T11:00:00Z'}})),/Last seen/);
});
test('member view reuses own Profile visual primitives in all eight themes without exposing unshared stats or edit controls',async()=>{
  for(const mode of ['dark','light'])for(const accent of ['mint','blue','purple','orange']){
    await appearance.setPreferences({mode,accent});let html=render(h(MemberProfileContent,{member,onRefresh(){}}));
    assert.match(html,/Joined Jan 4, 2026/);assert.match(html,/Status hidden/);assert.match(html,/file:\/\/\/private\/avatar.png/);
    assert.doesNotMatch(html,/Edit Profile|Display name|Verified focus time|Verified sessions/);
    html=render(h(MemberProfileContent,{member:{...member,profile:{...profile,registrationDate:null,statistics:{verifiedMinutes:8},presence:null}},onRefresh(){}}));
    assert.match(html,/Verified focus time/);assert.doesNotMatch(html,/Verified sessions|Joined |Last seen|Offline/);assert.match(html,/Status unavailable/);
    const denied=render(h(MemberProfileContent,{member:{status:'unavailable',profile:null,avatar:null,banner:null,imageError:false},onRefresh(){}}));assert.match(denied,/Profile unavailable/);assert.doesNotMatch(denied,/Partner|Algebra|private\/avatar/);
  }
});
test('privacy switches reflect confirmed booleans and remain disabled until loaded or while saving',()=>{
  const privacy={showPresence:false,showLastSeen:true,shareVerifiedMinutes:false,shareVerifiedSessions:true};
  for(const saving of [false,true]){
    const state={privacy,loading:false,saving,saved:false,error:null,presence:null};
    render(h(SocialPrivacySettings),{presence:{subscribe:()=>()=>{},getSnapshot:()=>state}});
    assert.equal(controls.get('Show online status').value,false);assert.equal(controls.get('Share last activity').value,true);
    assert.equal(controls.get('Share verified sessions').disabled,saving);
  }
  render(h(SocialPrivacySettings));assert.equal(controls.get('Show online status').disabled,true);
});
