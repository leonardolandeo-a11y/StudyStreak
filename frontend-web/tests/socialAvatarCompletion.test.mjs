import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:'completion',userId:42,email:'fixture@invalid.test',role:'USER',type:'access',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.');
const image=readFileSync(new URL('../../src/test/resources/profile/image.png',import.meta.url));
const own={id:42,username:'completion',presentationName:'Completion',bio:null,statistics:{studyStreak:0,bestStudyStreak:0,verifiedMinutes:0,verifiedSessions:0,activeGoals:0}};
const paged=content=>({content,number:0,size:10,totalPages:1,totalElements:content.length,first:true,last:true,empty:!content.length});
const links=[77,78,79].map((id,index)=>({id,requesterId:42,receiverId:id,requesterUsername:'completion',receiverUsername:['Avatar partner','Missing photo','Restricted photo'][index],status:['ACCEPTED','PENDING','REJECTED'][index]}));
const room={id:'avatar-room',name:'Avatar room',inviteCode:'FIXTURE',ownerId:77,host:false,phase:'FOCUS',timerStatus:'PAUSED',remainingSeconds:1500,endsAt:null,serverNow:new Date().toISOString(),version:1,members:[{userId:77,username:'Avatar partner',host:true,online:true,studying:true},{userId:78,username:'Missing photo',host:false,online:false,studying:false},{userId:79,username:'Restricted photo',host:false,online:true,studying:false}]};

async function fixture(){
 const avatarReads=new Map();const state={validations:false};let absentAuthorization=false;
 const page=await profileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;
  if(path==='/api/profile')return {body:own};
  if(path==='/api/profile/privacy')return {body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
  if(path==='/api/users/42/profile')return {body:{...own,registrationDate:null,statistics:{},presence:{status:'HIDDEN',lastSeenAt:null,serverNow:'2026-11-07T12:00:00Z'}}};
  if(path==='/api/tracking-links/active')return {body:paged(state.validations?links.map(link=>({...link,status:'ACCEPTED'})):[links[0]])};
  if(path==='/api/tracking-links')return {body:paged(links)};
  if(path==='/api/tracking-links/pending')return {body:paged([])};
  const match=path.match(/^\/api\/users\/(\d+)\/profile\/avatar$/);
  if(match){const id=Number(match[1]);avatarReads.set(id,(avatarReads.get(id)??0)+1);absentAuthorization ||= !(request.headers.Authorization??request.headers.authorization)?.startsWith('Bearer ');await new Promise(r=>setTimeout(r,50));return id===77?{body:image,type:'image/png'}:{status:id===79?403:404};}
  if(path==='/api/profile/avatar'||path==='/api/profile/banner')return {status:404};
  if(path.endsWith('/goals'))return {body:paged([])};
  if(path==='/api/study-rooms')return {body:[room]};
  if(path.endsWith('/media'))return {body:{enabled:false,epoch:'fixture',permissions:[],canPublish:false}};
  if(path.endsWith('/collaboration'))return {body:{messages:[],presence:[],totalPages:0}};
  if(path.endsWith('/selection'))return {body:{goalId:null,sessions:[]}};
  if(path.startsWith('/api/study-rooms/'))return {body:room};
  return {body:path.includes('unread')?0:{}};
 }});
 await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__avatarUrls={created:[],revoked:[]};const c=URL.createObjectURL.bind(URL),r=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=c(b);window.__avatarUrls.created.push(u);return u};URL.revokeObjectURL=u=>{window.__avatarUrls.revoked.push(u);r(u)};window.__roomTicks=new Map();const set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);window.setInterval=(fn,ms,...args)=>{const id=set(fn,ms,...args);if(ms===4000)window.__roomTicks.set(id,fn);return id};window.clearInterval=id=>{window.__roomTicks.delete(id);clear(id)};`});
 return {page,state,avatarReads,authorized:()=>!absentAuthorization};
}
const options={timeout:90000,skip:!chrome&&'Chrome unavailable'};

test('Chrome: protected avatars in history, Validations and room participants preserve existing flows',options,async()=>{
 const {page,state,avatarReads,authorized}=await fixture();
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await page.navigate('/tracking-links');
  await page.wait('Array.from(document.querySelectorAll(".tracking-partner")).some(a=>a.querySelector("img")?.naturalWidth>0)');
  assert.equal(avatarReads.get(77),1,'Active and history rows should share their in-flight avatar request');
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll(".tracking-partner")).every(a=>a.querySelector("img")||a.querySelector("[aria-hidden=true]")?.textContent)'));
  assert.ok(await page.evaluate('["ACCEPTED","PENDING","REJECTED"].every(s=>Array.from(document.querySelectorAll("article")).some(a=>a.classList.contains("tracking-partner")&&a.textContent.includes(s)&&a.textContent.includes("Sent")))'));
  state.validations=true;
  await page.evaluate('history.pushState({},"","/validations");window.dispatchEvent(new PopStateEvent("popstate"))');
  await page.wait('!!document.querySelector("section[aria-label^=Select] article img")');
  await page.evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent.trim()==="View goals").click()');
  await page.wait('Array.from(document.querySelectorAll("button")).some(b=>b.textContent.trim()==="Refresh goals" && b.getAttribute("aria-pressed")==="true")');
  assert.equal(await page.evaluate(`!!document.querySelector('section[aria-label="Select tracking partner"] a[href^="/users/"]')`),false,'F5 removes profile navigation from the validation wizard; goal selection remains available');
  await page.evaluate('history.pushState({},"","/study-rooms");window.dispatchEvent(new PopStateEvent("popstate"))');
  await page.wait('Array.from(document.querySelectorAll("button")).some(b=>b.textContent.includes("Avatar room"))');
  await page.evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("Avatar room")).click()');
  await page.wait('!!document.querySelector("[data-room-participant] img")');
  await page.wait('document.querySelectorAll("[data-room-participant]").length===3');
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll("[data-room-participant]")).some(a=>a.textContent.includes("Host · Connected to room")&&a.textContent.includes("Studying"))'));
  assert.ok(await page.evaluate('Array.from(document.querySelectorAll("[data-room-participant]")).filter(a=>!a.textContent.includes("Avatar partner")).every(a=>!a.querySelector("img")&&!!a.querySelector("[aria-hidden=true]")?.textContent)'));
  // The protected-image queue has concurrency two. Wait for the third initial
  // request before taking the baseline; its placeholder is visible while queued.
  for(let attempt=0;[77,78,79].some(id=>(avatarReads.get(id)??0)<3)&&attempt<100;attempt++)await new Promise(resolve=>setTimeout(resolve,20));
  assert.ok([77,78,79].every(id=>(avatarReads.get(id)??0)>=3),'All initial participant avatar requests started');
  const counts=Array.from(avatarReads);await page.evaluate('window.__roomTicks.forEach(fn=>fn())');await page.evaluate('new Promise(r=>setTimeout(r,150))');assert.deepEqual(Array.from(avatarReads),counts,'Room refresh must not download avatars again');
  for(const path of ['/study-rooms','/validations','/tracking-links']){
   if(path!=='/study-rooms'){await page.evaluate(`history.pushState({},"",${JSON.stringify(path)});window.dispatchEvent(new PopStateEvent("popstate"))`);await page.wait('!!document.querySelector("main h1")');}
   for(const width of [320,375,768,1024,1440]){
    await page.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
    for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
     await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:false})`);
     assert.ok(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),`${path}/${width}/${mode}/${accent}`);
    }
    if(process.env.STUDYSTREAK_AVATAR_SCREENSHOTS&&[320,1440].includes(width)){
     await page.evaluate('new Promise(r=>setTimeout(r,200))');
     await page.evaluate(path==='/study-rooms'?'document.querySelector("[data-room-participant]").scrollIntoView({block:"center"})':path==='/validations'?'document.querySelector("section[aria-label^=Select] article").scrollIntoView({block:"center"})':'document.querySelector(".tracking-partner").scrollIntoView({block:"center"})');
     const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(join(tmpdir(), `studystreak-complete-${path.slice(1)}-${width}.png`),Buffer.from(shot.data,'base64'));
    }
   }
  }
  assert.equal(authorized(),true);
  await page.evaluate('history.pushState({},"","/profile");window.dispatchEvent(new PopStateEvent("popstate"))');await page.wait('!!document.querySelector("[data-profile-page]")');
  assert.ok(await page.evaluate('window.__avatarUrls.created.every(u=>window.__avatarUrls.revoked.includes(u))'));
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});

test('Chrome: book leaf crosses the spine without moving the book; goal pulse scales to 91 percent',options,async()=>{
 const {page}=await fixture();
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await page.navigate('/profile');
  const point=await page.evaluate('(()=>{const r=document.querySelector("a[data-nav-icon=Resources]").getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()');
  await page.command('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
  const frames=[];
  for(const time of [0,75,150,225,300]){
   const data=await page.evaluate(`(()=>{const icon=document.querySelector('a[data-nav-icon=Resources] svg'),leaf=icon.querySelector('.sidebar-resource-page');const animation=leaf.getAnimations()[0];animation.pause();animation.currentTime=${time};const m=new DOMMatrix(getComputedStyle(leaf).transform);return {scale:m.a,opacity:Number(getComputedStyle(leaf).opacity),bookTransform:getComputedStyle(icon).transform,fixed: Array.from(icon.children).filter(p=>p!==leaf).every(p=>getComputedStyle(p).transform==='none'),width:icon.getBoundingClientRect().width}})()`);
   frames.push(data);
   if(process.env.STUDYSTREAK_AVATAR_SCREENSHOTS){const shot=await page.command('Page.captureScreenshot',{format:'png',clip:{x:0,y:220,width:256,height:120,scale:3}});writeFileSync(join(tmpdir(), `studystreak-book-frame-${time}.png`),Buffer.from(shot.data,'base64'));}
  }
  assert.ok(frames[0].scale>0.99&&frames[2].scale<-.99&&frames[4].scale>.99);assert.ok(frames[1].opacity>.99 && Math.abs(frames[1].scale)<.9);
  assert.ok(frames.every(f=>f.bookTransform==='none'&&f.fixed&&Math.abs(f.width-22)<.1));
  await page.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await page.key('Tab');
  for(const label of ['Resources','Goals']){await page.evaluate(`document.querySelector('a[data-nav-icon=${label}]').focus()`);assert.ok(await page.evaluate('document.activeElement.matches(":focus-visible")'));}
  await new Promise(resolve=>setTimeout(resolve,300)); // Let the approved link hover translation finish.
  const goalFrames=[];
  for(const time of [0,150,300]){
   goalFrames.push(await page.evaluate(`(()=>{const link=document.querySelector('a[data-nav-icon=Goals]'),svg=link.querySelector('svg'),animation=svg.getAnimations()[0];animation.pause();animation.currentTime=${time};const m=new DOMMatrix(getComputedStyle(svg).transform);return {scale:m.a,b:m.b,c:m.c,width:svg.getBoundingClientRect().width,textX:link.querySelector('span').getBoundingClientRect().x}})()`));
   if(process.env.STUDYSTREAK_AVATAR_SCREENSHOTS){const shot=await page.command('Page.captureScreenshot',{format:'png',clip:{x:0,y:220,width:256,height:120,scale:3}});writeFileSync(join(tmpdir(), `studystreak-goal-frame-${time}.png`),Buffer.from(shot.data,'base64'));}
  }
  assert.ok(Math.abs(goalFrames[1].scale-.91)<.01 && goalFrames.every(f=>Math.abs(f.b)<.001&&Math.abs(f.c)<.001&&Math.abs(f.textX-goalFrames[0].textX)<.5),JSON.stringify(goalFrames));
  assert.ok(goalFrames[1].width<goalFrames[0].width&&Math.abs(goalFrames[2].width-goalFrames[0].width)<.2,JSON.stringify(goalFrames));
  for(const label of ['Resources','Goals']){
   await page.evaluate(`document.querySelector('a[data-nav-icon=${label}]').focus()`);
   await page.evaluate('window.studyStreakAppearance.apply({mode:"dark",accent:"mint",reduceMotion:true})');
   assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('a[data-nav-icon=${label}] ${label==='Resources'?'.sidebar-resource-page':'svg'}')).animationName`),'none');
   await page.evaluate('window.studyStreakAppearance.apply({mode:"dark",accent:"mint",reduceMotion:false})');
  }
  await page.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await page.evaluate('document.querySelector("a[data-nav-icon=Resources]").focus()');assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".sidebar-resource-page")).animationName'),'none');
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});
