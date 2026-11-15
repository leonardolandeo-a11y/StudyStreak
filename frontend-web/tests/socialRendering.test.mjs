import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const token = [Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:'owner',userId:42,email:'owner@invalid.test',role:'USER',type:'access',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.');
const image=readFileSync(new URL('../../src/test/resources/profile/image.png',import.meta.url));
const own={id:42,username:'owner',presentationName:'Owner',displayName:'Owner',bio:null,statistics:{studyStreak:0,bestStudyStreak:0,verifiedMinutes:0,verifiedSessions:0,activeGoals:0}};
const pageOf=content=>({content,number:0,size:10,totalElements:content.length,totalPages:1,empty:!content.length,first:true,last:true});
const partner={id:77,username:'partner',presentationName:'Partner 李',bio:'<b>Plain text</b>',registrationDate:'2024-05-06',statistics:{},presence:{status:'HIDDEN',lastSeenAt:null,serverNow:'2026-11-07T12:00:00Z'}};
const room={id:'room-fixture',name:'Social room',inviteCode:'CODE123',ownerId:77,host:false,phase:'FOCUS',timerStatus:'PAUSED',remainingSeconds:1500,endsAt:null,serverNow:new Date().toISOString(),version:1,members:[{userId:42,username:'owner',host:false,online:true,studying:false},{userId:77,username:'partner',host:true,online:true,studying:false}]};

test('Chrome: social authorization states, privacy, navigation, themes, keyboard and responsive', {timeout:120000,skip:!chrome&&'Chrome unavailable'},async()=>{
  let denied=false,failed=false,missingImages=false,privacy={showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false};
  let social=structuredClone(partner),pulses=0;const sessionIds=[];
  const page=await profileBrowser({intercept:async request=>{
    const path=new URL(request.url).pathname;
    if(path==='/api/profile')return {body:own};
    if(['/api/profile/avatar','/api/profile/banner'].includes(path))return {status:404};
    if(path==='/api/profile/privacy'){
      if(request.method==='PUT')privacy=JSON.parse(request.postData);
      return {body:privacy};
    }
    if(path==='/api/presence/heartbeat'){
      pulses++;sessionIds.push(JSON.parse(request.postData).sessionId);
      return {body:{status:privacy.showPresence?'ONLINE':'HIDDEN',lastSeenAt:privacy.showLastSeen?'2026-11-07T12:00:00Z':null,serverNow:'2026-11-07T12:00:00Z'}};
    }
    if(path==='/api/users/42/profile')return {body:{...own,registrationDate:null,statistics:{},presence:{status:'HIDDEN',lastSeenAt:null,serverNow:'2026-11-07T12:00:00Z'}}};
    if(path==='/api/users/77/profile')return denied?{status:404}:failed?{status:500}:{body:social};
    if(path.startsWith('/api/users/77/profile/'))return denied||missingImages?{status:404}:{body:image,type:'image/png'};
    if(path==='/api/tracking-links/active')return {body:pageOf([{id:1,requesterId:42,receiverId:77,requesterUsername:'owner',receiverUsername:'partner',status:'ACCEPTED'}])};
    if(path.startsWith('/api/tracking-links'))return {body:pageOf([])};
    if(path==='/api/study-rooms')return {body:[room]};
    if(path.endsWith('/media'))return {body:{enabled:false,epoch:'x',canPublish:false,permissions:[]}};
    if(path.endsWith('/collaboration'))return {body:{messages:[],presence:[],totalPages:0}};
    if(path.endsWith('/selection'))return {body:{goalId:null,sessions:[]}};
    if(path.startsWith('/api/study-rooms/'))return {body:room};
    if(path.includes('/goals'))return {body:pageOf([])};
    return {body:path.includes('unread')?0:{}};
  }});
  try{
    await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__socialTimers=[];const original=setInterval;window.setInterval=(fn,delay,...args)=>{if(delay===30000)window.__socialTimers.push(fn);return original(fn,delay,...args)};`});
    await page.navigate('/tracking-links');await page.wait('!!Array.from(document.querySelectorAll("a[aria-label^=View]")).find(a=>a.pathname==="/users/77/profile")');
    await page.evaluate('Array.from(document.querySelectorAll("a[aria-label^=View]")).find(a=>a.pathname==="/users/77/profile").click()');
    await page.wait('document.querySelector("[data-social-profile] h2")?.textContent==="Partner 李"');
    await page.wait('document.querySelectorAll("[data-social-profile] img").length===2');
    assert.ok(await page.evaluate('!document.querySelector("button[aria-label^=Edit]") && !document.querySelector("button[title^=Change]") && !document.querySelector("[data-social-profile] button[aria-label^=Change]")'));
    assert.ok(await page.evaluate('document.querySelector("time[datetime]") && !document.querySelector("[data-social-profile] [role=img][aria-label=Online]") && !document.querySelector("[aria-label^=Shared]")'));
    assert.ok(await page.evaluate('document.querySelector("[data-social-profile]").textContent.includes("<b>Plain text</b>") && !document.querySelector("[data-social-profile] b")'));
    assert.equal(pulses,0);
    social={...social,statistics:{verifiedMinutes:12.5},presence:{status:'ONLINE',lastSeenAt:null,serverNow:'2026-11-07T12:00:00Z'}};
    const oldBanner=await page.evaluate(`document.querySelector('[data-social-profile] img').src`);
    await page.click('Refresh profile');await page.wait('!!document.querySelector("[data-social-profile] [data-presence-status=ONLINE]")');
    // Profile text can commit before protected images finish. The poll guard stays
    // pending until that load completes, so wait for the refreshed asset first.
    await page.wait(`document.querySelector('[data-social-profile] img')?.src!==${JSON.stringify(oldBanner)}&&document.querySelector('[data-social-profile] img')?.naturalWidth>0`);
    assert.ok(await page.evaluate('document.querySelector("[data-presence-status=ONLINE]").classList.contains("text-success") && !document.querySelector("[data-social-profile] [role=img]")'));
    assert.ok(await page.evaluate('document.querySelector("[aria-label^=Shared]").textContent.includes(new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(12.5)) && !document.querySelector("[aria-label^=Shared]").textContent.includes("Verified sessions")'));
    social={...social,presence:{status:'OFFLINE',lastSeenAt:'2026-11-07T10:00:00Z',serverNow:'2026-11-07T12:00:00Z'}};
    await page.evaluate('window.__socialTimers.forEach(fn=>fn())');await page.wait('!!document.querySelector("[data-social-profile] [data-presence-status=OFFLINE]")');
    assert.ok(await page.evaluate('document.querySelector("[data-presence-status=OFFLINE]").classList.contains("text-content-muted") && !document.querySelector("[data-social-profile] [role=img]")'));
    assert.ok(await page.evaluate('document.querySelector("[data-social-profile]").textContent.includes("Last seen "+new Intl.RelativeTimeFormat(undefined,{numeric:"auto"}).format(-2,"hour"))'));
    for(const width of [320,375,768,1024,1440]){
      await page.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
      for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
        await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
        assert.ok(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),`${width}/${mode}/${accent}`);
      }
    }
    denied=true;await page.evaluate('window.__socialTimers.forEach(fn=>fn())');await page.wait('!!document.querySelector("[data-social-profile] [role=alert]")');
    assert.ok(await page.evaluate('!document.querySelector("[data-social-profile] img") && !document.querySelector("[data-social-profile] h2")'));
    denied=false;failed=true;await page.click('Refresh profile');await page.wait('document.querySelector("[data-social-profile] [role=alert]")?.textContent.includes("try again")');
    failed=false;missingImages=true;await page.click('Refresh profile');await page.wait('!!document.querySelector("[data-social-profile] h2")');
    assert.ok(await page.evaluate('!document.querySelector("[data-social-profile] img")'));
    await page.navigate('/tracking-links');await page.wait('!!Array.from(document.querySelectorAll("a[aria-label^=View]")).find(a=>a.pathname==="/users/77/profile")');
    await page.evaluate('Array.from(document.querySelectorAll("a[aria-label^=View]")).find(a=>a.pathname==="/users/77/profile").focus()');await page.key('Enter');await page.wait('location.pathname==="/users/77/profile"');
    await page.navigate('/study-rooms');await page.wait('Array.from(document.querySelectorAll("button")).some(b=>b.textContent.includes("Social room"))');
    await page.evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("Social room")).click()');await page.wait('!!Array.from(document.querySelectorAll("a[aria-label^=View]")).find(a=>a.pathname==="/users/77/profile")');
    await page.evaluate('Array.from(document.querySelectorAll("a[aria-label^=View]")).find(a=>a.pathname==="/users/77/profile").click()');await page.wait('location.pathname==="/users/77/profile"');
    await page.navigate('/users/42/profile');await page.wait('location.pathname==="/profile"');
    await page.navigate('/settings');await page.wait('!!document.querySelector("#social-privacy-heading")');
    await page.evaluate('Array.from(document.querySelectorAll("label")).find(l=>l.textContent==="Share online/offline status").querySelector("input").click()');
    await page.wait('!!document.querySelector("aside [aria-label=Online]")');assert.ok(pulses>0);
    const savedSession=sessionIds[0];await page.evaluate('window.__socialTimers.forEach(fn=>fn())');await page.wait('true');assert.ok(sessionIds.every(id=>id===savedSession));
    await page.evaluate('Array.from(document.querySelectorAll("label")).find(l=>l.textContent==="Share online/offline status").querySelector("input").click()');await page.wait('!document.querySelector("aside [aria-label=Online]")');
    await page.navigate('/users/nope/profile');assert.ok(await page.evaluate('document.querySelector("[role=alert]").textContent.includes("Invalid")'));
    assert.deepEqual(page.errors,[]);
  }finally{await page.close();}
});
