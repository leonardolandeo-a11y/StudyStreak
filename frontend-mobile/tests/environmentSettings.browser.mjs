import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {mobileBrowser} from './helpers/mobileBrowser.mjs';
import {environmentFixture} from '../../scripts/tests/studyEnvironmentFixture.mjs';
let owner=101;const writes=[];
const tokenFor=id=>'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:id,sub:'Fixture Student',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
const root=resolve(process.env.STUDY_ENV_CAPTURES||'../docs/images/academia-pixel-viva-8-3b');mkdirSync(root,{recursive:true});
const browser=await mobileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;
 if(path==='/login')return {body:{token:tokenFor(owner),refreshToken:'fixture-only'}};
 if(request.method!=='GET')writes.push(path);
 if(path==='/api/profile')return {body:{id:owner,username:'Fixture Student',presentationName:'Fixture Student'}};
 if(path===`/users/${owner}/goals`&&owner!==101)return {body:{content:[],totalPages:0,totalElements:0,last:true}};
 return environmentFixture(request);
}});
const hero='[data-testid="study-environment"]', preview='[data-testid="environment-preview"]';
const key=id=>`studystreak:study-environment:v1:${id}`;
const labels={campus:'Sunset Campus',library:'Rainy Library',night:'Night Desk',cafe:'Cozy Café'};
const widgetLayout=JSON.stringify(['focus-summary','streak','activity','goals','journey','recent','partners','quick'].map(id=>({id,visible:id!=='partners'})));
const reset=`window.scrollTo(0,0);Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`;
const capture=async name=>{
 await browser.evaluate(reset);await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 const r=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`${name}.png`),Buffer.from(r.data,'base64'));
};
const loaded=async id=>{
 await browser.wait(`(()=>{const e=document.querySelector('${hero}');return e&&!e.closest('[aria-hidden="true"]')&&!!e.querySelector('[data-testid="environment-scene-${id}"]');})()`);
 await browser.wait(`(()=>{const imgs=Array.from(document.querySelectorAll('${hero} img'));return imgs.length>0&&imgs.every(i=>i.complete&&i.naturalWidth>0);})()`);
};
const settings=async()=>{await browser.click('Open menu');await browser.click('Settings');await browser.wait(`!!document.querySelector('[aria-label="Select Sunset Campus"]')`);};
const back=async id=>{await browser.evaluate('history.back()');await browser.waitForDrawerClosed();await loaded(id);};
const pick=async id=>{
 await browser.click(id==='automatic'?'Automatic':`Select ${labels[id]}`);
 await browser.wait(`JSON.parse(localStorage.getItem('${key(owner)}'))?.selection==='${id}'`);
};
const login=async()=>{
 await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
 await browser.fill('[aria-label="Username"]','Fixture Student');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');
 await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();
};
const active=running=>browser.wait(`!!document.querySelector('${hero} [data-testid="ambient-${running?'running':'paused'}"]')`);
try{
 await browser.command('Emulation.setTimezoneOverride',{timezoneId:'America/Lima'});
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`if(!localStorage.getItem('studystreak-dashboard-v1-101'))localStorage.setItem('studystreak-dashboard-v1-101',${JSON.stringify(widgetLayout)});window.__environmentNow=new Date(2026,10,13,15).getTime();window.__RealDate=Date;window.Date=class extends Date{constructor(...args){super(...(args.length?args:[window.__environmentNow]));}static now(){return window.__RealDate.now();}};window.__environmentHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__environmentHidden});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__environmentHidden?'hidden':'visible'});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:1050,deviceScaleFactor:1,mobile:true});
 await browser.navigate('/');await login();await loaded('campus');
 for(const id of Object.keys(labels)){
  await settings();await pick(id);await browser.wait(`!!document.querySelector('${preview} [data-testid="environment-scene-${id}"]')`);
  if(id==='library'){
   for(const width of [320,390,768]){
    await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:true});
    await browser.evaluate(`document.querySelector('[data-testid="environment-settings"]').scrollIntoView({block:'center'})`);
    assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid^="environment-thumbnail-"]')).every(e=>{const r=e.getBoundingClientRect();return r.width>0&&Math.abs(r.width/r.height-3)<.05;})`),true,'Native thumbnails retain the full 3:1 panorama');
    const r=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`settings-${width}.png`),Buffer.from(r.data,'base64'));
   }
  }
  await back(id);await active(true);
  const effect=id==='library'||id==='night'?'environment-rain-0':'environment-clouds-0';
  const property='transform'; // Night Desk uses rain in the final study-v2 artwork.
  const before=await browser.evaluate(`getComputedStyle(document.querySelector('${hero} [data-testid="${effect}"]')).${property}`);
  await new Promise(r=>setTimeout(r,450));assert.notEqual(await browser.evaluate(`getComputedStyle(document.querySelector('${hero} [data-testid="${effect}"]')).${property}`),before);
  for(const width of [320,390,768]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture(`${id}-${width}`);
   if(width===390){const box=await browser.evaluate(`(()=>{const r=document.querySelector('${hero}').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);const r=await browser.command('Page.captureScreenshot',{format:'png',clip:box});writeFileSync(resolve(root,`${id}-hero.png`),Buffer.from(r.data,'base64'));}
  }
  assert.equal(await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`),widgetLayout);
 }
 // Manual choice survives a period change; automatic uses the approved Web mapping.
 await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__environmentNow=new window.__RealDate(2026,10,13,22).getTime();window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'));`);await loaded('cafe');
 await settings();await pick('automatic');await back('night');
 for(const [hour,id]of [[9,'cafe'],[15,'campus'],[22,'night']]){
  await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__environmentNow=new window.__RealDate(2026,10,13,${hour}).getTime();window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'));`);await loaded(id);
 }
 await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);await active(false);
 const steam=`getComputedStyle(document.querySelector('${hero} [data-testid="environment-steam"]')).transform`;
 const paused=await browser.evaluate(steam);await new Promise(r=>setTimeout(r,150));assert.equal(await browser.evaluate(steam),paused);
 await browser.evaluate(`window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await active(true);
 await settings();await pick('library');await browser.evaluate(`document.querySelector('[aria-label="Ambient movement"]').click()`);await back('library');await active(false);
 await browser.reload();await login();await loaded('library');await active(false);
 const preference=await browser.evaluate(`localStorage.getItem('${key(101)}')`);
 owner=202;await browser.reload();await login();await loaded('campus');await active(true);assert.equal(await browser.evaluate(`localStorage.getItem('${key(202)}')`),null);
 owner=101;await browser.reload();await login();await loaded('library');assert.equal(await browser.evaluate(`localStorage.getItem('${key(101)}')`),preference);await active(false);
 await settings();await browser.evaluate(`document.querySelector('[aria-label="Ambient movement"]').click()`);await back('library');await active(true);
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await active(false);
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await active(true);
 await settings();await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);await back('library');await active(false);
 const unchanged=await browser.evaluate(`localStorage.getItem('${key(101)}')`);
 for(const mode of ['Dark','Light','System'])for(const accent of ['Mint','Blue','Purple','Orange']){
  await settings();await browser.click(mode);await browser.click(accent);await back('library');await active(false);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  assert.equal(await browser.evaluate(`localStorage.getItem('${key(101)}')`),unchanged);
  if(mode==='Light'&&accent==='Orange')await capture('library-light-orange');
 }
 await settings();await browser.click('Restore default environment');await browser.wait(`JSON.parse(localStorage.getItem('${key(101)}')).selection==='automatic'&&JSON.parse(localStorage.getItem('${key(101)}')).motion===true`);await back('campus');
 assert.equal(await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`),widgetLayout);
 await browser.click('Lines');await browser.click('30 days');await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days"]')`);
 await browser.click('Open menu');await browser.click('Focus Studio');await browser.waitForDrawerClosed();await browser.wait(`document.body.innerText.includes('DEEP WORK')`);
 assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('${hero}')).some(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`),false);
 await browser.wait(`!!document.querySelector('${hero} [data-testid="ambient-paused"]')`);
 await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();await loaded('campus');
 // Real image-loader failure, not a DOM onError event: restore session in a fresh JS context.
 await settings();await pick('library');await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);await back('library');await active(true);
 await browser.command('Network.enable');await browser.command('Network.setCacheDisabled',{cacheDisabled:true});await browser.command('Network.setBlockedURLs',{urls:['*study-v2/library.*png']});
 await browser.reload();await login();await browser.wait(`!!document.querySelector('${hero} [data-testid="environment-fallback"]')`);await active(false);await capture('fallback');
 assert.deepEqual(writes,[]);assert.deepEqual(browser.errors,[]);
 console.log('8.3b: four original environments, preview and native Back, reload/account isolation, automatic periods, real effects and pause, 12 appearances, widgets, fallback and 320/390/768 passed.');
}catch(error){writeFileSync(resolve(root,'failure.json'),JSON.stringify({text:await browser.evaluate('document.body.innerText'),errors:browser.errors}));throw error;}finally{await browser.close();}
