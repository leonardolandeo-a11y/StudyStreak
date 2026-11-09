import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
let owner=101,empty=false,fail=false,revoked=false,partial=true,expired=false;
const reads=[],images=[],beats=[];
const makePage=(content,total=content.length,pages=1)=>({content,empty:!content.length,totalElements:total,totalPages:pages,last:true,number:0,size:10});
const names={2:'Online partner',3:'Offline partner',4:'Hidden partner',5:'Unknown partner',6:'Denied partner',7:'Hidden with activity',12:'Second page partner'};
const profile=id=>({id,username:`partner-${id}`,presentationName:names[id]||`Partner ${id}`,bio:`Biography ${id}`,registrationDate:null,statistics:{},presence:id===5?null:{status:id===2?'ONLINE':[4,7].includes(id)?'HIDDEN':'OFFLINE',lastSeenAt:id===3||id===7?'2026-11-08T11:00:00Z':null,serverNow:'2026-11-08T12:00:00Z'}});
const tokens=()=>({token:`fixture.${Buffer.from(JSON.stringify({type:'access',userId:owner,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.signature`,refreshToken:'fixture-only'});
const browser=await mobileBrowser({intercept:async request=>{
  const url=new URL(request.url),path=url.pathname;reads.push(path);
  if(path==='/refresh'&&expired)return {status:401};
  if(path==='/login')return {body:tokens()};if(path==='/logout')return {status:204};
  if(path==='/api/profile')return {body:{id:owner,username:'fixture',presentationName:'Fixture Student',bio:null}};
  if(path==='/api/profile/avatar')return {status:404};
  if(path==='/api/profile/privacy')return {body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
  if(path==='/api/presence/heartbeat'){beats.push(path);return {body:{status:'HIDDEN'}};}
  if(path==='/api/tracking-links/active'||path==='/api/tracking-links'){
    if(expired)return {status:401};if(fail)return {status:503};if(empty)return {body:makePage([],0,0)};
    const ids=Number(url.searchParams.get('page'))===1?[12,13]:[2,3,4,5,6,7,8,9,10,11].filter(id=>!revoked||id!==2);
    return {body:makePage(ids.map(id=>({id,requesterId:owner,receiverId:id,requesterUsername:'fixture',receiverUsername:`partner-${id}`,status:'ACCEPTED'})),12,2)};
  }
  if(path==='/api/tracking-links/pending')return {body:makePage([],0,0)};
  const match=path.match(/^\/api\/users\/(\d+)\/(profile|presence)(?:\/(avatar|banner))?$/);
  if(match){const id=Number(match[1]);if(match[3]){images.push(path);return {status:404};}if(id===6||id===2&&revoked)return {status:404};if(id===5&&partial)return {status:503};return {body:match[2]==='profile'?profile(id):profile(id).presence};}
  if(path.includes('notifications'))return {body:makePage([],0,0)};
  if(path===`/users/${owner}/goals`)return {body:makePage([],0,0)};
  return {status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const panelText=value=>`document.querySelector('[aria-modal="true"]')?.innerText.includes(${JSON.stringify(value)})`;
async function ready(){await browser.wait(`document.querySelector('[aria-label="Refresh Study Partners"]')?.getAttribute('aria-disabled')!=='true'`);}
async function refresh(){await ready();await browser.click('Refresh Study Partners');await ready();}
async function open(){await browser.click('Study Partners');await browser.wait(has('Close Study Partners'));await browser.wait(`!!document.querySelector('[aria-label="Close Study Partners"]')?.closest('[role="dialog"]')`);await browser.wait(`!(${panelText('Loading study partners…')})`);await ready();}
try{
  await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Study Partners'));
  assert.equal(await browser.evaluate(has('Close Study Partners')),false);assert.equal(reads.includes('/api/tracking-links/active'),false);
  await open();for(const label of ['Online · 1','Offline','Other partners','Status hidden','Status unavailable','Last seen','Some partner details'])assert.equal(await browser.evaluate(panelText(label)),true);
  assert.equal(await browser.evaluate(panelText('Denied partner')),false);assert.equal(beats.length,0);
  const count=images.length;await browser.key('Escape');await browser.wait(`!document.querySelector('[aria-label="Close Study Partners"]')`);await open();assert.equal(images.length,count,'Reopening revalidates profiles and reuses native avatar cache.');
  await browser.click('Next');await browser.wait(has('Open partner profile Second page partner'));await browser.click('Open partner profile Second page partner');await browser.wait(`location.pathname.includes('/users/12/profile')`);await browser.wait(`document.body.innerText.includes('Biography 12')`);await browser.wait(`!document.querySelector('[aria-label="Close Study Partners"]')`);
  await browser.evaluate('history.back()');await browser.wait(has('Study Partners'));await open();await browser.click('Manage Tracking');await browser.wait(`location.pathname.includes('tracking')`);await browser.wait(`!document.querySelector('[aria-label="Close Study Partners"]')`);
  await open();await browser.click('Close Study Partners');await browser.wait(`!document.querySelector('[aria-label="Close Study Partners"]')`);
  fail=true;await open();assert.equal(await browser.evaluate(panelText('Could not load study partners')),true);fail=false;partial=false;await browser.click('Retry Study Partners');await browser.wait(has('Open partner profile Online partner'));
  revoked=true;await refresh();await browser.wait(`!document.querySelector('[aria-label="Open partner profile Online partner"]')`);
  empty=true;await refresh();await browser.wait(panelText('No accepted study partners'));await browser.click('Close Study Partners');empty=false;
  await browser.click('Open menu');await browser.click('Settings');await browser.wait(has('Light'));await browser.click('Light');await browser.click('Purple');await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);await browser.evaluate('history.back()');await browser.wait(has('Study Partners'));await open();
  for(const width of [320,390,768]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await browser.wait(`Array.from(document.querySelector('[aria-modal="true"]').querySelectorAll('[role="button"]')).every(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;})`);}
  await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/partners-panel.png',Buffer.from(shot.data,'base64'));
  expired=true;await ready();await browser.click('Refresh Study Partners');await browser.wait(has('Username'));await browser.wait(`!document.querySelector('[aria-label="Close Study Partners"]')`);
  owner=102;expired=false;empty=true;await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Study Partners'));await open();assert.equal(await browser.evaluate(panelText('No accepted study partners')),true);assert.equal(beats.length,0);assert.deepEqual(browser.errors,[]);
  process.stdout.write('Partners browser passed: open/X/Escape, explicit groups, partial/error/retry/empty, pagination/profile Back/Tracking, cache, revocation, account isolation, reduced motion, themes and 320–768px.\n');
}catch(error){writeFileSync('.expo/partners-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),images,reads,errors:browser.errors}));throw error;}
finally{await browser.close();}
