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
  const html=renderToStaticMarkup(h(StudyScene,{period}));assert.match(html,/aria-hidden="true"/);assert.match(html,/crispEdges/);assert.doesNotMatch(html,/<image|https?:|animation/);
  assert.ok(data.rects.filter(row=>row[5]==='all').length>60);assert.ok(html.includes(data.palettes[period].sky));
 }
 const source=JSON.parse(readFileSync(new URL('../../assets/auth/study-room.json',import.meta.url),'utf8'));assert.equal(source.width,160);
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
   const image=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/studystreak-auth-${period}.png`,Buffer.from(image.data,'base64'));
  }
  await page.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__sceneNow=new window.__RealDate(2026,10,10,7).getTime()`);assert.equal(await page.evaluate(`document.querySelector('[data-study-period]').dataset.studyPeriod`),'night');
  await page.evaluate(`window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await page.wait(`document.querySelector('[data-study-period]').dataset.studyPeriod==='morning'`);
  for(const path of ['/login','/register']){
   await page.navigate(path);await page.wait('!!document.querySelector("#username")');
   for(const width of [320,375,768,1440]){await page.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
    await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
    assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);assert.equal(await page.evaluate('document.querySelectorAll("form input").length'),path==='/login'?2:3);
    assert.equal(await page.evaluate('document.querySelector(".auth-scene").getAnimations({subtree:true}).length'),0);
   }}
  }
  await page.command('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
  await page.evaluate(`window.studyStreakAppearance.apply({mode:'light',accent:'orange',reduceMotion:true});document.querySelector('#username').focus()`);
  assert.equal(await page.evaluate('document.activeElement.id'),'username');
  const compactShot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/studystreak-auth-mobile-light.png',Buffer.from(compactShot.data,'base64'));
  await page.command('Emulation.setDeviceMetricsOverride',{width:600,height:390,deviceScaleFactor:1,mobile:true});
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".auth-art")).display'),'none');
  assert.equal(await page.evaluate('document.querySelectorAll("form input").length'),3);
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await page.fill('#username','fixture');await page.fill('#email','fixture@example.invalid');await page.fill('#password','Fixture-pass-1');await page.click('Create account');await page.wait('document.querySelector("[role=alert]")?.textContent.includes("already registered")');
  failRegister=false;holdRegister=true;await page.click('Create account');while(!finishRegister)await new Promise(r=>setTimeout(r,10));assert.equal(await page.evaluate('document.querySelector("button[type=submit]").disabled'),true);assert.equal(writes[0].body.timeZone,'America/Lima');finishRegister();await page.wait('location.pathname==="/login"');
  await page.fill('#username','fixture');await page.fill('#password','Fixture-pass-1');await page.click('Login');await page.wait('document.querySelector("[role=alert]")?.textContent.includes("Invalid username")');failLogin=false;await page.click('Login');await page.wait('location.pathname==="/dashboard"');assert.deepEqual(page.errors,[]);
 }finally{finishRegister?.();await page.close();}
});
