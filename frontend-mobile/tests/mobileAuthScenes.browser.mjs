import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {mobileBrowser} from './helpers/mobileBrowser.mjs';

let rejectLogin=true,rejectRegistration=true,holdRegister=false,finishRegister,holdLogin=false,finishLogin;
const browser=await mobileBrowser({intercept:async request=>{
 const path=new URL(request.url).pathname;
 if(path==='/logout')return {status:204};
 if(path==='/register'){if(rejectRegistration)return{status:409};if(holdRegister)return new Promise(resolve=>{finishRegister=()=>resolve({body:{id:101}});});return{body:{id:101}};}
 if(path==='/login'){
  if(rejectLogin)return {status:401};
  const claims={type:'access',userId:101,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:4102444800};
  const reply={body:{token:`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`,refreshToken:'fixture-only'}};
  if(holdLogin)return new Promise(resolve=>{finishLogin=()=>resolve(reply);});return reply;
 }
 if(path==='/api/profile')return {body:{id:101,username:'fixture',presentationName:'Fixture Student'}};
 if(path.includes('/notifications')||path==='/users/101/goals')return {body:{content:[],totalElements:0,totalPages:0,empty:true}};
 return {status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const fill=async(label,value)=>{
 await browser.evaluate(`document.querySelector('#auth-active-field')?.removeAttribute('id');Array.from(document.querySelectorAll('[aria-label="${label}"]')).find(el=>el.getClientRects().length&&!el.closest('[aria-hidden="true"]')).id='auth-active-field'`);
 await browser.fill('#auth-active-field',value);
};
const text=value=>`document.body.textContent.includes(${JSON.stringify(value)})`;
async function checkLayout(form){
 for(const [width,height]of [[320,844],[390,844],[600,390],[844,390],[1024,768]]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
  await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  const card=`Array.from(document.querySelectorAll('[data-testid="auth-card"]')).find(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`;
  await browser.wait(`(()=>{const r=(${card}).getBoundingClientRect();return innerWidth>innerHeight?r.left>=innerWidth*.4&&r.width<=innerWidth*.55:Math.abs(r.left+r.width/2-innerWidth/2)<2;})()`);
  await browser.evaluate(`(async()=>{const fields=(${card}).querySelectorAll('input,[role=button]');for(const e of fields){e.scrollIntoView({block:'center'});await new Promise(requestAnimationFrame);const r=e.getBoundingClientRect();if(r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1)throw Error('Inaccessible auth field: '+e.getAttribute('aria-label'));}})()`);
  if(width===844){const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/m4d-mobile-'+form+'-landscape.png',Buffer.from(shot.data,'base64'));}
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
try{
 await browser.command('Emulation.setTimezoneOverride',{timezoneId:'America/Lima'});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__RealDate=Date;window.__sceneNow=new Date(2026,10,9,4,59).getTime();window.Date=class extends Date{constructor(...args){if(args.length)super(...args);else super(window.__sceneNow);}static now(){return window.__RealDate.now();}};window.__sceneHidden=false;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__sceneHidden?'hidden':'visible'});`});
 await browser.navigate('/');await browser.wait(has('Username'));await browser.wait(`!!document.querySelector('[data-testid="study-scene-night"]')`);
 for(const [hour,period]of [[5,'morning'],[12,'afternoon'],[18,'night']]){
  await browser.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__sceneNow=new window.__RealDate(2026,10,9,${hour}).getTime();window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);
  await browser.wait(`!!document.querySelector('[data-testid="study-scene-${period}"]')`);
  await browser.wait(`Array.from(document.images).some(img=>img.src.includes('${period}-base')&&img.complete&&img.naturalWidth>0)`);
  await checkLayout('login');
  await new Promise(resolve=>setTimeout(resolve,100));
  const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/auth72-mobile-${period}.png`,Buffer.from(shot.data,'base64'));
 }
 await browser.wait(`!!document.querySelector('[data-testid="ambient-running"]')`);
 const before=await browser.evaluate(`getComputedStyle(document.querySelector('[data-testid="scene-stars"]')).opacity`);
 await new Promise(resolve=>setTimeout(resolve,350));
 assert.notEqual(await browser.evaluate(`getComputedStyle(document.querySelector('[data-testid="scene-stars"]')).opacity`),before);
 const exterior=await browser.evaluate(`getComputedStyle(document.querySelector('[data-testid="scene-landscape"]')).transform`);
 await new Promise(resolve=>setTimeout(resolve,350));
 assert.equal(exterior,'none');
 assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('[data-testid="scene-landscape"]')).transform`),exterior);
 // Daytime tracks move independently and leave the landscape fixed.
 await browser.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__sceneNow=new window.__RealDate(2026,10,9,9).getTime();window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);
 await browser.wait(`!!document.querySelector('[data-testid="scene-cloud-track-0"]')`);
 const clouds=await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid^="scene-cloud-track-"]')).map(e=>getComputedStyle(e).transform)`);
 await new Promise(resolve=>setTimeout(resolve,500));
 const after=await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid^="scene-cloud-track-"]')).map(e=>getComputedStyle(e).transform)`);
 for(let i=0;i<3;i++)assert.notEqual(clouds[i],after[i]);
 assert.equal(new Set(after).size,3);
 assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('[data-testid="ambient-running"]')).transform`),'none');
 await browser.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);
 await browser.wait(`!!document.querySelector('[data-testid="ambient-paused"]')`);
 await browser.evaluate(`window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.wait(`!!document.querySelector('[data-testid="ambient-paused"]')`);
 for(const width of [320,390,768]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await browser.wait(`document.querySelector('[data-testid^="study-scene-"]').getBoundingClientRect().width===${width}`);
  const frame=await browser.evaluate(`(()=>{const r=document.querySelector('[data-testid^="study-scene-"]').getBoundingClientRect();return [r.x,r.y,r.height]})()`);assert.deepEqual(frame,[0,0,844]);
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:600,height:390,deviceScaleFactor:1,mobile:true});
 await browser.wait(`document.querySelector('[data-testid^="study-scene-"]').getBoundingClientRect().height===390`);
 await new Promise(resolve=>setTimeout(resolve,150));
 await fill('Username','fixture');await fill('Password','Fixture-pass-1');
 await browser.evaluate(`document.querySelector('[aria-label="Password"]').focus()`);
 assert.equal(await browser.evaluate('document.activeElement.getAttribute("aria-label")'),'Password');
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await browser.wait(`!!document.querySelector('[data-testid="auth-brand"]')`);
 await browser.evaluate(`Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Create an account').click()`);
 await browser.wait(has('Email'));
 await browser.evaluate('history.back()');await browser.wait(`location.pathname==='/sign-in'`);
 await browser.evaluate(`Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Create an account'&&a.getClientRects().length&&!a.closest('[aria-hidden="true"]')).click()`);await browser.wait(`location.pathname==='/sign-up'`);
 for(const hour of [5,12,18]){await browser.evaluate(`window.__sceneHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__sceneNow=new window.__RealDate(2026,10,9,${hour}).getTime();window.__sceneHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await checkLayout('register');}
 await fill('Username','fixture');await fill('Email','fixture@example.invalid');await fill('Password','Fixture-pass-1');
 await browser.click('Create account');await browser.wait(text('conflicts'));rejectRegistration=false;holdRegister=true;await browser.click('Create account');
 await browser.wait(`document.querySelector('[aria-label="Create account"]').getAttribute('aria-disabled')==='true'`);assert.ok(finishRegister);finishRegister();await browser.wait(text('Account created. Sign in to continue.'));
 await fill('Username','fixture');await fill('Password','Fixture-pass-1');await browser.click('Sign in');await browser.wait(text('credentials are incorrect'));rejectLogin=false;holdLogin=true;await browser.click('Sign in');
 await browser.wait(`Array.from(document.querySelectorAll('[aria-label="Sign in"]')).some(e=>e.getAttribute('aria-disabled')==='true')`);assert.ok(finishLogin);finishLogin();await browser.wait(has('Create a goal'));
 await browser.click('Open menu');await browser.click('Settings');await browser.wait(has('Light'));await browser.click('Light');await browser.click('Orange');
 await browser.evaluate('history.back()');await browser.wait(has('Open menu'));await browser.click('Open menu');await browser.wait(has('Sign out'));await browser.click('Sign out');await browser.wait(has('Username'));
 const lightLogin=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/fullscreen-light-login.png',Buffer.from(lightLogin.data,'base64'));
 await browser.evaluate(`Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Create an account'&&a.getClientRects().length).click()`);await browser.wait(has('Email'));
 const lightRegister=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/fullscreen-light-register.png',Buffer.from(lightRegister.data,'base64'));
 assert.deepEqual(browser.errors,[]);
 process.stdout.write('Mobile auth passed: three periods on Login/Register, static scenery and independent motion, Reduce Motion/background, 320/390 portrait and 600/844/1024 landscape, reachable controls, focus/Back simulation, loading/errors/register/login/logout. Chrome fixtures, not physical Android.\n');
}catch(error){process.stderr.write(JSON.stringify(browser.errors)+'\n');process.stderr.write(await browser.evaluate('document.body.innerText')+'\n');process.stderr.write(JSON.stringify(await browser.evaluate('Array.from(document.images).map(i=>({src:i.src,w:i.naturalWidth,complete:i.complete}))'))+'\n');throw error;}
finally{finishRegister?.();finishLogin?.();await browser.close();}
