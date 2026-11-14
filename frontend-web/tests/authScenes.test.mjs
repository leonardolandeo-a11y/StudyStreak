import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createServer} from 'vite';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chrome,profileBrowser} from './helpers/profileBrowser.mjs';
const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});after(()=>server.close());
const {StudyScene}=await server.ssrLoadModule('/src/components/auth/StudyScene.tsx');
const {default:data}=await server.ssrLoadModule('/src/components/auth/sceneData.ts');
test('three original offline scenes share desk/window/books and keep decoration out of the accessibility tree',()=>{
 for(const period of ['morning','afternoon','night']){
  const html=renderToStaticMarkup(h(StudyScene,{period}));assert.match(html,/aria-hidden="true"/);assert.match(html,/crispEdges/);assert.doesNotMatch(html,/https?:/);assert.match(html,/auth-scene-base/);
  assert.equal(Object.keys(data.effects).length,4);assert.ok(data.window.landscape.length>80);assert.match(html,/<clipPath/);assert.match(html,/data-window-frame/);assert.match(html,new RegExp('study-room-'+period));
 }
 const source=JSON.parse(readFileSync(new URL('../../assets/auth/study-room.json',import.meta.url),'utf8'));assert.equal(source.width,400);assert.ok(source.rects.length>=800);
});
const options={timeout:90000,skip:!chrome&&'Chrome unavailable'};
test('Chrome: local periods/foreground, responsive themes and unchanged registration/login/error/loading flows',options,async()=>{
 let failLogin=true,failRegister=true,holdRegister=false,finishRegister;const writes=[];
 const page=await profileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;
  if(path==='/register'){const body=JSON.parse(request.postData);writes.push({path,body});if(failRegister)return {status:409};if(holdRegister)return new Promise(resolve=>{finishRegister=()=>resolve({body:{id:1,username:body.username}})});return {body:{id:1}};}
  if(path==='/login'){writes.push({path});if(failLogin)return {status:401};const claims={type:'access',userId:42,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:4102444800};return {body:{token:`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`,refreshToken:'fixture-only'}};}
  if(path==='/api/profile')return {body:{id:42,username:'fixture',presentationName:'Fixture'}};
  if(path.includes('unread'))return {body:0};return {status:404};
 }});
 try{
  await page.command('Emulation.setTimezoneOverride',{timezoneId:'America/Lima'});
  await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__RealDate=Date;window.__sceneNow=new Date(2026,10,9,4,59).getTime();window.Date=class extends Date{constructor(...args){if(args.length)super(...args);else super(window.__sceneNow);}static now(){return window.__sceneNow;}};window.__sceneHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__sceneHidden});`});
  await page.navigate('/login');await page.wait('document.querySelector("[data-study-period]")?.dataset.studyPeriod==="night"');
  for(const [hour,period]of [[5,'morning'],[12,'afternoon'],[18,'night']]){
   await page.evaluate(`window.__sceneNow=new window.__RealDate(2026,10,9,${hour}).getTime();window.dispatchEvent(new Event('focus'))`);await page.wait(`document.querySelector('[data-study-period]')?.dataset.studyPeriod==='${period}'`);
   await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
   await page.evaluate(`document.querySelector('.auth-scene-base').decode()`);
   const image=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/studystreak-auth-${period}.png`,Buffer.from(image.data,'base64'));
  }
  await page.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await page.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:false})`);
  await page.wait(`document.querySelector('[data-ambient]').dataset.ambient==='running'`);
  const before=await page.evaluate(`getComputedStyle(document.querySelector('.auth-effect-steam')).transform`);
  await new Promise(resolve=>setTimeout(resolve,350));
  assert.notEqual(await page.evaluate(`getComputedStyle(document.querySelector('.auth-effect-steam')).transform`),before);
  const exterior=await page.evaluate(`getComputedStyle(document.querySelector('.auth-effect-landscape')).transform`);
  const clouds=await page.evaluate(`Array.from(document.querySelectorAll('[data-cloud-track]'),g=>getComputedStyle(g).transform)`);
  await new Promise(resolve=>setTimeout(resolve,350));
  assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('.auth-effect-landscape')).transform`),exterior);
  assert.notDeepEqual(await page.evaluate(`Array.from(document.querySelectorAll('[data-cloud-track]'),g=>getComputedStyle(g).transform)`),clouds);
  assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('.auth-scene-base')).transform`),'none');
  assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('[data-window-frame]')).transform`),'none');
  await page.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__sceneNow=new window.__RealDate(2026,10,10,7).getTime()`);assert.equal(await page.evaluate(`document.querySelector('[data-study-period]').dataset.studyPeriod`),'night');await page.wait(`document.querySelector('[data-ambient]').dataset.ambient==='paused'`);assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('.auth-content')).backdropFilter`),'none');
  await page.evaluate(`window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await page.wait(`document.querySelector('[data-study-period]').dataset.studyPeriod==='morning'`);
  await page.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await page.wait(`document.querySelector('[data-ambient]').dataset.ambient==='paused'`);
  await page.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  for(const path of ['/login','/register']){
   await page.navigate(path);await page.wait('!!document.querySelector("#username")');
   for(const width of [320,390,768,1440,1920]){await page.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
    await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
    assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);assert.equal(await page.evaluate('document.querySelectorAll("form input").length'),path==='/login'?2:3);
    assert.equal(await page.evaluate('document.querySelector(".auth-scene").getAnimations({subtree:true}).filter(a=>a.playState==="running").length'),0);
    assert.deepEqual(await page.evaluate('(()=>{const r=document.querySelector(".auth-scene").getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()'),[0,0,width,900]);
   }
   const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/fullscreen-${path.slice(1)}-${width}.png`,Buffer.from(shot.data,'base64'));
   }
  }
  await page.command('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
  await page.evaluate(`window.studyStreakAppearance.apply({mode:'light',accent:'orange',reduceMotion:true});document.querySelector('#username').focus()`);
  assert.equal(await page.evaluate('document.activeElement.id'),'username');
  const compactShot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/studystreak-auth-mobile-light.png',Buffer.from(compactShot.data,'base64'));
  await page.command('Emulation.setDeviceMetricsOverride',{width:600,height:390,deviceScaleFactor:1,mobile:true});
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".auth-scene")).position'),'fixed');
  assert.equal(await page.evaluate('document.querySelectorAll("form input").length'),3);
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await page.evaluate(`document.querySelector('.auth-scene-base').dispatchEvent(new Event('error'))`);await page.wait(`document.querySelector('.auth-scene-base').src.endsWith('.png')`);await page.evaluate(`document.querySelector('.auth-scene-base').decode()`);assert.equal(await page.evaluate(`document.querySelector('.auth-scene-base').naturalWidth`),400);
  await page.fill('#username','fixture');await page.fill('#email','fixture@example.invalid');await page.fill('#password','Fixture-pass-1');await page.click('Create account');await page.wait('document.querySelector("[role=alert]")?.textContent.includes("already registered")');
  failRegister=false;holdRegister=true;await page.click('Create account');while(!finishRegister)await new Promise(r=>setTimeout(r,10));assert.equal(await page.evaluate('document.querySelector("button[type=submit]").disabled'),true);assert.equal(writes[0].body.timeZone,'America/Lima');finishRegister();await page.wait('location.pathname==="/login"');
  await page.fill('#username','fixture');await page.fill('#password','Fixture-pass-1');await page.click('Login');await page.wait('document.querySelector("[role=alert]")?.textContent.includes("Invalid username")');failLogin=false;await page.click('Login');await page.wait('location.pathname==="/dashboard"');assert.deepEqual(page.errors,[]);
 }finally{finishRegister?.();await page.close();}
});

test('Chrome: constrained device keeps a complete static fullscreen scene',options,async()=>{
 const page=await profileBrowser({intercept:async()=>({status:404})});
 try{
  await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(navigator,'deviceMemory',{get:()=>2});`});
  await page.navigate('/login');await page.wait(`document.querySelector('[data-study-period]')?.dataset.studyPeriod!=='pending'`);
  await page.evaluate(`document.querySelector('.auth-scene-base').decode()`);
  assert.equal(await page.evaluate(`document.querySelector('[data-ambient]').dataset.ambient`),'paused');
  assert.equal(await page.evaluate(`document.querySelector('.auth-scene-base').naturalWidth>0`),true);
  assert.equal(await page.evaluate(`document.querySelector('.auth-scene').getAnimations({subtree:true}).some(a=>a.playState==='running')`),false);
 }finally{await page.close();}
});
