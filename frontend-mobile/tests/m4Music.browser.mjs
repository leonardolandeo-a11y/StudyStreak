import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { environmentFixture } from '../../scripts/tests/studyEnvironmentFixture.mjs';
const requests=[];const browser=await mobileBrowser({intercept:request=>{requests.push({path:new URL(request.url).pathname,method:request.method});return environmentFixture(request);}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const folder=await mkdtemp(join(tmpdir(),'m4-music-'));
const paths=['m4-one.wav','m4-two.wav'].map(name=>join(folder,name));
for(const [index,path] of paths.entries()){
 const samples=16000*20,bytes=Buffer.alloc(44+samples*2);
 bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(16000,24);bytes.writeUInt32LE(32000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++)bytes.writeInt16LE(Math.round(Math.sin(i/16000*2*Math.PI*(220+index*110))*3000),44+i*2);
 await writeFile(path,bytes);
}
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__players=[];const OriginalAudio=window.Audio;window.Audio=function(...args){const a=new OriginalAudio(...args);window.__players.push(a);return a;};window.__urls=[];window.__revoked=[];const originalCreate=URL.createObjectURL.bind(URL),originalRevoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=blob=>{const u=originalCreate(blob);window.__urls.push(u);return u;};URL.revokeObjectURL=u=>{window.__revoked.push(u);originalRevoke(u);};`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});await browser.command('Page.setInterceptFileChooserDialog',{enabled:true});
 await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');await browser.wait(has('Open menu'));await browser.click('Open menu');await browser.click('Focus Studio');await browser.waitForDrawerClosed();await browser.wait(has('Import Music'));
 await browser.click('Import Music');await browser.wait(`!!document.querySelector('input[aria-label="Choose local audio files"]')`);
 const {root}=await browser.command('DOM.getDocument');const {nodeId}=await browser.command('DOM.querySelector',{nodeId:root.nodeId,selector:'input[aria-label="Choose local audio files"]'});
 await browser.command('DOM.setFileInputFiles',{nodeId,files:paths});await browser.wait(has('Play m4-one.wav'));
 for(const width of [320,390]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 }
 await browser.click('Play m4-one.wav');await browser.wait(has('Pause m4-one.wav'));await browser.wait(`window.__players.some(p=>!p.paused)`);
 await browser.click('Pause m4-one.wav');await browser.wait(`window.__players.every(p=>p.paused)`);
 await browser.click('Play m4-one.wav');await browser.wait(has('Pause m4-one.wav'));
 await browser.click('Play m4-two.wav');await browser.wait(has('Pause m4-two.wav'));assert.equal(await browser.evaluate('window.__players.filter(p=>!p.paused).length'),1);
 // Simulate horizontal touch scrolling on Expo Web, then select an offscreen card.
 const y=await browser.evaluate(`(()=>{const e=document.querySelector('[aria-label="Soundscape carousel"]');e.scrollIntoView({block:'center'});return e.getBoundingClientRect().top+80;})()`);
 for(let swipe=0;swipe<5;swipe++){
  await browser.command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y}]});
  for(let x=300;x>=70;x-=30)await browser.command('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  await browser.command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await browser.wait(`document.querySelector('[aria-label="Soundscape carousel"]').scrollLeft>0`);
 await browser.evaluate(`document.querySelector('[aria-label="Play After the Rain"]').focus()`);
 await browser.click('Play After the Rain');await browser.wait(has('Pause soundscape'));assert.equal(await browser.evaluate('window.__players.filter(p=>!p.paused).length'),1);
 await browser.click('Play m4-one.wav');await browser.wait(has('Pause imported music'));assert.equal(await browser.evaluate('window.__players.filter(p=>!p.paused).length'),1);
 await browser.click('Remove m4-one.wav');await browser.wait('!'+has('Remove m4-one.wav'));await browser.wait('window.__players.every(p=>p.paused)');assert.ok(await browser.evaluate('window.__revoked.length>=1'));
 assert.equal(await browser.evaluate(`Object.values(localStorage).some(value=>/m4-one\\.wav|m4-two\\.wav|blob:/.test(value))`),false);
 await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();await browser.wait('window.__players.every(p=>p.paused)');await browser.wait('window.__revoked.length>=2');
 await browser.click('Open menu');await browser.click('Focus Studio');await browser.waitForDrawerClosed();await browser.wait(has('Import Music'));assert.equal(await browser.evaluate(`document.body.textContent.includes('m4-two.wav')`),false);
 assert.deepEqual(requests.filter(request=>request.method!=='GET'&&request.path!=='/login'),[]);assert.deepEqual(browser.errors,[]);
 console.log('M4 music passed: real WAV import/decoding, pause/resume/switch, soundscape exclusion, URL cleanup on removal/blur and no uploads/preferences.');
}finally{await browser.close();await rm(folder,{recursive:true,force:true});}
