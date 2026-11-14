import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {preview} from 'vite';
import {profileBrowser} from './helpers/profileBrowser.mjs';
const production=process.env.SCENE_PRODUCTION==='1';
const output=new URL('../../docs/images/f5-scene-preview/',import.meta.url);mkdirSync(output,{recursive:true});
const b=await profileBrowser({intercept:async()=>({status:404})});
let served;
const capture=async name=>{const r=await b.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(name+'.png',output),Buffer.from(r.data,'base64'));};
const select=async value=>b.evaluate(`(()=>{const s=document.querySelector('.auth-scene-preview select');s.value='${value}';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
const sample=()=>b.evaluate(`(()=>{const style=s=>getComputedStyle(document.querySelector(s));return{time:performance.now(),clouds:Array.from(document.querySelectorAll('[data-cloud-track]'),e=>new DOMMatrix(getComputedStyle(e).transform).m41),stars:style('.auth-effect-stars').opacity,glow:style('.auth-effect-glow').opacity,landscape:style('[data-static-exterior]').transform}})()`);
try{
 await b.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__sceneDate=Date;window.__sceneNow=new Date(2026,10,14,8).getTime();window.Date=class extends Date{constructor(...args){if(args.length)super(...args);else super(window.__sceneNow)}static now(){return window.__sceneNow}};window.__sceneHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__sceneHidden});`});
 await b.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await b.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 if(production){
  served=await preview({preview:{host:'127.0.0.1',port:0}});
  const address=served.httpServer.address();
  for(const route of ['login','register']){
   await b.command('Page.navigate',{url:`http://127.0.0.1:${address.port}/${route}?scene=night`});
   await b.wait(`document.querySelector('.auth-scene')?.dataset.studyPeriod==='morning'`);
   assert.equal(await b.evaluate(`!!document.querySelector('.auth-scene-preview')`),false);
  }
  for(const name of readdirSync('dist/assets').filter(n=>n.endsWith('.js'))){const code=readFileSync('dist/assets/'+name,'utf8');assert.ok(!code.includes('Scene preview (dev)')&&!code.includes('development only)'),'Development selector must be removed from production JavaScript');}
  console.log('Production: scene query ignored on Login/Register; selector absent from DOM and compiled JavaScript.');
 }else{
  const reports=[];
  for(const route of ['login','register'])for(const period of ['morning','afternoon','night']){
   await b.navigate(`/${route}?scene=${period}`);await b.wait(`document.querySelector('.auth-scene')?.dataset.studyPeriod==='${period}'`);
   await b.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:false})`);
   await b.wait(`document.querySelector('.auth-scene')?.dataset.ambient==='running'`);
   await b.evaluate(`document.querySelector('.auth-scene-base').decode()`);
   assert.equal(await b.evaluate(`document.querySelector('.auth-scene-preview select').value`),period);
   const before=await sample();await capture(`${route}-${period}-t0`);
   await new Promise(r=>setTimeout(r,4400));const after=await sample();await capture(`${route}-${period}-t4`);
   assert.ok(after.time-before.time>=4300);
   assert.ok(after.clouds.every((x,i)=>Math.abs(x-before.clouds[i])>8),'Every cloud must move in real browser time');
   assert.equal(after.landscape,before.landscape);
   if(period==='afternoon')assert.ok(Math.abs(Number(after.glow)-Number(before.glow))>.001,'Afternoon illumination must change');
   if(period==='night'){
    assert.ok(Math.abs(Number(after.stars)-Number(before.stars))>.01,'Night stars must twinkle');
    assert.ok(Math.abs(Number(after.glow)-Number(before.glow))>.001,'Existing night illumination must animate');
   }
   reports.push({route,period,before,after});
  }
  const storage=await b.evaluate(`JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)])`);
  await select('afternoon');await b.wait(`document.querySelector('.auth-scene')?.dataset.studyPeriod==='afternoon'&&location.search==='?scene=afternoon'`);
  await b.reload();await b.wait(`document.querySelector('.auth-scene')?.dataset.studyPeriod==='afternoon'`);
  assert.equal(await b.evaluate(`JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)])`),storage);
  await select('auto');await b.wait(`document.querySelector('.auth-scene')?.dataset.studyPeriod==='morning'&&!location.search`);
  await b.navigate('/login?scene=invalid');await b.wait(`document.querySelector('.auth-scene')?.dataset.studyPeriod==='morning'`);
  assert.equal(await b.evaluate(`document.querySelector('.auth-scene-preview select').value`),'auto');
  await b.evaluate(`window.__sceneNow=new window.__sceneDate(2026,10,14,22).getTime();window.dispatchEvent(new Event('focus'))`);await b.wait(`document.querySelector('.auth-scene')?.dataset.studyPeriod==='night'`);
  await b.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);await b.wait(`document.querySelector('.auth-scene')?.dataset.ambient==='paused'`);
  await b.evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);const paused=await sample();await new Promise(r=>setTimeout(r,350));const still=await sample();assert.deepEqual(still.clouds,paused.clouds);assert.equal(still.glow,paused.glow);assert.equal(still.stars,paused.stars);
  await b.evaluate(`window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await b.wait(`document.querySelector('.auth-scene')?.dataset.ambient==='running'`);
  for(const global of [false,true]){
   await b.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:global?'no-preference':'reduce'}]});
   await b.evaluate(`window.studyStreakAppearance.apply({reduceMotion:${global}})`);
   await b.wait(`document.querySelector('.auth-scene')?.dataset.ambient==='paused'`);
   assert.equal(await b.evaluate(`document.querySelector('.auth-scene').getAnimations({subtree:true}).filter(a=>a.playState==='running').length`),0);
  }
  for(const width of [390,768]){await b.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:true});await b.wait(`document.documentElement.scrollWidth<=innerWidth`);await capture('preview-'+width);}
  writeFileSync(new URL('motion-measurements.json',output),JSON.stringify(reports,null,2));
  console.log('Development: all six scenes, real cloud/star/light motion, URL/Auto/invalid, reload, no preference writes, reduced motion, hidden tab and responsive passed.');
 }
 assert.deepEqual(b.errors,[]);
}finally{await b.close();if(served)await new Promise(r=>served.httpServer.close(r));}
