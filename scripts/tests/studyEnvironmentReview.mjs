import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {token} from './studyEnvironmentFixture.mjs';
export async function reviewEnvironment(browser, platform) {
 const baseline=process.env.STUDY_ENV_BASELINE==='1';
 const root=resolve(process.env.STUDY_ENV_CAPTURES||'../docs/images/academia-pixel-viva-8-1');mkdirSync(root,{recursive:true});
 const prefix=`${baseline?'before':'after'}-${platform}`;
 const scene=platform==='web'?'.study-environment .auth-scene':'[data-testid="study-environment"] [data-testid^="study-scene-"]';
 const hiddenSource=`window.__environmentNow=new Date(2026,10,12,9).getTime();window.__RealDate=Date;window.Date=class extends Date{constructor(...args){super(...(args.length?args:[window.__environmentNow]));}static now(){return window.__RealDate.now();}};window.__environmentHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__environmentHidden});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__environmentHidden?'hidden':'visible'});`;
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:hiddenSource+(platform==='web'?`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`:'')});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:platform==='web'?1440:390,height:1000,deviceScaleFactor:1,mobile:platform!=='web'});
 await browser.navigate(platform==='web'?'/dashboard':'/');
 if(platform!=='web'){
  await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
  await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');
  await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);
 }
 const navigate=async module=>{
  if(platform==='web')await browser.navigate('/'+module);
  else{await browser.click('Open menu');await browser.click(module==='dashboard'?'Dashboard':'Focus Studio');await browser.waitForDrawerClosed();}
  await browser.wait(`document.body.textContent.includes(${JSON.stringify(module==='dashboard'?'All-time recorded':'DEEP WORK')})`);
 };
 const shot=async name=>{
  await browser.evaluate(`window.scrollTo(0,0);Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`);
  await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const frame=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`${prefix}-${name}.png`),Buffer.from(frame.data,'base64'));
 };
 for(const module of ['dashboard','focus-studio']){
  await browser.command('Emulation.setDeviceMetricsOverride',{width:platform==='web'?1440:390,height:1000,deviceScaleFactor:1,mobile:platform!=='web'});
  await navigate(module);await shot(module);
  if(baseline)continue;
  await browser.wait(`!!document.querySelector('${scene}')`);
  for(const [hour,period]of [[9,'morning'],[15,'afternoon'],[22,'night']]){
   await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__environmentNow=new window.__RealDate(2026,10,12,${hour}).getTime();window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));`);
   await browser.wait(platform==='web'?`document.querySelector('${scene}')?.dataset.studyPeriod==='${period}'`:`!!document.querySelector('[data-testid="study-environment"] [data-testid="study-scene-${period}"]')`);
   await browser.wait(`Array.from(document.querySelectorAll('${scene} img')).every(i=>i.complete&&i.naturalWidth>0)`);
   await shot(`${module}-${period}`);
  }
  const moving=platform==='web'?`${JSON.stringify(scene)}+' [class~="auth-effect-steam"]'`:`'[data-testid="study-environment"] [data-testid="scene-steam"]'`;
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  const transform=await browser.evaluate(`getComputedStyle(document.querySelector(${moving})).transform`);
  await new Promise(r=>setTimeout(r,400));
  assert.notEqual(await browser.evaluate(`getComputedStyle(document.querySelector(${moving})).transform`),transform,'Steam must actually move');
  await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);
  await browser.wait(platform==='web'?`document.querySelector('${scene}')?.dataset.ambient==='paused'`:`!!document.querySelector('[data-testid="study-environment"] [data-testid="ambient-paused"]')`);
  await browser.evaluate(`window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await browser.wait(platform==='web'?`document.querySelector('${scene}')?.dataset.ambient==='paused'`:`!!document.querySelector('[data-testid="study-environment"] [data-testid="ambient-paused"]')`);
  const stationary=await browser.evaluate(`getComputedStyle(document.querySelector(${moving})).transform`);
  await new Promise(r=>setTimeout(r,150));assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector(${moving})).transform`),stationary);
  for(const width of [320,390,768,1440]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
   await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   if(module==='focus-studio')assert.equal(await browser.evaluate(`(()=>{const e=document.querySelector('${platform==='web'?'.academic-dial':'[data-testid="pomodoro-circle"]'}');const r=e.getBoundingClientRect();return r.width>0&&Math.abs(r.width-r.height)<1})()`),true);
   if(width===320)await shot(module+'-320');
  }
  if(module==='focus-studio'){
   const dial=platform==='web'?'.academic-dial':'[data-testid="pomodoro-circle"]';
   await browser.evaluate(`window.__existingDial=document.querySelector('${dial}');document.querySelector('[aria-label="Study ambience"]').focus()`);
   assert.equal(await browser.evaluate(`document.activeElement===document.querySelector('[aria-label="Study ambience"]')`),true);
   const space=async()=>{await browser.command('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});};
   await space();await browser.wait(`!document.querySelector('${scene}')`);
   assert.equal(await browser.evaluate(`window.__existingDial===document.querySelector('${dial}')`),true,'Ambience must not remount the timer');
   await space();await browser.wait(`!!document.querySelector('${scene}')`);
   await browser.evaluate(`document.querySelector('[aria-label="Study ambience"]').click()`);
   await browser.wait(`!document.querySelector('${scene}')`);
   assert.ok(await browser.evaluate(`document.body.textContent.includes('DEEP WORK')`));
   await browser.evaluate(`document.querySelector('[aria-label="Study ambience"]').click()`);
   await browser.wait(`!!document.querySelector('${scene}')`);
  }
  await browser.command('Emulation.setDeviceMetricsOverride',{width:platform==='web'?1440:390,height:1000,deviceScaleFactor:1,mobile:platform!=='web'});
  for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
   if(platform==='web')await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
   else{
    await browser.click('Open menu');await browser.click('Settings');
    await browser.click(mode[0].toUpperCase()+mode.slice(1));await browser.click(accent[0].toUpperCase()+accent.slice(1));
    await browser.evaluate('history.back()');await browser.waitForDrawerClosed();
   }
   await browser.wait(`!!document.querySelector('${scene}')`);
   assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   if(mode==='light'&&accent==='orange')await shot(module+'-light-orange');
  }
  // Verify global Settings reduction independently of the device media query.
  if(platform==='web')await browser.evaluate(`window.studyStreakAppearance.apply({mode:'system',accent:'mint',reduceMotion:true})`);
  else{
   await browser.click('Open menu');await browser.click('Settings');
   await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);
   await browser.evaluate('history.back()');await browser.waitForDrawerClosed();
  }
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'},{name:'prefers-color-scheme',value:'dark'}]});
  await browser.wait(platform==='web'?`document.querySelector('${scene}')?.dataset.ambient==='paused'`:`!!document.querySelector('[data-testid="study-environment"] [data-testid="ambient-paused"]')`);
  const surface=platform==='web'?'.study-environment':'[data-testid="study-environment"]';
  const darkBorder=await browser.evaluate(`getComputedStyle(document.querySelector('${surface}')).borderColor`);
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'},{name:'prefers-color-scheme',value:'light'}]});
  await browser.wait(`getComputedStyle(document.querySelector('${surface}')).borderColor!==${JSON.stringify(darkBorder)}`);
  // Force a local image failure and verify the existing static fallback survives.
  if(platform==='web')await browser.evaluate(`document.querySelector('${scene} img').dispatchEvent(new Event('error'))`);
  else{
   await browser.command('Network.enable');await browser.command('Network.setCacheDisabled',{cacheDisabled:true});
   await browser.command('Network.setBlockedURLs',{urls:['*morning-base*']});
   await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__environmentNow=new window.__RealDate(2026,10,12,9).getTime();window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'));`);
  }
  await browser.wait(`Array.from(document.querySelectorAll('${scene} img')).some(i=>i.src.includes('${platform==='web'?'.png':'fallback'}')&&i.complete&&i.naturalWidth>0)`);
  if(platform!=='web'){await browser.command('Network.setBlockedURLs',{urls:[]});await browser.command('Network.setCacheDisabled',{cacheDisabled:false});}
  if(platform==='web')await browser.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:false})`);
  else{
   await browser.click('Open menu');await browser.click('Settings');await browser.click('Dark');await browser.click('Mint');
   await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);
   await browser.evaluate('history.back()');await browser.waitForDrawerClosed();
  }
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'},{name:'prefers-color-scheme',value:'dark'}]});
 }
 assert.deepEqual(browser.errors,[]);
 console.log(`${platform}: ${baseline?'baseline captured':'periods, visible motion, background, Reduce Motion, responsive and optional ambience passed'}`);
}
