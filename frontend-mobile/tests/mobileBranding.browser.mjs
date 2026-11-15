import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {mobileBrowser} from './helpers/mobileBrowser.mjs';
const claims={type:'access',userId:101,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600};
const browser=await mobileBrowser({intercept:async request=>{
 const path=new URL(request.url).pathname;
 if(path==='/login')return {body:{token:`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`,refreshToken:'fixture-only'}};
 if(path==='/api/profile')return {body:{id:101,username:'fixture',presentationName:'Fixture Student'}};
 if(path.includes('/notifications')||path==='/users/101/goals')return {body:{content:[],totalElements:0,totalPages:0,empty:true}};
 return {status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
try{
 await browser.command('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:true});
 await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','fixture-password');await browser.click('Sign in');await browser.wait(has('Create a goal'));
 for(const width of [320,390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
  await browser.click('Open menu');await browser.wait(has('Close menu'));
  await browser.wait(`Array.from(document.querySelectorAll('[data-testid="study-brand"]')).some(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>0;})`);
  const result=await browser.evaluate(`(()=>{const brand=Array.from(document.querySelectorAll('[data-testid="study-brand"]')).find(el=>el.getBoundingClientRect().left>=0&&el.getBoundingClientRect().right<=innerWidth);const mark=brand.querySelector('[data-testid="study-mark"]');const r=mark.getBoundingClientRect();return {label:brand.getAttribute('aria-label'),width:r.width,height:r.height,hasSvg:!!mark.querySelector('svg'),fits:document.documentElement.scrollWidth<=innerWidth};})()`);
  assert.equal(result.label,'StudyStreak');assert.equal(result.width,36);assert.equal(result.height,36);assert.equal(result.hasSvg,false);assert.equal(result.fits,true);
  if(width===390){const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/branding71-drawer.png',Buffer.from(shot.data,'base64'));}
  await browser.click('Close menu');await browser.waitForDrawerClosed();
 }
 await browser.click('Open menu');await browser.click('Settings');await browser.wait(has('Light'));await browser.click('Light');await browser.click('Orange');await browser.evaluate('history.back()');await browser.wait(has('Open menu'));await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await browser.click('Open menu');await browser.wait(has('Close menu'));await browser.wait(`Array.from(document.querySelectorAll('[data-testid="study-brand"]')).some(el=>{const r=el.getBoundingClientRect();return r.left>=19&&r.right<=innerWidth;})`);
 const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/branding71-drawer-light.png',Buffer.from(shot.data,'base64'));await browser.click('Menu');await browser.waitForDrawerClosed();assert.deepEqual(browser.errors,[]);
 process.stdout.write('Native branding browser passed: generated pixel primitives, 320–1440 drawer, close/navigation, Settings/Back and Light/Orange.\n');
}finally{await browser.close();}
