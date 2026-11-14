import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const before=process.env.PIXEL_BEFORE==='1';
const output=new URL(process.env.PIXEL_CAPTURES || '../../docs/images/f5-art-final/',import.meta.url);mkdirSync(output,{recursive:true});
const browser=await profileBrowser({desktopPointer:true,cacheDir:fileURLToPath(new URL('../../.local/f5-pixel/vite-cache/',import.meta.url)),intercept:environmentFixture});
const capture=async name=>{const r=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL((before?'before-':'after-')+name+'.png',output),Buffer.from(r.data,'base64'));};
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__pixelDate=Date;window.__pixelNow=new Date(2026,10,14,8).getTime();window.Date=class extends Date{constructor(...args){if(args.length)super(...args);else super(window.__pixelNow)}static now(){return window.__pixelNow}};window.__pixelHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__pixelHidden});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await browser.navigate('/login');await browser.wait('!!document.querySelector("#username")');await browser.evaluate('document.querySelector(".auth-scene-base").decode()');await capture('login');
 if(!before){

  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'lavender',mode:'dark',accent:'mint',reduceMotion:false})`);await browser.wait(`document.querySelector('.auth-scene').dataset.ambient==='running'`);
  assert.equal(await browser.evaluate(`document.querySelectorAll('[data-cloud-track]').length`),3);
  assert.equal(await browser.evaluate(`document.querySelector('[data-auth-campus] [data-campus-form]')?.dataset.campusForm`),'inclined-facade');
  assert.equal(await browser.evaluate(`!!document.querySelector('[data-auth-campus] [data-coastal-city]')&&!!document.querySelector('[data-auth-campus] [data-coastal-water]')`),true);
  const read=()=>browser.evaluate(`(()=>{const fixed=s=>getComputedStyle(document.querySelector(s)).transform;return{time:performance.now(),clouds:Array.from(document.querySelectorAll('[data-cloud-track]'),g=>new DOMMatrix(getComputedStyle(g).transform).m41),landscape:fixed('[data-static-exterior]'),campus:fixed('[data-auth-campus]'),frame:fixed('[data-window-frame]'),image:fixed('.auth-scene-base')}})()`);
  const timing=await browser.evaluate(`Array.from(document.querySelectorAll('[data-cloud-track]'),g=>({duration:getComputedStyle(g).animationDuration,direction:getComputedStyle(g).animationDirection,copies:g.querySelectorAll('[data-cloud-copy]').length}))`);assert.deepEqual(timing.map(t=>t.duration),['60s','75s','90s']);assert.ok(timing.every(t=>t.direction==='normal'&&t.copies===2));
  await browser.evaluate(`new Promise(r=>setTimeout(r,350))`);
  const samples=[await read()];await capture('clouds-t00');
  for(const seconds of [10,20]){await new Promise(r=>setTimeout(r,10000));samples.push(await read());await capture('clouds-t'+seconds);}
  for(let i=1;i<samples.length;i++){assert.ok(samples[i].time-samples[i-1].time>=9900);assert.ok(samples[i].clouds.every((x,j)=>Math.abs(x-samples[i-1].clouds[j])>20));for(const key of ['landscape','campus','frame','image'])assert.equal(samples[i][key],samples[0][key]);}
  assert.equal(samples[0].landscape,'none');assert.equal(samples[0].frame,'none');assert.equal(samples[0].image,'none');writeFileSync(new URL('../../.local/f5-pixel/motion.json',import.meta.url),JSON.stringify({samples,timing},null,2));
  // Pause all ambient effects without replacing the original room asset.
  await browser.evaluate(`window.__pixelHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.auth-scene').dataset.ambient==='paused'`);await browser.evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);const paused=await read();await new Promise(r=>setTimeout(r,250));assert.deepEqual((await read()).clouds,paused.clouds);await browser.evaluate(`window.__pixelHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.auth-scene').dataset.ambient==='running'`);
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await browser.wait(`!document.querySelector('.auth-scene').getAnimations({subtree:true}).some(a=>a.playState==='running')`);
  for(const [hour,period] of [[8,'morning'],[15,'afternoon'],[22,'night']]){await browser.evaluate(`window.__pixelNow=new window.__pixelDate(2026,10,14,${hour}).getTime();window.dispatchEvent(new Event('focus'))`);await browser.wait(`document.querySelector('.auth-scene').dataset.studyPeriod==='${period}'`);await browser.evaluate(`document.querySelector('.auth-scene-base').decode()`);await capture('login-'+period);}
  await browser.navigate('/register');await browser.wait('!!document.querySelector("#email")');assert.equal(await browser.evaluate('document.querySelectorAll("form input").length'),3);
  for(const width of [390,768,1440,1920]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture('register-'+width);}

 }
 await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`);await browser.navigate('/goals');await browser.wait(`document.body.textContent.includes('Linear algebra')`);await capture('sidebar');
 if(!before){

  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  const collapse='[aria-label="Collapse sidebar"]';assert.equal(await browser.evaluate(`document.querySelector('${collapse}').textContent.trim()`),'');assert.equal(await browser.evaluate(`document.querySelectorAll('.sidebar-collapse').length`),1);await capture('expanded');
  await browser.evaluate(`document.querySelector('${collapse}').click()`);await browser.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===84`);assert.equal(await browser.evaluate(`document.activeElement.getAttribute('aria-label')`),'Expand sidebar');assert.equal(await browser.evaluate(`document.querySelectorAll('.sidebar-collapse').length`),0);assert.equal(await browser.evaluate(`!!document.querySelector('.sidebar-cup-expand [data-study-mark]')`),true);await capture('collapsed');
  await browser.evaluate(`document.querySelector('.sidebar-cup-expand').focus()`);assert.notEqual(await browser.evaluate('getComputedStyle(document.activeElement).outlineStyle'),'none');await browser.command('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await browser.command('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await browser.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===264`);assert.equal(await browser.evaluate(`document.activeElement.getAttribute('aria-label')`),'Collapse sidebar');
  await browser.evaluate(`document.querySelector('${collapse}').click()`);await browser.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===84`);await browser.evaluate(`document.querySelector('.sidebar-cup-expand').click()`);await browser.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===264`);
  for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
  assert.deepEqual(browser.errors,[]);console.log('Pixel hotfix passed: original room assets, real 0/10/20s cloud motion, static campus/frame, background/reduced motion, themes, responsive and cup/chevron controls. API fixtures only.');

 }
}finally{await browser.close();}
