import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {test} from 'node:test';
import {writeFileSync} from 'node:fs';
import {chrome, profileBrowser} from './helpers/profileBrowser.mjs';
const paged=content=>({content,totalPages:1,totalElements:content.length,first:true,last:true,empty:!content.length,number:0,size:10});
const link={id:1,requesterId:42,receiverId:77,requesterUsername:'Scholar',receiverUsername:'Study partner',status:'ACCEPTED'};
test('Chrome: shared Dashboard statistics, collapsible sidebar and Tracking interactions', {timeout:90000,skip:!chrome&&'Chrome unavailable'},async()=>{
const requests=[], mutations=[];
let holdTrackingReads=false;const trackingReads=[];
let links=[link,{...link,id:2,status:'PENDING',requesterId:78,receiverId:42,requesterUsername:'Invited scholar',receiverUsername:'Scholar'},{...link,id:3,status:'PENDING',requesterId:79,receiverId:42,requesterUsername:'Another scholar',receiverUsername:'Scholar'}];
const browser=await profileBrowser({intercept:async request=>{
 const u=new URL(request.url),p=u.pathname,days=Number(u.searchParams.get('days'))||7;
 requests.push(p);
 if(request.method!=='GET'){mutations.push([request.method,p]);const id=Number(p.split('/')[3]);if(request.method==='DELETE')links=links.filter(l=>l.id!==id);if(request.method==='PATCH')links=links.map(l=>l.id===id?{...l,status:JSON.parse(request.postData).status}:l);if(p.startsWith('/api/tracking-links/'))holdTrackingReads=true;return{body:{}};}
 if(p==='/api/profile')return{body:{id:42,username:'Scholar',presentationName:'Study Scholar'}};
 if(p==='/api/focus-sessions/stats'){
 const daily=Array.from({length:days},(_,i)=>({date:new Date(Date.UTC(2026,10,30-days+i)).toISOString().slice(0,10),minutes:i===days-1?25:0,sessions:i===days-1?1:0}));
 return{body:{days,daily,verifiedPeriod:{minutes:25,sessions:1,daily},timeZone:'America/Lima',totalMinutes:95,verifiedMinutes:75,estimatedMinutes:20,periodMinutes:45,weekMinutes:45,completedSessions:4,periodSessions:2,studyStreak:2,bestStudyStreak:5,activeDays:1,completionPercent:75,previousMinutes:25,changePercent:80,individualMinutes:25,groupMinutes:20,groupSessions:1,averageMinutes:25/days,bestDayMinutes:25,activity:daily,hourly:[],weekly:[],monthly:[],byGoal:[]}};
 }
 if(p==='/api/users/77/profile')return{body:{id:77,username:'Study partner',presentationName:'Study partner',bio:'A shared academic profile.',presence:{status:'HIDDEN'},statistics:{}}};
 if(p.startsWith('/api/tracking-links')){
  const reply=()=>({body:paged(p.endsWith('pending')?links.filter(l=>l.status==='PENDING'):p.endsWith('active')?links.filter(l=>l.status==='ACCEPTED'):links)});
  return holdTrackingReads?new Promise(resolve=>trackingReads.push(()=>resolve(reply()))):reply();
 }
 if(p==='/users/42/goals')return{body:paged([{id:7,topic:'Linear algebra',completed:false,frequency:3,duration:25}])};
 if(p==='/api/study/active')return{body:null};
 if(p.includes('notifications'))return{body:p.includes('unread')?3:paged([])};
 if(p==='/api/study/history')return{body:paged([])};
 return{status:404};
}});
try{
 const token='fixture.'+Buffer.from(JSON.stringify({type:'access',userId:42,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const shot=async name=>{await browser.evaluate('window.scrollTo(0,0)');const frame=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(join(tmpdir(), '74a-after-'+name+'.png'),Buffer.from(frame.data,'base64'))};
 const enter=async()=>{await browser.command('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})};
 const click=async label=>browser.evaluate(`document.querySelector('[aria-label="${label}"]').click()`);
 const finishTrackingReload=async condition=>{
  // The success toast precedes the reload. Hold the GETs so stale controls cannot satisfy the wait.
  await browser.wait(`document.body.textContent.includes('Loading tracking connections')`);
  assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('button')).some(b=>['Accept','Reject'].includes(b.textContent.trim()))`),false);
  holdTrackingReads=false;trackingReads.splice(0).forEach(finish=>finish());
  await browser.wait(`!document.body.textContent.includes('Loading tracking connections') && (${condition})`);
 };
 await browser.navigate('/dashboard');await browser.wait(`document.body.textContent.includes('All-time recorded')`);
 assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Active study days in this period"]')`),false);
 assert.equal(await browser.evaluate(`document.querySelectorAll('[aria-label="Study period"]').length`),1);
 assert.equal(requests.filter(p=>p==='/api/focus-sessions/stats').length,1);await shot('dashboard');
 await browser.click('Lines');await browser.click('30 days');await browser.wait(`!!document.querySelector('[aria-label="Recorded study statistics"]') && document.body.textContent.includes('Across all 30 days')`);
 assert.equal(requests.filter(p=>p==='/api/focus-sessions/stats').length,2);
 await browser.evaluate(`document.querySelector('[aria-label="Detailed study statistics"]').open=true`);
 await browser.click('History');await browser.wait(`document.body.textContent.includes('No attempts on this page')`);
 await click('Collapse sidebar');await browser.wait(`document.querySelector('[aria-label="Workspace sidebar"]').getBoundingClientRect().width===84`);
 await browser.evaluate(`document.querySelector('[data-nav-icon="Tracking"]').focus()`);
 await browser.wait(`document.querySelector('[role="tooltip"]')?.textContent.includes('Manage invitations')`);
 assert.equal(await browser.evaluate(`document.querySelector('[data-nav-icon="Tracking"]').getAttribute('aria-describedby')===document.querySelector('[role="tooltip"]').id`),true);
 await shot('sidebar-collapsed');await browser.key('Escape');await browser.wait(`!document.querySelector('[role="tooltip"]')`);
 await click('Expand sidebar');await browser.wait(`document.querySelector('[aria-label="Workspace sidebar"]').getBoundingClientRect().width===264`);
 await browser.evaluate(`document.querySelector('[data-nav-icon="Focus Studio"]').click()`);
 await browser.wait(`!!document.querySelector('[aria-label="Pomodoro session timer"]')`);
 assert.equal(await browser.evaluate(`document.body.textContent.includes('Explore your study statistics')||document.body.textContent.includes('All-time recorded')`),false);
 assert.equal(requests.filter(p=>p==='/api/focus-sessions/stats').length,2);
 assert.equal(await browser.evaluate(`document.querySelectorAll('aside a[aria-current="page"]').length`),1);await shot('focus-studio');
 await browser.evaluate(`document.querySelector('[data-nav-icon="Tracking"]').click()`);
 await browser.wait(`document.querySelectorAll('h2>button[aria-expanded]').length===3`);
 const headings=['Active Tracking Links','Pending Invitations','All Tracking Links'];
 const toggle=async title=>browser.evaluate(`Array.from(document.querySelectorAll('h2>button')).find(b=>b.textContent.includes(${JSON.stringify(title)})).click()`);
 await browser.command('Page.bringToFront');
 await browser.evaluate(`document.querySelector('h2>button').focus()`);
 await browser.wait(`document.activeElement===document.querySelector('h2>button')`);await enter();
 await browser.wait(`document.querySelector('h2>button').getAttribute('aria-expanded')==='false'`);
 await enter();await browser.wait(`document.querySelector('h2>button').getAttribute('aria-expanded')==='true'`);
 const snapshots=requests.filter(p=>p.startsWith('/api/tracking-links')).length;
 for(const title of headings){await toggle(title);assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('h2>button')).find(b=>b.textContent.includes(${JSON.stringify(title)})).getAttribute('aria-expanded')`),'false');await toggle(title);}
 assert.equal(requests.filter(p=>p.startsWith('/api/tracking-links')).length,snapshots);
 assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('a')).filter(a=>a.textContent.trim()==='View profile').length`),0);
 assert.equal(await browser.evaluate(`document.body.textContent.includes('You received this tracking request')`),false);
 await browser.wait(`!document.body.textContent.includes('Loading tracking connections') && !!document.querySelector('[aria-label="View profile of Study partner"]')`);
 await click('View profile of Study partner');await browser.wait(`document.body.textContent.includes('A shared academic profile.')`);
 await browser.evaluate(`history.back()`);await browser.wait(`!!document.querySelector('h2>button[aria-expanded]')`);
 await click('Remove tracking link with Study partner');await browser.wait(`!!document.querySelector('[role="dialog"],dialog[open]')`);
 assert.equal(mutations.length,0);await shot('tracking-confirm');await browser.click('Cancel');assert.equal(mutations.length,0);
 await click('Remove tracking link with Study partner');await browser.click('Remove');await browser.wait(`document.body.textContent.includes('Tracking link removed successfully')`);
 assert.deepEqual(mutations,[['DELETE','/api/tracking-links/1']]);
 await finishTrackingReload(`!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Accept' && !b.disabled)`);
 await browser.click('Accept');await browser.wait(`document.body.textContent.includes('Tracking request accepted.')`);
 await finishTrackingReload(`!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Reject' && !b.disabled)`);
 await browser.click('Reject');await browser.wait(`document.body.textContent.includes('Tracking request rejected.')`);
 await finishTrackingReload(`document.body.textContent.includes('No pending invitations.')`);
 assert.deepEqual(mutations.slice(1),[['PATCH','/api/tracking-links/2/status'],['PATCH','/api/tracking-links/3/status']]);
 for(const width of [320,390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
  await shot('tracking-'+width);
 }
 assert.deepEqual(browser.errors,[]);
}finally{holdTrackingReads=false;trackingReads.splice(0).forEach(finish=>finish());await browser.close()}
});
