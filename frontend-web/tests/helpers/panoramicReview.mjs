import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {token} from '../../../scripts/tests/studyEnvironmentFixture.mjs';

export async function reviewPanorama(browser, requests) {
 const root=resolve(process.env.STUDY_ENV_CAPTURES||'../docs/images/academia-pixel-viva-8-1c');mkdirSync(root,{recursive:true});
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__realDate=Date;window.__now=new Date(2026,10,12,15).getTime();window.Date=class extends Date{constructor(...args){super(...(args.length?args:[window.__now]));}static now(){return window.__realDate.now();}};window.__hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden});`});
 const capture=async name=>{await browser.evaluate('window.scrollTo(0,0)');await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,name+'.png'),Buffer.from(shot.data,'base64'));};
 const period=async(hour,name)=>{
  await browser.evaluate(`window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__now=new window.__realDate(2026,10,12,${hour}).getTime();window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));`);
  await browser.wait(`document.querySelector('.panorama-art')?.dataset.environmentPeriod==='${name}'`);
  await browser.wait(`new Promise(r=>{const i=new Image();i.onload=()=>r(true);i.onerror=()=>r(false);i.src='/environments/academy-pixel-${name}.webp';})`);
 };
 for(const module of ['dashboard','focus-studio']){
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  const statsBefore=requests.filter(p=>p==='/api/focus-sessions/stats').length;
  await browser.navigate('/'+module);
  await browser.wait(`document.body.textContent.includes('${module==='dashboard'?'All-time recorded':'DEEP WORK'}')`);
  if(module==='dashboard')await period(15,'afternoon');
  else {
   assert.equal(await browser.evaluate(`!!document.querySelector('.panorama-art,[aria-label="Study ambience"]')`),false);
   assert.equal(requests.filter(p=>p==='/api/focus-sessions/stats').length,statsBefore,'Focus does not download statistics');
  }
  for(const width of [1440,1920,768,390]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
   await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   await capture(`after-web-${module}-${width}`);
   if(module==='dashboard'&&width===1920){const {cssContentSize}=await browser.command('Page.getLayoutMetrics');const shot=await browser.command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1920,height:Math.ceil(cssContentSize.height),scale:1}});writeFileSync(resolve(root,'after-web-dashboard-1920-full.png'),Buffer.from(shot.data,'base64'));}
   if(module==='dashboard'){
    const boxes=await browser.evaluate(`(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,width:r.width};};return {hero:box('.study-environment'),metrics:box('.dashboard-metrics'),grid:box('.dashboard-widgets'),bottom:box('.dashboard-bottom'),cards:[...document.querySelectorAll('.dashboard-metrics article')].map(e=>e.getBoundingClientRect().top)};})()`);
    assert.ok(boxes.hero.bottom<=boxes.metrics.top&&boxes.metrics.bottom<=boxes.grid.top&&boxes.grid.bottom<=boxes.bottom.top,'Hero, metrics, grid and journey stay separate');
    if(width>=1440)assert.equal(new Set(boxes.cards).size,1,'Four metrics in one row');
    assert.equal(await browser.evaluate(`document.querySelectorAll('[aria-label="Recorded activity calendar"]').length`),1,'No duplicate calendar in Study Journey');
   }else assert.equal(await browser.evaluate(`(()=>{const r=document.querySelector('.academic-dial').getBoundingClientRect();return r.width>0&&Math.abs(r.width-r.height)<1})()`),true);
  }
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  if(module==='dashboard'){
   assert.equal(requests.filter(p=>p==='/api/focus-sessions/stats').length,statsBefore+1);
   for(const [hour,name]of [[9,'morning'],[15,'afternoon'],[22,'night']]){await period(hour,name);await capture(`after-web-dashboard-${name}`);}
   await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='running'`);
   const effects=['.panorama-steam','.panorama-clouds','.panorama-landscape'];
   const transforms=await browser.evaluate(`${JSON.stringify(effects)}.map(s=>getComputedStyle(document.querySelector(s)).transform)`);
   await new Promise(r=>setTimeout(r,350));
   for(const [i,selector]of effects.entries())assert.notEqual(await browser.evaluate(`getComputedStyle(document.querySelector('${selector}')).transform`),transforms[i],selector+' moves');
   await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:300,deviceScaleFactor:1,mobile:false});
   await browser.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='paused'`);
   await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await browser.evaluate('window.scrollTo(0,0)');await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='running'`);
   await browser.evaluate(`window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='paused'`);
   await browser.evaluate(`window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'))`);
   await browser.click('30 days');await browser.wait(`document.body.textContent.includes('Across all 30 days')`);for(let i=0;i<100&&requests.filter(p=>p==='/api/focus-sessions/stats').length<statsBefore+2;i++)await new Promise(r=>setTimeout(r,20));assert.equal(requests.filter(p=>p==='/api/focus-sessions/stats').length,statsBefore+2);
   await browser.click('Lines');await browser.click('Bars');
   await browser.evaluate(`document.querySelector('.journey-details').open=true`);
   for(const label of ['Goals','Together','History','Activity']){await browser.evaluate(`Array.from(document.querySelectorAll('[aria-label="Statistics sections"] button')).find(b=>b.textContent==='${label}').click()`);}
   assert.equal(await browser.evaluate(`document.querySelectorAll('[aria-label="Recorded activity calendar"]').length`),1);
   await browser.evaluate(`document.querySelector('.journey-details').open=false`);
  }else{
   await browser.click('Short break');await browser.wait(`document.querySelector('[role="timer"]').textContent==='05:00'`);
   await browser.click('Long break');await browser.wait(`document.querySelector('[role="timer"]').textContent==='15:00'`);
   await browser.click('Focus');await browser.wait(`document.querySelector('[role="timer"]').textContent==='25:00'`);
  }
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
   await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
   assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   if(mode==='light'&&accent==='orange')await capture(`after-web-${module}-light-orange`);
  }
  if(module==='dashboard'){
   assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('.panorama-steam')).animationName`),'none');
   await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   assert.equal(await browser.evaluate(`document.querySelector('.panorama-art').dataset.ambient`),'paused');
   await browser.evaluate(`document.querySelector('.panorama-base').dispatchEvent(new Event('error'))`);await browser.wait(`document.querySelector('.panorama-art').dataset.fallback==='true'`);
  }
  await browser.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:false})`);
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 }
 assert.deepEqual(browser.errors,[]);
 console.log('Web review: pixel hero, ordered widgets, unique calendar, clean Focus, periods, motion, themes and responsive passed.');
}
