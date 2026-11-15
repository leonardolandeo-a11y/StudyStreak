import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { profileBrowser } from './helpers/profileBrowser.mjs';
import { environmentFixture } from '../../scripts/tests/studyEnvironmentFixture.mjs';
const root=resolve(process.env.ENVIRONMENT_CAPTURES || '../docs/images/dashboard-environment-refresh');mkdirSync(root,{recursive:true});
let owner=101;const paths=[];
const tokenFor=id=>'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:id,sub:'Fixture Student',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
const browser=await profileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;paths.push(path);
 if(path==='/api/profile')return {body:{id:owner,username:'Fixture Student',presentationName:'Fixture Student'}};
 if(path===`/users/${owner}/goals`&&owner!==101)return {body:{content:[],totalElements:0,totalPages:0,last:true}};
 return environmentFixture(request);
}});
const key=id=>`studystreak:study-environment:v1:${id}`;
const names={campus:'Sunset Campus',library:'Rainy Library',night:'Night Desk',cafe:'Cozy Café'};
const widgetLayout=JSON.stringify(['focus-summary','streak','activity','goals','journey','recent','partners','quick'].map(id=>({id,visible:id!=='partners'})));
const capture=async name=>{
 await browser.evaluate('window.scrollTo(0,0)');await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 const frame=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`${name}.png`),Buffer.from(frame.data,'base64'));
};
const loaded=async id=>{
 await browser.wait(`document.querySelector('.study-environment .panorama-art')?.dataset.environment==='${id}'`);
 await browser.wait(`new Promise(r=>{const i=new Image();i.onload=()=>r(true);i.onerror=()=>r(false);i.src='/environments/study-v2/${id}.webp';})`);
};
const pick=async choice=>{
 await browser.wait(`!!document.querySelector('.environment-settings input[value="${choice}"]:not(:disabled)')`);
 await browser.evaluate(`(()=>{const input=document.querySelector('.environment-settings input[value="${choice}"]');input.closest('label').scrollIntoView({block:'center'});input.focus();input.click();})()`);
 await browser.wait(`JSON.parse(localStorage.getItem('${key(owner)}'))?.selection==='${choice}'`);
};
try{
 await browser.command('Emulation.setTimezoneOverride',{timezoneId:'America/Lima'});
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',sessionStorage.getItem('accessToken')||${JSON.stringify(tokenFor(101))});window.__realDate=Date;window.__sceneNow=new Date(2026,10,12,15).getTime();window.Date=class extends Date{constructor(...args){super(...(args.length?args:[window.__sceneNow]));}static now(){return window.__realDate.now();}};window.__sceneHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__sceneHidden});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
 await browser.navigate('/dashboard');await loaded('campus');await browser.wait(`document.body.innerText.includes('All-time recorded')`);
 await browser.evaluate(`localStorage.setItem('studystreak-dashboard-v1-101',${JSON.stringify(widgetLayout)})`);
 const beforeTheme=await browser.evaluate(`localStorage.getItem('studystreak:appearance:v1')`);
 for(const id of Object.keys(names)){
  await browser.navigate('/settings');await pick(id);
  await browser.wait(`document.querySelector('[data-environment-preview] .panorama-art')?.dataset.environment==='${id}'`);
  if(id==='library'){
   for(const width of [390,1440]){
    await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<768});
    await browser.evaluate(`document.querySelector('.environment-settings').scrollIntoView({block:'center'})`);
    const frame=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`settings-${width}.png`),Buffer.from(frame.data,'base64'));
   }
  }
  await browser.navigate('/dashboard');await loaded(id);
  assert.equal(await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`),widgetLayout);
  assert.equal(await browser.evaluate(`localStorage.getItem('studystreak:appearance:v1')`),beforeTheme);
  for(const width of [390,768,1440,1920]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   await capture(`${id}-${width}`);
   if(width===1440){
    const box=await browser.evaluate(`(()=>{const r=document.querySelector('.study-environment').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
    const shot=await browser.command('Page.captureScreenshot',{format:'png',clip:box});writeFileSync(resolve(root,`${id}-hero.png`),Buffer.from(shot.data,'base64'));
   }
  }
  for(const [family,mode,accent] of (id==='campus'||id==='night' ? [['sage','dark','mint'],['neutral','light','blue']] : [['lavender','dark','purple'],['amber','light','orange']])){
   await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
   await browser.evaluate(`window.studyStreakAppearance.apply({background:'${family}',mode:'${mode}',accent:'${accent}'})`);
   await browser.evaluate('new Promise(r=>setTimeout(r,250))');
   const surface=await browser.evaluate(`(()=>{const hero=document.querySelector('.study-environment'),s=getComputedStyle(hero),art=getComputedStyle(hero.querySelector('.panorama-art'));return {background:s.backgroundColor,border:s.borderTopWidth,shadow:s.boxShadow,mask:art.maskImage,pseudo:getComputedStyle(hero,'::before').content};})()`);
   assert.equal(surface.background,'rgba(0, 0, 0, 0)');assert.equal(surface.border,'0px');assert.equal(surface.shadow,'none');assert.match(surface.mask,/linear-gradient/);assert.ok(surface.pseudo==='none'||surface.pseudo==='normal');
   await capture(`${id}-${family}-${mode}-${accent}`);
  }
  await browser.reload();await loaded(id);
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
  await browser.evaluate('window.scrollTo(0,0)');await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='running'`);
  const effect=(id==='library'||id==='night')?'.panorama-rain':'.panorama-clouds';
  const value=await browser.evaluate(`getComputedStyle(document.querySelector('${effect}')).transform`);
  await new Promise(r=>setTimeout(r,400));assert.notEqual(await browser.evaluate(`getComputedStyle(document.querySelector('${effect}')).transform`),value,'Actual ambient effect changes');
 }
 // Native radios support keyboard selection and retain focus without a custom navigation system.
 await browser.navigate('/settings');await browser.command('Page.bringToFront');
 await browser.evaluate(`document.querySelector('.environment-settings input[value="cafe"]').focus()`);
 await browser.command('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
 await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
 await browser.wait(`JSON.parse(localStorage.getItem('${key(101)}')).selection==='night'`);
 assert.equal(await browser.evaluate(`document.activeElement?.value`),'night');await pick('cafe');await browser.navigate('/dashboard');await loaded('cafe');
 // Manual scene stays selected even when the local time period changes.
 await browser.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__sceneNow=new window.__realDate(2026,10,12,22).getTime();window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'));`);await loaded('cafe');
 await browser.navigate('/settings');await pick('automatic');
 await browser.navigate('/dashboard');await loaded('campus'); // Full navigation initializes fixture local hour to 15.
 for(const [hour,id]of [[9,'cafe'],[15,'campus'],[22,'night']]){
  await browser.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__sceneNow=new window.__realDate(2026,10,12,${hour}).getTime();window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));`);await loaded(id);
 }
 await browser.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='paused'`);
 await browser.evaluate(`window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='running'`);
 await browser.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='paused'`);await browser.evaluate('window.scrollTo(0,0)');
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await browser.wait(`getComputedStyle(document.querySelector('.panorama-steam')).animationName==='none'`);
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await browser.navigate('/settings');await pick('library');
 await browser.evaluate(`document.querySelector('.environment-settings input[type="checkbox"]').click()`);
 await browser.navigate('/dashboard');await loaded('library');await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='paused'`);
 await browser.reload();await loaded('library');assert.equal(await browser.evaluate(`document.querySelector('.panorama-art').dataset.ambient`),'paused');
 const accountPreference=await browser.evaluate(`localStorage.getItem('${key(101)}')`);
 owner=202;await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(tokenFor(202))})`);await browser.reload();await loaded('campus');
 assert.equal(await browser.evaluate(`localStorage.getItem('${key(202)}')`),null);
 owner=101;await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(tokenFor(101))})`);await browser.reload();await loaded('library');assert.equal(await browser.evaluate(`localStorage.getItem('${key(101)}')`),accountPreference);
 for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
  await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('.panorama-steam')).animationName`),'none');
 }
 await capture('library-light-orange');
 await browser.navigate('/settings');await browser.click('Restore default environment');
 await browser.wait(`JSON.parse(localStorage.getItem('${key(101)}')).selection==='automatic'&&JSON.parse(localStorage.getItem('${key(101)}')).motion===true`);
 // Existing widget controls remain usable; no layout write came from environment settings.
 await browser.navigate('/dashboard');await loaded('campus');await browser.click('Lines');await browser.click('30 days');await browser.wait(`document.body.innerText.includes('Across all 30 days')`);
 assert.equal(await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`),widgetLayout);
 await browser.navigate('/focus-studio');await browser.wait(`document.body.innerText.includes('DEEP WORK')`);assert.equal(await browser.evaluate(`!!document.querySelector('.panorama-art')`),false);
 // A real failed image request uses the independent static local fallback.
 await browser.navigate('/settings');await pick('library');await browser.command('Network.enable');await browser.command('Network.setCacheDisabled',{cacheDisabled:true});await browser.command('Network.setBlockedURLs',{urls:['*/environments/study-v2/library.webp']});
 await browser.navigate('/dashboard');await browser.wait(`document.querySelector('.panorama-art')?.dataset.fallback==='true'`);assert.equal(await browser.evaluate(`document.querySelector('.panorama-art').dataset.ambient`),'paused');
 await browser.wait(`new Promise(r=>{const i=new Image();i.onload=()=>r(true);i.onerror=()=>r(false);i.src='/environments/study-v2/campus-thumb.webp';})`);await capture('fallback');
 assert.deepEqual(browser.errors,[]);
 console.log('Four environments, preview/selection/reload/account isolation, automatic periods, widgets, 12 appearances, reduced motion, background/viewport pause, actual effects and fallback passed.');
}catch(error){writeFileSync(resolve(root,'failure.json'),JSON.stringify({text:await browser.evaluate('document.body.innerText'),errors:browser.errors,paths}));throw error;}finally{await browser.close();}
