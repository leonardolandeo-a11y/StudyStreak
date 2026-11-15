import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { controls, windowMetrics } from './helpers/appearanceNativeMock.mjs';
const { AppearanceContext }=await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore }=await import('../src/features/appearance/appearanceStore.ts');
const { AuthScreen }=await import('../src/components/auth/AuthScreen.tsx');
const { AuthButton }=await import('../src/components/auth/AuthControls.tsx');
const {default:SignIn}=await import('../src/app/sign-in.tsx');
const {default:SignUp}=await import('../src/app/sign-up.tsx');
const h=React.createElement,store=createAppearanceStore({read:async()=>null,write:async()=>{}});
const render=child=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences}},child));
const panelWidth=html=>Number(html.match(/<div[^>]*data-testid="auth-card"[^>]*>/)[0].match(/(?:style="|;)width:(\d+)px/)[1]);
test('auth panel fits portrait, native landscape and portrait keyboard resize without rotating the form',()=>{
 try{
  for(const [width,height]of [[320,844],[390,844],[768,1024]]){
   Object.assign(windowMetrics,{width,height,screenWidth:width,screenHeight:height});const html=render(h(AuthScreen,{title:'Welcome',description:'Study',footer:null}));
   assert.ok(panelWidth(html)<=Math.min(400,width-32));assert.match(html,/data-edges="top,right,bottom,left"/);
  }
  Object.assign(windowMetrics,{width:844,height:390,screenWidth:844,screenHeight:390});assert.ok(panelWidth(render(h(AuthScreen,{title:'Welcome',description:'Study',footer:null})))<=422);
  Object.assign(windowMetrics,{width:768,height:350,screenWidth:768,screenHeight:1024});assert.equal(panelWidth(render(h(AuthScreen,{title:'Welcome',description:'Study',footer:null}))),400,'keyboard resize on a portrait tablet must not trigger the side panel');
 }finally{Object.assign(windowMetrics,{width:390,height:844,screenWidth:390,screenHeight:844});}
});
test('retro login/register retain accessible fields and themed controls in ten family/mode pairs',async()=>{
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark']){
  await store.setPreferences({background,mode});controls.clear();const login=render(h(SignIn));
  assert.match(login,/auth-pixel-frame/);assert.match(login,/Welcome back/);assert.ok(controls.has('Username'));assert.ok(controls.has('Password'));assert.ok(controls.has('Sign in'));assert.ok(login.includes(store.getSnapshot().theme.colors.surface));
  controls.clear();const register=render(h(SignUp));assert.ok(controls.has('Email'));assert.ok(controls.has('Create account'));assert.match(register,/8–72 characters/);
 }
 let pressed=0;render(h(AuthButton,{title:'Submit',busy:true,onPress:()=>pressed++}));assert.equal(controls.get('Submit').disabled,true);assert.equal(controls.get('Submit').accessibilityState.busy,true);
 render(h(AuthButton,{title:'Submit',onPress:()=>pressed++}));controls.get('Submit').onPress();assert.equal(pressed,1);
});
