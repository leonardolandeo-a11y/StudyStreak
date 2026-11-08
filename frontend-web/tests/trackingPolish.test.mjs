import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:'tracking_fixture',userId:42,email:'fixture@invalid.test',role:'USER',type:'access',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.');
const image=readFileSync(new URL('../../src/test/resources/profile/image.png',import.meta.url));
const pageOf=content=>({content,number:0,size:10,totalElements:content.length,totalPages:1,first:true,last:true,empty:!content.length});
const own={id:42,username:'tracking_fixture',presentationName:'Tracking fixture',displayName:null,bio:null,statistics:{studyStreak:0,bestStudyStreak:0,verifiedMinutes:0,verifiedSessions:0,activeGoals:0}};

test('Chrome: Tracking avatars preserve search/send flow, fallback, responsive and sidebar animations',{timeout:90000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const writes=[];let avatarRequests=0,missingBearer=false;
 const page=await profileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;
  if(path==='/api/profile')return {body:own};
  if(path==='/api/profile/privacy')return {body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
  if(path==='/api/users/42/profile')return {body:{...own,statistics:{},registrationDate:null,presence:{status:'HIDDEN',lastSeenAt:null,serverNow:'2026-11-07T12:00:00Z'}}};
  if(path==='/users/search')return {body:pageOf([{id:77,username:'Avatar partner'},{id:78,username:'Hidden avatar'},{id:79,username:'Missing avatar'}])};
  if(path==='/api/tracking-links/active')return {body:pageOf([{id:1,requesterId:42,receiverId:77,requesterUsername:'tracking_fixture',receiverUsername:'Avatar partner',status:'ACCEPTED'},{id:2,requesterId:42,receiverId:79,requesterUsername:'tracking_fixture',receiverUsername:'Missing avatar',status:'ACCEPTED'}])};
  if(request.method==='POST'&&path==='/api/tracking-links/78'){writes.push(path);return {status:201,body:{id:3,requesterId:42,receiverId:78,status:'PENDING'}};}
  if(path.startsWith('/api/tracking-links'))return {body:pageOf([])};
  if(path==='/api/users/77/profile/avatar'){
   avatarRequests++;missingBearer ||= !(request.headers.Authorization??request.headers.authorization)?.startsWith('Bearer ');
   return {body:image,type:'image/png'};
  }
  if(path.includes('/avatar')||path.includes('/banner'))return {status:404};
  return {body:path.includes('unread')?0:{}};
 }});
 try{
  await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__trackingUrls={created:[],revoked:[]};const c=URL.createObjectURL.bind(URL),r=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=c(b);window.__trackingUrls.created.push(u);return u};URL.revokeObjectURL=u=>{window.__trackingUrls.revoked.push(u);r(u)};`});
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await page.navigate('/tracking-links');
  await page.wait('Array.from(document.querySelectorAll("article")).some(a=>a.textContent.includes("Avatar partner")&&a.querySelector("img")?.naturalWidth>0)');
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll("article")).some(a=>a.textContent.includes("Missing avatar")&&!a.querySelector("img")&&a.querySelector("[aria-hidden=true]")?.textContent==="M")'));
  await page.fill('#partner-search','partner');
  await page.wait('Array.from(document.querySelectorAll("form button")).some(b=>b.querySelector("span[title]")?.textContent==="@Avatar partner"&&b.querySelector("img")?.naturalWidth>0)');
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll("form button")).filter(b=>["@Hidden avatar","@Missing avatar"].includes(b.querySelector("span[title]")?.textContent)).every(b=>!b.querySelector("img")&&!!b.querySelector("[aria-hidden=true]")?.textContent)'));
  for(const width of [320,375,768,1024,1440]){
   await page.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
   for(const mode of ['dark','light'])for(const accent of ['mint','blue','purple','orange']){
    await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:false})`);
    assert.ok(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),`${width}/${mode}/${accent}`);
   }
   if(process.env.STUDYSTREAK_TRACKING_SCREENSHOTS&&[320,1440].includes(width)){
    await page.evaluate('window.scrollTo(0,0);new Promise(r=>setTimeout(r,200))');
    const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/studystreak-tracking-polish-${width}.png`,Buffer.from(shot.data,'base64'));
    await page.evaluate('document.querySelector("article").scrollIntoView({block:"center"})');
    const active=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/studystreak-tracking-active-${width}.png`,Buffer.from(active.data,'base64'));
    await page.evaluate('window.scrollTo(0,0)');
   }
  }
  await page.evaluate('Array.from(document.querySelectorAll("form button")).find(b=>b.querySelector("span[title]")?.textContent==="@Hidden avatar").click()');
  await page.wait('document.querySelector("form [role=status]")?.textContent.includes("Selected: @Hidden avatar")');
  await page.click('Send Request');await page.wait('document.querySelector("#partner-search").value===""');
  assert.deepEqual(writes,['/api/tracking-links/78']);assert.equal(missingBearer,false);assert.ok(avatarRequests>0);
  const point=await page.evaluate('(()=>{const r=document.querySelector("a[data-nav-icon=Resources]").getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()');
  await page.command('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector("a[data-nav-icon=Resources] svg>path:last-child")).animationName'),'sidebar-page');
  await page.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  for(const label of ['Resources','Goals']){
   await page.evaluate(`document.querySelector('a[data-nav-icon=${label}]').focus()`);
   assert.notEqual(await page.evaluate(`getComputedStyle(document.querySelector('a[data-nav-icon=${label}] ${label==='Goals'?'svg':'svg>path:last-child'}')).animationName`),'none');
  }
  assert.ok(await page.evaluate('(()=>{const svg=document.querySelector("a[data-nav-icon=Goals] svg");const animation=svg.getAnimations()[0];animation.pause();animation.currentTime=150;const matrix=new DOMMatrix(getComputedStyle(svg).transform);return Math.abs(matrix.a-0.86)<0.01&&Math.abs(matrix.b)<0.001})()'));
  await page.evaluate('window.studyStreakAppearance.apply({mode:"dark",accent:"mint",reduceMotion:true})');
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector("a[data-nav-icon=Goals] svg")).animationName'),'none');
  await page.evaluate('document.querySelector("a[data-nav-icon=Resources]").focus()');
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector("a[data-nav-icon=Resources] svg>path:last-child")).animationName'),'none');
  await page.evaluate('window.studyStreakAppearance.apply({mode:"dark",accent:"mint",reduceMotion:false})');
  await page.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector("a[data-nav-icon=Resources] svg>path:last-child")).animationName'),'none');
  await page.evaluate('history.pushState({},"","/profile");window.dispatchEvent(new PopStateEvent("popstate"))');
  await page.wait('!!document.querySelector("[data-profile-page]")');
  assert.ok(await page.evaluate('window.__trackingUrls.created.every(u=>window.__trackingUrls.revoked.includes(u))'));
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});
