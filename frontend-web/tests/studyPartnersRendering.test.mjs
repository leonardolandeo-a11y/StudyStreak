import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:'partners_test',userId:42,email:'fixture@invalid.test',role:'USER',type:'access',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.');
const image=readFileSync(new URL('../../src/test/resources/profile/image.png',import.meta.url));
const own={id:42,username:'partners_test',presentationName:'Partners test',displayName:null,bio:null,statistics:{studyStreak:0,bestStudyStreak:0,verifiedMinutes:0,verifiedSessions:0,activeGoals:0}};
const now='2026-11-07T12:00:00Z';
const presence=status=>({status,lastSeenAt:null,serverNow:now});
const script=`sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__partnersTimers=new Map();const set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);window.setInterval=(fn,ms,...args)=>{const id=set(fn,ms,...args);if(ms===60000)window.__partnersTimers.set(id,fn);return id};window.clearInterval=id=>{window.__partnersTimers.delete(id);clear(id)};window.__partnersUrls={created:[],revoked:[]};const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=create(b);window.__partnersUrls.created.push(u);return u};URL.revokeObjectURL=u=>{window.__partnersUrls.revoked.push(u);revoke(u)};`;
const tick=page=>page.evaluate('window.__partnersTimers.forEach(fn=>fn())');
const toggle=page=>page.evaluate('Array.from(document.querySelectorAll("[data-partners-toggle]")).find(b=>b.getBoundingClientRect().width>0).click()');
const panel='[data-partners-scroll]';

async function fixture() {
 const state={viewer:42,ownPresence:false,revoked:false,error:false,empty:false,avatarError:true,profileError:true,pages:1,trackRequests:0,avatarRequests:new Map(),presenceRequests:new Map(),heartbeats:0,profileActive:0,maxProfileActive:0,imageActive:0,maxImageActive:0};
 const statuses=new Map([[77,presence('ONLINE')],[78,{...presence('OFFLINE'),lastSeenAt:'2026-11-07T10:00:00Z'}],[79,presence('HIDDEN')],[80,{...presence('HIDDEN'),lastSeenAt:'2026-11-06T12:00:00Z'}]]);
 const names=new Map([[77,'A long name 李 '.repeat(8)],[78,'Offline partner'],[79,'Hidden partner'],[80,'Last activity only'],[81,'Temporarily unavailable'],[82,'Denied profile'],[83,'Pending user'],[90,'Next page partner']]);
 const page=await profileBrowser({intercept:async request=>{
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/profile')return {body:{...own,id:state.viewer,presentationName:state.viewer===42?'Partners test':'Next account'}};
  if(path==='/login'){state.viewer=99;const value=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:'next_account',userId:99,email:'next@invalid.test',role:'USER',type:'access',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.');return {body:{token:value,refreshToken:'synthetic-only'}};}
  if(path==='/logout')return {status:204};
  if(path.endsWith('/goals'))return {body:{content:[],number:0,size:100,totalElements:0,totalPages:0,first:true,last:true,empty:true}};
  if(path==='/api/study/history')return {body:{content:[],totalPages:0}};
  if(path==='/api/study/active')return {body:{sessions:[]}};
  if(path==='/api/focus-sessions/stats'){
   const daily=Array.from({length:7},(_,index)=>({date:`2026-11-0${index+1}`,minutes:0,sessions:0}));
   return {body:{days:7,timeZone:'America/Lima',daily,verifiedPeriod:{minutes:0,sessions:0,daily},activity:daily,byGoal:[],hourly:[],weekly:[],monthly:[],totalMinutes:0,completedSessions:0,periodMinutes:0,periodSessions:0,bestDayMinutes:0,verifiedMinutes:0,estimatedMinutes:0,groupMinutes:0,individualMinutes:0,groupSessions:0,previousMinutes:0,changePercent:null,completionPercent:null,averageMinutes:0,activeDays:0,studyStreak:0,bestStudyStreak:0,weekMinutes:0}};
  }
  if(path==='/api/profile/privacy')return {body:{showPresence:state.ownPresence,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
  if(path==='/api/presence/heartbeat'){state.heartbeats++;return {body:presence(state.ownPresence?'ONLINE':'HIDDEN')};}
  if(path==='/api/profile/avatar'||path==='/api/profile/banner')return {status:404};
  if(path===`/api/users/${state.viewer}/profile`)return {body:{...own,id:state.viewer,registrationDate:null,statistics:{},presence:presence('HIDDEN')}};
  if(path==='/api/tracking-links/active'){
   state.trackRequests++;await new Promise(r=>setTimeout(r,30));
   if(state.error)return {status:500,body:{}};
   const index=Number(url.searchParams.get('page')??0);
   const ids=state.empty?[]:index===0?[77,78,79,80,81,82,83].filter(id=>!(id===77&&state.revoked)):[90];
   return {body:{content:ids.map(id=>({id,requesterId:state.viewer,receiverId:id,requesterUsername:'partners_test',receiverUsername:names.get(id),status:id===83?'PENDING':'ACCEPTED'})),number:index,size:10,totalElements:state.empty?0:state.pages>1?11:ids.length,totalPages:state.empty?0:state.pages,first:index===0,last:index+1>=state.pages,empty:!ids.length}};
  }
  const match=path.match(/^\/api\/users\/(\d+)\/(profile|presence)(?:\/(avatar|banner))?$/);
  if(match){
   const id=Number(match[1]),slot=match[3];
   if(id===82||id===77&&state.revoked)return {status:404,body:{}};
   if(slot){
    if(slot==='banner')return {status:404};
    state.avatarRequests.set(id,(state.avatarRequests.get(id)??0)+1);state.imageActive++;state.maxImageActive=Math.max(state.maxImageActive,state.imageActive);
    await new Promise(r=>setTimeout(r,35));state.imageActive--;
    if(id===80&&state.avatarError)return {status:503};
    return id===79?{status:404}:{body:image,type:'image/png'};
   }
   if(match[2]==='presence'){state.presenceRequests.set(id,(state.presenceRequests.get(id)??0)+1);return {body:statuses.get(id)??presence('HIDDEN')};}
   state.profileActive++;state.maxProfileActive=Math.max(state.maxProfileActive,state.profileActive);await new Promise(r=>setTimeout(r,25));state.profileActive--;
   if(id===81&&state.profileError)return {status:500};
   return {body:{id,username:'partner_'+id,presentationName:names.get(id),bio:null,registrationDate:null,statistics:{},presence:statuses.get(id)??presence('HIDDEN')}};
  }
  return {body:path.includes('unread')?0:{}};
 }});
 await page.command('Page.addScriptToEvaluateOnNewDocument',{source:script});
 return {page,state,statuses,names};
}

test('Chrome: partners lifecycle, privacy groups, lazy avatars, revocation, pagination and profile history',{timeout:120000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const {page,state,statuses,names}=await fixture();
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await page.navigate('/profile');await page.wait('!!document.querySelector("[data-profile-page] h2")');
  assert.equal(state.trackRequests,0);assert.equal(await page.evaluate('window.__partnersTimers.size'),0);
  await toggle(page);await page.wait('document.querySelector("[data-partners-scroll]")?.textContent.includes("Loading study partners")');
  await page.wait('document.querySelectorAll("[data-partners-scroll] li").length===5');
  assert.ok(await page.evaluate('document.activeElement.getAttribute("aria-label")==="Close study partners"'));
  assert.ok(await page.evaluate('!!document.querySelector("section[aria-label=Online] li") && !!document.querySelector("section[aria-label=Offline] time")'));
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll("section[aria-label=Offline] li")).every(li=>!li.textContent.includes("Hidden partner"))'));
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll("[data-partners-scroll] li")).filter(li=>li.textContent.includes("Status hidden")).every(li=>!li.querySelector("[role=img]"))'));
  assert.ok(await page.evaluate('!document.querySelector("[data-partners-scroll]").textContent.includes("Pending user") && !document.querySelector("[data-partners-scroll]").textContent.includes("Denied profile")'));
  await page.wait('Array.from(document.querySelectorAll("button")).some(b=>b.getAttribute("aria-label")==="Retry avatar for Last activity only")');
  state.avatarError=false;await page.evaluate('document.querySelector("button[aria-label^=Retry]").click()');
  await page.wait('Array.from(document.querySelectorAll("[data-partners-scroll] li")).find(li=>li.textContent.includes("Last activity only"))?.querySelector("img")?.naturalWidth>0');
  assert.equal(state.avatarRequests.get(80),2);assert.equal(state.maxProfileActive,2);assert.ok(state.maxImageActive<=2);assert.equal(state.heartbeats,0);
  const imageCounts=Array.from(state.avatarRequests);
  assert.ok(await page.evaluate('!Array.from(document.querySelectorAll("[data-partners-scroll] li")).find(li=>li.textContent.includes("Hidden partner")).querySelector("time") && !!Array.from(document.querySelectorAll("[data-partners-scroll] li")).find(li=>li.textContent.includes("Last activity only")).querySelector("time")'));
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll("[data-partners-scroll] li")).find(li=>li.textContent.includes("Temporarily unavailable")).textContent.includes("Status unavailable")'));
  await page.key('Escape');await page.wait('!document.querySelector("[data-partners-scroll]")');
  await toggle(page);await page.wait('Array.from(document.querySelectorAll("[data-partners-scroll] li")).find(li=>li.textContent.includes("Offline partner"))?.querySelector("img")?.naturalWidth>0');
  assert.deepEqual(Array.from(state.avatarRequests),imageCounts,'Reopening must reuse validated avatar blobs');
  const trackingAfterReopen=state.trackRequests;
  statuses.set(77,{...presence('OFFLINE'),lastSeenAt:'2026-11-07T11:00:00Z'});
  await page.evaluate("window.__partnersTimers.forEach(fn=>{fn();fn()})");await page.wait('document.querySelector("section[aria-label=Offline]").textContent.includes("A long name")');
  assert.deepEqual(Array.from(state.avatarRequests),imageCounts);assert.equal(state.presenceRequests.get(79)??0,0);
  assert.equal(state.trackRequests,trackingAfterReopen+1,'Overlapping ticks must use one in-flight request');
  await page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');
  await tick(page);await page.evaluate('new Promise(r=>setTimeout(r,80))');assert.equal(state.trackRequests,trackingAfterReopen+1);
  state.revoked=true;
  await page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))');
  await page.wait('!document.querySelector("[data-partners-scroll]").textContent.includes("A long name")');
  state.pages=2;state.profileError=false;await page.evaluate('document.querySelector("[data-partners-scroll] button[aria-label^=Refresh]").click()');
  await page.wait('!!document.querySelector("button[aria-label^=Next]")');
  await page.evaluate('document.querySelector("button[aria-label^=Next]").click()');await page.wait('document.querySelector("[data-partners-scroll]").textContent.includes("Next page partner")');
  await page.evaluate('document.querySelector("button[aria-label^=Previous]").click()');await page.wait('document.querySelector("[data-partners-scroll]").textContent.includes("Hidden partner")');
  const beforeClose=state.trackRequests;
  await page.key('Escape');await page.wait('!document.querySelector("[data-partners-scroll]")');
  assert.equal(await page.evaluate('window.__partnersTimers.size'),0);await tick(page);assert.equal(state.trackRequests,beforeClose);
  assert.ok(await page.evaluate('document.activeElement.matches("[data-partners-toggle]")'));
  assert.ok(await page.evaluate('window.__partnersUrls.created.every(u=>window.__partnersUrls.revoked.includes(u))'));
  await toggle(page);await page.wait('document.querySelector("[data-partners-scroll]")?.textContent.includes("Hidden partner")');
  await page.evaluate('Array.from(document.querySelectorAll("[data-partners-scroll] a")).find(a=>a.pathname==="/users/79/profile").click()');
  await page.wait('location.pathname==="/users/79/profile" && !!document.querySelector("[data-social-profile] h2")');
  await page.click('Back');await page.wait('location.pathname==="/profile"');
  await toggle(page);await page.wait('!!document.querySelector("[data-partners-scroll] li")');
  state.error=true;await tick(page);await page.wait('document.querySelector("[data-partners-scroll] [role=alert]")?.textContent.includes("Could not load")');
  assert.equal(await page.evaluate('document.querySelectorAll("[data-partners-scroll] li").length'),0);
  state.error=false;state.empty=true;await page.click('Retry partners');await page.wait('document.querySelector("[data-partners-scroll]")?.textContent.includes("No study partners yet")');
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});

test('Chrome: responsive partners rail/drawer, keyboard, themes, reduced motion and image cleanup',{timeout:120000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const {page,state}=await fixture();state.avatarError=false;state.profileError=false;
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
  await page.navigate('/profile');await toggle(page);await page.wait('!!document.querySelector("dialog[open] [data-partners-scroll] li")');
  for(const width of [320,375,768,1024,1440]){
   await page.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
   await page.wait(width<1024?'!!document.querySelector("dialog[open]")':'!!document.querySelector(".partners-desktop[data-open=true]")');
   for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
    await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
    assert.ok(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),`Overflow ${width}/${mode}/${accent}`);
   }
   if(width<1024){
    for(let n=0;n<16;n++){await page.key('Tab');assert.ok(await page.evaluate('!!document.activeElement.closest("dialog[open]")'));}
    assert.notEqual(await page.evaluate('getComputedStyle(document.activeElement).outlineStyle'),'none');
   }else{
    await page.evaluate('new Promise(r=>setTimeout(r,260))');
    assert.ok(await page.evaluate('document.querySelector(".partners-desktop").getBoundingClientRect().left>=document.querySelector("main").getBoundingClientRect().right-1'));
    assert.ok(await page.evaluate('document.querySelector("aside").getBoundingClientRect().right<=document.querySelector("main").getBoundingClientRect().left'));
   }
   if(process.env.STUDYSTREAK_PARTNERS_SCREENSHOTS&&[320,1440].includes(width)){
    const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(join(tmpdir(), `studystreak-partners-${width}.png`),Buffer.from(shot.data,'base64'));
   }
  }
  assert.equal(state.trackRequests,1,'Changing viewport must not restart data polling');
  await page.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".partners-desktop")).transitionDuration'),'0s');
  await page.key('Escape');await page.wait('!document.querySelector("[data-partners-scroll]")');
  await page.command('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
  await toggle(page);await page.wait('!!document.querySelector("dialog[open]")');
  await page.evaluate('document.querySelector("button[aria-label^=Close]").click()');await page.wait('!document.querySelector("dialog[open]")');
  assert.ok(await page.evaluate('document.activeElement.matches("[data-partners-toggle]")'));
  assert.equal(await page.evaluate('window.__partnersTimers.size'),0);assert.equal(state.heartbeats,0);
  await page.evaluate('document.querySelector("button[aria-label^=Toggle]").click()');await page.click('Sign out');await page.wait('location.pathname==="/login"');
  assert.ok(await page.evaluate('window.__partnersUrls.created.every(u=>window.__partnersUrls.revoked.includes(u))'));
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});


test('Chrome: active panel cleanup on logout, account isolation and lazy image loading',{timeout:60000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const {page,state}=await fixture();state.avatarError=false;state.profileError=false;
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:500,deviceScaleFactor:1,mobile:false});
  await page.navigate('/profile');await toggle(page);await page.wait('!!document.querySelector("[data-partners-scroll] li img")');
  assert.equal(state.avatarRequests.get(80)??0,0,'Offscreen avatars must wait until visible');
  const firstDownloads=state.avatarRequests.get(77);
  await page.click('Sign out');await page.wait('location.pathname==="/login"');
  assert.equal(await page.evaluate('window.__partnersTimers.size'),0);
  assert.ok(await page.evaluate('window.__partnersUrls.created.every(u=>window.__partnersUrls.revoked.includes(u))'));
  await page.wait('!!document.querySelector("input[autocomplete=username]")');
  await page.fill('input[autocomplete="username"]','next_account');await page.fill('input[type="password"]','SyntheticPassword42!');
  await page.evaluate('document.querySelector("form").requestSubmit()');await page.wait('location.pathname==="/dashboard"');
  await page.evaluate('history.pushState({},"","/profile");window.dispatchEvent(new PopStateEvent("popstate"))');
  await page.wait('document.querySelector("[data-profile-page] h2")?.textContent==="Next account"');
  assert.ok(await page.evaluate('!document.querySelector("[data-partners-scroll]") && window.__partnersTimers.size===0'));
  await toggle(page);await page.wait('!!document.querySelector("[data-partners-scroll] li img")');
  assert.equal(state.avatarRequests.get(77),firstDownloads+1,'A new account must not reuse the previous account avatar cache');
  await page.evaluate('document.querySelector("[data-partners-scroll]").scrollTop=9999');
  await page.wait('Array.from(document.querySelectorAll("[data-partners-scroll] li")).find(li=>li.textContent.includes("Last activity only"))?.querySelector("img")?.naturalWidth>0');
  assert.equal(state.avatarRequests.get(80),1);
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});


test('Chrome: partners polling does not duplicate the existing own heartbeat',{timeout:60000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const {page,state}=await fixture();state.ownPresence=true;state.avatarError=false;
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await page.navigate('/profile');await page.wait('!!document.querySelector("aside [aria-label=Online]")');
  assert.equal(state.heartbeats,1);
  await toggle(page);await page.wait('!!document.querySelector("[data-partners-scroll] li")');
  await tick(page);await page.wait('true');
  assert.equal(state.heartbeats,1,'Partner updates must only GET authorized presence');
  await page.key('Escape');await page.wait('!document.querySelector("[data-partners-scroll]")');
  assert.equal(state.heartbeats,1);assert.equal(await page.evaluate('window.__partnersTimers.size'),0);
  assert.ok(await page.evaluate('!!document.querySelector("aside [aria-label=Online]")'));
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});


test('Chrome: Dashboard and Focus Studio remain usable with the desktop partners panel',{timeout:60000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const {page,state}=await fixture();state.avatarError=false;state.profileError=false;
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await page.navigate('/dashboard');await page.wait('document.querySelector("main h1")?.textContent.includes("Welcome back")');
  await toggle(page);await page.wait('!!document.querySelector("[data-partners-scroll] li")');
  for(const route of ['/dashboard','/focus-studio']){
   await page.evaluate(`history.pushState({},"",${JSON.stringify(route)});window.dispatchEvent(new PopStateEvent("popstate"))`);
   await page.wait(route==='/dashboard'?'document.querySelector("main h1")?.textContent.includes("Welcome back")':'document.querySelector("main h1")?.textContent.includes("Focus Studio")');
   for(const width of [1024,1440]){
    await page.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await page.evaluate('new Promise(r=>setTimeout(r,260))');
    assert.ok(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),route+'/'+width);
    assert.ok(await page.evaluate('!!document.querySelector(".partners-desktop[data-open=true]")'));
   }
  }
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});
