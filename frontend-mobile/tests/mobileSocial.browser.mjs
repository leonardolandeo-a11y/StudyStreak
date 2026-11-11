import { reviewNativeModule, reviewNativeSettings } from './helpers/academicModuleReview.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
let owner=101,accepted=true,denyProfile=0,denyPrivacy=false,denyPresence=false;
let privacy={showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false};
let member={id:3,username:'partner',presentationName:'Partner Student',bio:'Shared algebra biography',registrationDate:'2026-01-04',statistics:{verifiedMinutes:12.5,verifiedSessions:2},presence:{status:'ONLINE',lastSeenAt:null,serverNow:'2026-11-08T12:00:00Z'}};
const page=content=>({content,empty:!content.length,totalElements:content.length,totalPages:content.length?1:0,last:true,number:0,size:10});
const link=()=>({id:1,requesterId:owner,receiverId:3,requesterUsername:'fixture-student',receiverUsername:'partner',status:'ACCEPTED'});
const room=()=>({id:'fixture-room',name:'Fixture room',inviteCode:'ABCDEFGHIJ',ownerId:owner,host:true,phase:'FOCUS',timerStatus:'PAUSED',remainingSeconds:1500,endsAt:null,serverNow:new Date().toISOString(),version:1,
  members:[{userId:owner,username:'fixture-student',host:true,online:true,studying:false},{userId:3,username:'partner',host:false,online:true,studying:true},{userId:4,username:'unapproved',host:false,online:true,studying:false}]});
const images=[],beats=[],privacyWrites=[],trackingReads=[],trackingWrites=[];
const tokens=()=>({token:`fixture.${Buffer.from(JSON.stringify({type:'access',userId:owner,sub:owner===101?'fixture-student':'next-student',email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.signature`,refreshToken:'fixture-only'});
const browser=await mobileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/tracking-links')){if(request.method==='GET')trackingReads.push(path);else trackingWrites.push(request.method);}
  if(path==='/login')return {body:tokens()};
  if(path==='/logout')return {status:204};
  if(path==='/api/profile/privacy'){
    if(request.method==='GET')return {body:privacy};
    const value=JSON.parse(request.postData);privacyWrites.push(value);
    if(denyPrivacy)return {status:403};privacy=value;return {body:privacy};
  }
  if(path==='/api/presence/heartbeat'){beats.push(JSON.parse(request.postData));return {body:{...member.presence,status:privacy.showPresence?'ONLINE':'HIDDEN'}};}
  if(path==='/api/profile')return {body:{id:owner,username:owner===101?'fixture-student':'next-student',presentationName:owner===101?'Fixture Student':'Next Student',displayName:null,bio:null}};
  if(path==='/api/profile/avatar'||path==='/api/profile/banner')return {status:404};
  if(path.match(/^\/api\/users\/\d+\/profile\/(avatar|banner)$/)){images.push(path);return {status:404};}
  if(path==='/api/users/3/profile')return accepted&&!denyProfile?{body:member}:{status:denyProfile||404};
  if(path==='/api/users/3/presence')return accepted?denyPresence?{status:500}:{body:member.presence}:{status:404};
  if(path.startsWith('/api/users/'))return {status:404};
  if(path==='/api/tracking-links/active'||path==='/api/tracking-links')return {body:page(accepted?[link()]:[])};
  if(path==='/api/tracking-links/pending')return {body:page([])};
  if(path==='/api/tracking-links/1'&&request.method==='DELETE'){accepted=false;return {status:204};}
  if(path==='/users/search')return {body:page([{id:3,username:'partner'},{id:4,username:'unapproved'}])};
  if(path===`/users/${owner}/goals`||path==='/users/3/goals')return {body:page([])};
  if(path.includes('notifications'))return {body:page([])};
  if(path==='/api/study-rooms')return {body:[room()]};
  if(path==='/api/study-rooms/fixture-room'||path.endsWith('/fixture-room/heartbeat'))return {body:room()};
  return {status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const text=value=>`document.body.innerText.includes(${JSON.stringify(value)})`;
const checked=label=>`(() => {const e=document.querySelector('[aria-label="${label}"]');return e?.checked ?? e?.getAttribute('aria-checked')==='true';})()`;
async function toggle(label){await browser.evaluate(`document.querySelector('[aria-label="${label}"]').click()`);}
async function backToMenu(){await browser.evaluate('history.back()');await browser.wait(has('Open menu'));}
async function openMember(){await browser.click('View profile of partner');await browser.wait(text('Shared algebra biography'));}
try{
  await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture-student');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Open menu'));
  assert.equal(beats.length,0);await browser.click('Tracking');await browser.wait(has('View profile of partner'));
  await browser.wait(`!document.body.innerText.includes('Loading')`);
  const readCount=trackingReads.length;
  for(const group of ['Active partners','Pending invitations','All tracking links']){
    await browser.click(group);assert.equal(await browser.evaluate(`document.querySelector('[aria-label="${group}"]').getAttribute('aria-expanded')`),'false');
    await browser.click(group);assert.equal(await browser.evaluate(`document.querySelector('[aria-label="${group}"]').getAttribute('aria-expanded')`),'true');
  }
  assert.equal(trackingReads.length,readCount);
  assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('[role="button"]')).some(b=>b.textContent.trim()==='View profile')`),false);
  await browser.click('Remove connection');await browser.wait(text('Remove this tracking link?'));
  const confirmation=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/74a-tracking-confirm.png',Buffer.from(confirmation.data,'base64'));
  await browser.click('Keep');assert.equal(trackingWrites.length,0);
  await reviewNativeModule(browser,'tracking');await openMember();await reviewNativeModule(browser,'member');
  assert.equal(await browser.evaluate(text('Online')),true);assert.equal(await browser.evaluate(text('Verified focus time')),true);assert.equal(await browser.evaluate(has('Edit Profile')),false);
  member={...member,statistics:{verifiedMinutes:12.5},presence:{...member.presence,status:'OFFLINE',lastSeenAt:'2026-11-08T11:00:00Z'}};
  await browser.click('Refresh member profile');await browser.wait(text('Offline'));assert.equal(await browser.evaluate(text('Last seen')),true);assert.equal(await browser.evaluate(text('Verified sessions')),false);
  member={...member,statistics:{},presence:{...member.presence,status:'HIDDEN',lastSeenAt:null}};await browser.click('Refresh member profile');await browser.wait(text('Status hidden'));assert.equal(await browser.evaluate(text('Last seen')),false);assert.equal(await browser.evaluate(text('Verified focus time')),false);
  denyPresence=true;await browser.click('Refresh member profile');await browser.wait(text('Status unavailable'));denyPresence=false;
  denyProfile=403;await browser.click('Refresh member profile');await browser.wait(text('Profile unavailable'));assert.equal(await browser.evaluate(text('Shared algebra biography')),false);denyProfile=0;
  await browser.click('Refresh member profile');await browser.wait(text('Shared algebra biography'));await backToMenu();
  await browser.click('Send a tracking request');await browser.wait(has('Search study partners'));await browser.fill('[aria-label="Search study partners"]','partner');await browser.wait(has('Select tracking partner unapproved'));
  assert.equal(images.some(path=>path.includes('/4/')),false);await browser.click('Cancel creation');
  await browser.click('Validations');await browser.wait(has('View profile of partner'));await browser.wait(text('Review study records from your connected partners.'));await reviewNativeModule(browser,'validations');await openMember();await backToMenu();await browser.wait(has('Review goals from partner'));
  await browser.click('Start a validation');await browser.wait(has('Cancel creation'));await openMember();await browser.wait(`!document.querySelector('[aria-label="Cancel creation"]')`);await backToMenu();await browser.wait(has('Cancel creation'));await browser.click('Review goals from partner');await browser.wait(text('Study goals · partner'));await browser.click('Back');await browser.wait(has('Review goals from partner'));await browser.click('Cancel creation');
  await browser.click('Study Rooms');await browser.wait(has('Open study room Fixture room'));await browser.click('Open study room Fixture room');await browser.wait(has('View profile of partner'));assert.equal(await browser.evaluate(has('View profile of unapproved')),false);
  await openMember();await backToMenu();await browser.wait(text('Participants'));assert.equal(images.some(path=>path.includes('/4/')),false);
  await browser.click('All rooms');await browser.click('Open menu');await browser.click('Settings');await browser.wait(has('Show online status'));await browser.wait(`document.querySelector('[aria-label="Show online status"]').getAttribute('aria-disabled')!=='true'`);
  assert.equal(await browser.evaluate(checked('Show online status')),false);denyPrivacy=true;await toggle('Show online status');await browser.wait(text('permission'));assert.equal(await browser.evaluate(checked('Show online status')),false);assert.equal(beats.length,0);
  denyPrivacy=false;await toggle('Show online status');await browser.wait(checked('Show online status'));await browser.wait(text('Social privacy saved.'));assert.ok(beats.length>=1);assert.ok(beats.every(beat=>/^[\da-f-]{36}$/.test(beat.sessionId)));
  assert.equal(privacy.shareVerifiedMinutes,false);assert.equal(privacy.shareVerifiedSessions,false);
  await toggle('Show online status');await browser.wait(`!(${checked('Show online status')})`);
  await reviewNativeSettings(browser);
  await browser.click('Light');await browser.click('Orange');await toggle('Reduce motion');
  await browser.evaluate(`document.querySelector('[aria-label="Show online status"]').scrollIntoView({block:'center'})`);
  let shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/social-settings.png',Buffer.from(shot.data,'base64'));
  await backToMenu();await browser.click('Open study room Fixture room');await browser.wait(text('Participants'));
  await browser.evaluate(`Array.from(document.querySelectorAll('[role=heading]')).find(el=>el.textContent.includes('Participants'))?.scrollIntoView()`);
  await browser.click('All rooms');await browser.click('Tracking');await browser.wait(has('View profile of partner'));await openMember();
  for(const width of [320,390,768,1440]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
  await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/social-member.png',Buffer.from(shot.data,'base64'));
  await backToMenu();await browser.wait(has('Remove connection'));await browser.click('Remove connection');await browser.wait(text('Remove this tracking link?'));await browser.click('Remove');
  await browser.wait(text('You do not have an active partner yet.'));assert.equal(accepted,false);assert.deepEqual(trackingWrites,['DELETE']);
  await browser.evaluate('history.forward()');await browser.wait(has('Refresh member profile'));await browser.click('Refresh member profile');await browser.wait(text('Profile unavailable'));assert.equal(await browser.evaluate(text('Shared algebra biography')),false);
  await backToMenu();await browser.click('Refresh all connections');await browser.wait(`!document.querySelector('[aria-label="View profile of partner"]')`);
  await browser.click('Open menu');await browser.click('Open your profile, Fixture Student');await browser.wait(has('Sign out'));await browser.click('Sign out');await browser.wait(has('Username'));
  owner=102;privacy={showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false};await browser.fill('[aria-label="Username"]','next-student');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Open menu'));await browser.click('Tracking');await browser.wait(text('You do not have an active partner yet.'));
  assert.equal(await browser.evaluate(text('Shared algebra biography')),false);assert.deepEqual(browser.errors,[]);
  process.stdout.write('Social browser passed: Tracking/search/Validations/modal/Rooms navigation, private fallback, ONLINE/OFFLINE/HIDDEN/unknown, consent, 403/404, revocation, privacy save/errors, account isolation, themes and 320–1440px.\n');
}catch(error){writeFileSync('.expo/social-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),images,privacyWrites,beats:beats.length,errors:browser.errors}));throw error;}
finally{await browser.close();}
