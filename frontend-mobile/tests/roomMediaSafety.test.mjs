import './helpers/appearanceTestLoader.mjs';
import { registerHooks } from 'node:module';
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import React, { lazy, Suspense } from 'react';
import { renderToStaticMarkup, renderToReadableStream } from 'react-dom/server';
import { NativeModules, Platform, setExpoGo } from './helpers/roomMediaRuntimeMock.mjs';
let nativeImports=0;
registerHooks({ resolve(specifier,context,next){
  if(specifier==='expo'||specifier==='react-native')return {url:new URL('./helpers/roomMediaRuntimeMock.mjs',import.meta.url).href,shortCircuit:true};
  if(specifier.includes('NativeRoomMedia')) { nativeImports++;throw new Error('Regression: evaluated incompatible native SDK'); }
  return next(specifier,context);
}});
const {RoomMedia}=await import('../src/components/media/RoomMedia.tsx');
const {supportsRoomMedia,createRoomMediaLoader}=await import('../src/components/media/roomMediaLoader.ts');
const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
const {controls}=await import('./helpers/appearanceNativeMock.mjs');
const appearance=createAppearanceStore({read:async()=>null,write:async()=>{}}),h=React.createElement;
const render=()=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...appearance.getSnapshot(),setPreferences:appearance.setPreferences,retryPersistence:appearance.retryPersistence}},h(RoomMedia,{roomId:'fixture'})));
beforeEach(()=>{setExpoGo(true);Platform.OS='android';delete NativeModules.WebRTCModule;delete NativeModules.LivekitReactNativeModule;controls.clear();nativeImports=0;});
test('actual RoomMedia renders stable fallback in Expo Go without resolving any native import, even if module stubs exist',()=>{
 NativeModules.WebRTCModule={};NativeModules.LivekitReactNativeModule={};
 const html=render();assert.match(html,/Expo Go is not supported/);assert.match(html,/timer and room chat remain available/);assert.equal(controls.has('Open shared screens'),false);assert.equal(nativeImports,0);
});
test('non-Go binaries must contain both native modules; unknown/missing runtimes fail closed and web never loads SDKs',()=>{
 setExpoGo(false);assert.match(render(),/development build/);NativeModules.WebRTCModule={};assert.match(render(),/development build/);
 NativeModules.LivekitReactNativeModule={};assert.match(render(),/Open shared screens/);assert.equal(nativeImports,0,'A compatible binary still waits for user interaction');
 Platform.OS='web';assert.match(render(),/development build/);assert.equal(nativeImports,0);setExpoGo(new Error('Unavailable detection'));Platform.OS='android';assert.match(render(),/development build/);
 assert.equal(supportsRoomMedia({os:'windows',expoGo:false,webRTC:{},liveKit:{}}),false);
});
const Fallback=()=>h('span',null,'Stable media fallback');
async function renderLazy(loader){
 const Native=lazy(loader),errors=[];
 const stream=await renderToReadableStream(h(Suspense,{fallback:h('span',null,'Loading')},h(Native,{roomId:'fixture'})),{onError:error=>errors.push(error)});
 await stream.allReady;const html=await new Response(stream).text();assert.deepEqual(errors,[]);return html;
}
test('lazy loader checks runtime at invocation and never evaluates SDKs in Go, even for an already-open element',async()=>{
 let calls=0,available=true;const loader=createRoomMediaLoader(()=>available,async()=>{calls++;throw new Error('SDK must not evaluate');},Fallback);
 available=false;assert.match(await renderLazy(loader),/Stable media fallback/);assert.equal(calls,0);
});
test('undefined lazy defaults, absent namespaces and import rejection resolve to a valid fallback, not a React element-type error',async()=>{
 for(const module of [undefined,null,{}, {default:undefined},{default:{}},{default:Promise.resolve(Fallback)}]){
  assert.match(await renderLazy(createRoomMediaLoader(()=>true,async()=>module,Fallback)),/Stable media fallback/);
 }
 assert.match(await renderLazy(createRoomMediaLoader(()=>true,async()=>{throw new Error('Missing WebRTC');},Fallback)),/Stable media fallback/);
 assert.match(await renderLazy(createRoomMediaLoader(()=>{throw new Error('Unknown runtime');},async()=>{throw new Error('Never import');},Fallback)),/Stable media fallback/);
});
test('valid function and class default exports still load and render in a compatible development build',async()=>{
 const FunctionMedia=({roomId})=>h('span',null,`Viewer ${roomId}`);
 class ClassMedia extends React.Component {render(){return h('span',null,`Class viewer ${this.props.roomId}`);}}
 for(const component of [FunctionMedia,ClassMedia])assert.match(await renderLazy(createRoomMediaLoader(()=>true,async()=>({default:component}),Fallback)),/viewer fixture/i);
});
