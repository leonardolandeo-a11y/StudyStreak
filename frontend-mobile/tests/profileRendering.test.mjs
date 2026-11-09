import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { NavigationDataContext } = await import('../src/contexts/NavigationDataContext.tsx');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { ProfileCover } = await import('../src/components/profile/ProfileCover.tsx');
const { ProfileImageControls } = await import('../src/components/profile/ProfileImageControls.tsx');
const { ProfileEditor } = await import('../src/components/profile/ProfileEditor.tsx');
const { ProfileStudyStats } = await import('../src/components/profile/ProfileStudyStats.tsx');
const { StudyDrawerContent } = await import('../src/components/navigation/StudyDrawerContent.tsx');
const { controls } = await import('./helpers/appearanceNativeMock.mjs');
const appearance=createAppearanceStore({read:async()=>null,write:async()=>{}}),h=React.createElement;
const profile={id:1,username:'ada',displayName:'Ada',presentationName:'Ada',bio:'Algebra',statistics:{verifiedMinutes:12.5,verifiedSessions:2,studyStreak:3,bestStudyStreak:9,activeGoals:1}};
const render=(element,data={})=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...appearance.getSnapshot(),setPreferences:appearance.setPreferences,retryPersistence:appearance.retryPersistence}},h(NavigationDataContext.Provider,{value:{profile,avatar:null,banner:null,unread:0,releaseImage(){},...data}},element)));
test('profile cover, editor and stats support all palettes/modes with visible, distinct verification labels',async()=>{
  for(const mode of ['dark','light'])for(const accent of ['mint','blue','purple','orange']){
    await appearance.setPreferences({mode,accent});
    const html=render(h(React.Fragment,null,h(ProfileCover,{avatar:'file:///private/avatar.png',banner:'file:///private/banner.png',name:'Ada'}),h(ProfileStudyStats,{statistics:profile.statistics}),h(ProfileEditor,{profile,onClose(){},onSaved(){}})));
    assert.ok(html.includes('file:///private/banner.png')); assert.ok(html.includes('file:///private/avatar.png')); assert.match(html,/margin-top:-32px/);
    assert.match(html,/Verified focus time/); assert.match(html,/12.5/); assert.match(html,/Includes historical study records/);
    for(const label of ['Display name','Bio','Select avatar','Select banner','Save changes','Cancel'])assert.ok(controls.has(label));
    assert.doesNotMatch(html,/aria-label="(?:Username|Email|Password|Back)"/); assert.ok(html.includes(appearance.getSnapshot().theme.colors.text));
  }
});
test('fallback and refreshed drawer identity use the shared profile and private cached URI',()=>{
  assert.match(render(h(ProfileCover,{avatar:null,banner:null,name:'Ada'})),/initials/);
  const html=render(h(StudyDrawerContent,{active:'dashboard',close(){},navigate(){}}),{profile:{...profile,presentationName:'Updated Ada'},avatar:'file:///private/updated.png'});
  assert.match(html,/Updated Ada/); assert.match(html,/file:\/\/\/private\/updated.png/);
  assert.equal(render(h(ProfileStudyStats,{})),'');
});

test('image controls retain selected, disabled and loading semantics with compact shared actions',()=>{
  const props={slot:'avatar',change:null,busy:false,picking:false,onSelect(){},onRemove(){},onUndo(){}};
  render(h(ProfileImageControls,{...props,change:{uri:'file:///preview.png',name:'Selected.png',type:'image/png',size:100}}));
  assert.equal(controls.get('Select avatar').accessibilityState.selected,true);
  render(h(ProfileImageControls,{...props,change:'remove'}));
  assert.equal(controls.get('Remove avatar').disabled,true);
  assert.equal(controls.get('Undo avatar change').disabled,false);
  render(h(ProfileImageControls,{...props,busy:true,picking:true}));
  assert.equal(controls.get('Select avatar').accessibilityState.busy,true);
  assert.equal(controls.get('Remove avatar').disabled,true);
});
