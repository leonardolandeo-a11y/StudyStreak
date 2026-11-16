import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {roomLayoutFixture,token} from './helpers/roomLayoutFixture.mjs';
const fixture=roomLayoutFixture(),original=fixture.intercept;
let snapshot=null,revision=0;
fixture.intercept=async request=>{
 const reply=await original(request),path=new URL(request.url).pathname;
 if(!reply.status&&(path==='/api/study-rooms/room-fixture'||path.endsWith('/heartbeat')||path.endsWith('/timer')))reply.body={...reply.body,...snapshot,version:reply.body.version+revision};
 return reply;
};
const browser=await profileBrowser({desktopPointer:true,cacheDir:fileURLToPath(new URL('../../.local/f2-pomodoro/vite-cache/',import.meta.url)),intercept:fixture.intercept});
const output=new URL(process.env.ROOM_POMODORO_CAPTURES||'../../.local/captures/final-ui-f2-pomodoro/',import.meta.url);mkdirSync(output,{recursive:true});
const press=async name=>{await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>!b.disabled&&(b.getAttribute('aria-label')===${JSON.stringify(name)}||b.textContent.trim()===${JSON.stringify(name)}))`);await browser.evaluate(`(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>!b.disabled&&(b.getAttribute('aria-label')===${JSON.stringify(name)}||b.textContent.trim()===${JSON.stringify(name)}));b.click()})()`);};
const capture=async(name,selector)=>{
 const clip=await browser.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);
 const result=await browser.command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});writeFileSync(new URL(name+'.png',output),Buffer.from(result.data,'base64'));return result.data;
};
const inspect=selector=>browser.evaluate(`(()=>{const d=document.querySelector(${JSON.stringify(selector)}),circles=d.querySelectorAll('circle'),r=d.getBoundingClientRect(),t=d.querySelector('[role=timer]');return{width:r.width,height:r.height,radii:Array.from(circles,c=>c.r.baseVal.value),strokes:Array.from(circles,c=>getComputedStyle(c).strokeWidth),markers:d.querySelectorAll('rect').length,background:getComputedStyle(d).backgroundImage,shadow:getComputedStyle(t).textShadow,offset:Number(circles[1].getAttribute('stroke-dashoffset')),length:Number(circles[1].getAttribute('stroke-dasharray')),time:t.textContent,live:t.getAttribute('aria-live')}})()`);
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.confirm=()=>true;`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await browser.navigate('/focus-studio');await browser.wait('!!document.querySelector(".academic-dial")');
 await browser.evaluate(`window.studyStreakAppearance.apply({background:'lavender',mode:'dark',accent:'mint',reduceMotion:true})`);
 const reference=await inspect('.academic-dial'),focusImage=await capture('focus-reference','.academic-dial');
 await browser.navigate('/study-rooms');await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Campus study circle'))`);await browser.evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Campus study circle')).click()`);await browser.wait('!!document.querySelector(".room-dial")');
 await browser.evaluate(`window.studyStreakAppearance.apply({background:'lavender',mode:'dark',accent:'mint',reduceMotion:true})`);
 const shared=await inspect('.room-dial');assert.deepEqual(shared.radii,reference.radii);assert.deepEqual(shared.strokes,reference.strokes);assert.equal(shared.markers,reference.markers);assert.equal(shared.background,reference.background);assert.equal(shared.shadow,reference.shadow);assert.equal(shared.live,'off');assert.ok(Math.abs(shared.offset/shared.length-.2)<.002);
 const roomImage=await capture('shared-paused','.room-dial');
 // Two real screenshots, presented side by side for visual comparison only.
 await browser.evaluate(`(()=>{const box=document.createElement('div');box.id='dial-comparison';box.style='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;gap:48px;background:var(--ss-surface);color:var(--ss-text)';for(const [label,src] of [['Focus Studio',${JSON.stringify(focusImage)}],['Study Rooms · server clock',${JSON.stringify(roomImage)}]]){const card=document.createElement('div');card.style='text-align:center;font:600 18px sans-serif';const title=document.createElement('p');title.textContent=label;const image=document.createElement('img');image.src='data:image/png;base64,'+src;image.style='width:320px;height:320px;margin-top:20px';card.append(title,image);box.append(card)}document.body.append(box);return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))})()`);
 await browser.command('Emulation.setDeviceMetricsOverride',{width:900,height:480,deviceScaleFactor:1,mobile:false});const comparison=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('comparison.png',output),Buffer.from(comparison.data,'base64'));await browser.evaluate(`document.querySelector('#dial-comparison').remove()`);
 for(const width of [390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');const dial=await inspect('.room-dial');assert.ok(Math.abs(dial.width-dial.height)<1);
  const layout=await browser.evaluate(`(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,bottom:r.bottom}};return{panel:rect('.room-timer'),grid:rect('.room-layout'),dial:rect('.room-dial'),controls:rect('.room-timer-controls'),goal:rect('.room-goal')}})()`);
  assert.ok(layout.controls.y>=layout.dial.bottom,'Controls must be below the dial at every width');
  assert.ok(Math.abs(layout.dial.x+layout.dial.width/2-layout.panel.x-layout.panel.width/2)<1,'Dial must be horizontally centered');
  assert.ok(Math.abs(layout.panel.width-layout.grid.width)<1,'Timer panel must span its row');
  assert.ok(layout.goal.y>=layout.panel.bottom,'Private Goal and metrics remain below the timer');
  await capture('shared-'+width,'[aria-label="Shared Pomodoro"]');
 }
 await press('Start');await browser.wait(`document.querySelector('.room-timer-status').textContent==='Timer running'`);await capture('shared-running','.room-dial');await press('Pause');await browser.wait(`document.querySelector('.room-timer-status').textContent==='Timer paused'`);await press('Reset timer');await browser.wait(`document.querySelector('.room-time').textContent==='25:00'`);await press('5-min break');await browser.wait(`document.querySelector('.room-time').textContent==='05:00'`);await capture('shared-break','.room-dial');
 revision=100;snapshot={phase:'BREAK',timerStatus:'PAUSED',remainingSeconds:150,endsAt:null};await browser.evaluate(`window.dispatchEvent(new Event('online'))`);await browser.wait(`document.querySelector('.room-time').textContent==='02:30'`);const half=await inspect('.room-dial');assert.ok(Math.abs(half.offset/half.length-.5)<.001);
 snapshot=null;fixture.setConnectionFailure(true);await browser.evaluate(`window.dispatchEvent(new Event('online'))`);await browser.wait(`document.body.textContent.includes('Connection or action needs attention')`);await browser.evaluate(`Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'))`);await browser.wait(`document.querySelector('[aria-label="Reset timer"]').disabled`);fixture.setConnectionFailure(false);await browser.evaluate(`Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'))`);await browser.wait(`!document.querySelector('[aria-label="Reset timer"]').disabled`);
 fixture.setHost(false);await browser.evaluate(`window.dispatchEvent(new Event('online'))`);await browser.wait(`!document.querySelector('[aria-label="Host controls"]')`);assert.ok(await browser.evaluate(`document.querySelector('.room-timer').textContent.includes('Only the host')`));
 let combinations=0;
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
  assert.equal(await browser.evaluate(`(()=>{const e=document.querySelector('.room-dial-progress'),p=document.createElement('span');p.style.color='var(--ss-accent)';e.parentElement.after(p);const ok=getComputedStyle(e).stroke===getComputedStyle(p).color;p.remove();return ok})()`),true);
  assert.equal(await browser.evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);const dial=await inspect('.room-dial');assert.equal(dial.markers,12);assert.ok(Math.abs(dial.width-dial.height)<1);combinations++;
 }
 assert.deepEqual(fixture.requests.filter(r=>r.path.endsWith('/timer')).map(r=>r.body.action),['START','PAUSE','RESET','BREAK']);assert.ok(fixture.requests.filter(r=>r.path.endsWith('/timer')).every(r=>Number.isSafeInteger(r.body.expectedVersion)));assert.equal(fixture.requests.some(r=>/ledger|focus-sessions/.test(r.path)&&r.method!=='GET'),false);assert.deepEqual(browser.errors,[]);
 console.log(`Shared dial matches Focus geometry, markers, shading and accents; responsive, timer actions, half-break progress, reconnection, host permissions and ${combinations} appearances passed. Mock API only.`);
}finally{await browser.close();}
