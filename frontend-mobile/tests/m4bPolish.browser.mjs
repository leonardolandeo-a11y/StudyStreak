// Expo Web + fixture APIs. This is not a physical Android/Expo Go test.
import assert from 'node:assert/strict';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { roomPolishFixture } from '../../scripts/tests/roomPolishFixture.mjs';
const fixture=roomPolishFixture(),writes=[],reads=[];
let notificationReads=0,unreadReads=0;
const page=(content,total=content.length,index=0,size=10)=>({content,totalElements:total,totalPages:Math.ceil(total/size),number:index,size,empty:!content.length,last:(index+1)*size>=total});
const goals=Array.from({length:21},(_,i)=>({id:501+i,topic:i===0?'A long partner goal about graph theory and discrete mathematics':'Partner Goal '+(i+1),difficulty:['TRIVIAL','EASY','INTERMEDIATE','HARD'][i%4],frequency:3,duration:25,completed:false}));
const browser=await mobileBrowser({intercept:async request=>{
 const url=new URL(request.url),path=url.pathname,index=Number(url.searchParams.get('page')||0);
 reads.push(path);
 if(path==='/users/3/goals')return{body:page(goals.slice(index*10,index*10+10),21,index)};
 if(path==='/users/5/goals')return{status:403};
 if(path==='/api/tracking-links/active')return{body:page([{id:1,requesterId:101,receiverId:3,requesterUsername:'Scholar',receiverUsername:'LunaStudy',status:'ACCEPTED'},{id:2,requesterId:101,receiverId:5,requesterUsername:'Scholar',receiverUsername:'Unavailable count partner',status:'ACCEPTED'}])};
 if(path==='/api/goals/501/daily-records')return{body:page([{id:11+index,date:index===0?'2026-11-14':'2026-11-15',note:'Original note',evidence:'Original evidence',photoAvailable:false,voiceAvailable:false}],2,index,1)};
 if(path==='/api/goals/501/daily-records/11/validation'){
  if(request.method==='GET')return{status:404};
  const body=JSON.parse(request.postData);writes.push({path,body});return{body:{id:900,...body}};
 }
 if(path==='/users/101/notifications'){notificationReads++;return{body:page([])};}
 if(path==='/users/101/notifications/unread'){unreadReads++;return{body:page([])};}
 return fixture.intercept(request);
}});
const visible=label=>`Array.from(document.querySelectorAll('[aria-label=${JSON.stringify(label)}]')).some(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`;
const text=value=>`document.body.textContent.includes(${JSON.stringify(value)})`;
const modalGone=()=>browser.wait(`!document.querySelector('[aria-modal="true"]')`);
async function responsive(){for(const width of [320,390,768]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');}}
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__shares=[];navigator.share=async data=>{window.__shares.push(data.text);};`});
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await browser.navigate('/');await browser.wait(visible('Username'));await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');await browser.wait(visible('Create a goal'));
 assert.equal(await browser.evaluate(visible('Create Goal')),false);
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Create a goal"]').querySelector('[data-testid="pixel-goal-action"]')!==null`),true);
 await responsive();await browser.click('Create a goal');await browser.wait(visible('Topic'));
 await browser.wait(`!!document.activeElement?.closest('[role="dialog"]')`);
 await browser.key('Escape');await modalGone();await browser.wait(visible('Create a goal'));
 await browser.click('Open menu');await browser.click('Settings');await browser.click('Lavender background');await browser.click('Dark');await browser.click('Purple');await browser.evaluate('history.back()');await browser.wait(visible('Create a goal'));
 const accent=await browser.evaluate(`getComputedStyle(document.querySelector('[data-testid="pixel-goal-action"] > div:last-child')).backgroundColor`);
 await browser.click('Validations');await browser.wait(visible('Select tracking partner LunaStudy'));await browser.wait(text('21 Goals'));await browser.wait(text('Goals unavailable'));
 assert.equal(await browser.evaluate(text('Review goals from')),false);
 await responsive();await browser.click('Select tracking partner LunaStudy');await browser.wait(visible('Cancel creation'));await browser.wait(text('21 Goals'));
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Select tracking partner LunaStudy"]').getAttribute('aria-selected')`),'true');
 await browser.click('Continue');await browser.wait(visible('View records for '+goals[0].topic));
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label=${JSON.stringify('View records for '+goals[0].topic)}]').textContent.includes('View records for')`),false);
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label=${JSON.stringify('View records for '+goals[0].topic)}]').querySelector('[aria-label="Intrascendente"]')!==null`),true);
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Next"]').textContent`),'');
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Previous"]').getAttribute('aria-disabled')`),'true');
 await responsive();await browser.click('Next');await browser.wait(visible('View records for Partner Goal 11'));await browser.click('Previous');await browser.wait(visible('View records for '+goals[0].topic));
 await browser.click('View records for '+goals[0].topic);await browser.click('Continue');await browser.wait(visible('Review record 2026-11-14'));
 await browser.click('Next');await browser.wait(visible('Review record 2026-11-15'));await browser.click('Previous');await browser.wait(visible('Review record 2026-11-14'));
 await browser.key('Escape');await browser.wait(text('Study goals · LunaStudy'));assert.equal(await browser.evaluate(`document.querySelector('[aria-label=${JSON.stringify('View records for '+goals[0].topic)}]').getAttribute('aria-selected')`),'true');
 await browser.click('Continue');await browser.wait(visible('Review record 2026-11-14'));await browser.click('Review record 2026-11-14');await browser.click('Continue');await browser.wait(text('Review evidence'));await browser.wait(text('Original evidence'));
 await browser.click('Continue');await browser.wait(visible('Review decision'));await browser.click('Approve');await browser.fill('[aria-label="Comment (optional)"]','Same review operation');
 await browser.click('Previous step');await browser.click('Continue');await browser.wait(visible('Review decision'));assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Comment (optional)"]').value`),'Same review operation');
 await browser.click('Review decision');assert.deepEqual(writes,[]);await browser.click('Create validation');await modalGone();await browser.wait(text('Validation saved.'));
 assert.deepEqual(writes,[{path:'/api/goals/501/daily-records/11/validation',body:{approved:true,comment:'Same review operation'}}]);
 await browser.click('Study Rooms');await browser.wait(visible('Open study room Campus study circle'));await browser.click('Open study room Campus study circle');await browser.wait(visible('Share invitation'));
 assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('[aria-label="Share invitation"]')).backgroundColor`),accent);
 await browser.click('Share invitation');assert.deepEqual(await browser.evaluate('window.__shares'),['Join my StudyStreak room: ABCDEFGHIJ']);
 await responsive();
 await browser.click('Participants (12)');await browser.wait(visible('View profile of LunaStudy'));await browser.click('View profile of LunaStudy');await browser.wait(`location.pathname.includes('/users/3/profile')`);await browser.evaluate('history.back()');await browser.wait(visible('Open menu'));
 await browser.click('Open menu');await browser.click('Notifications');await browser.waitForDrawerClosed();await browser.wait(visible('Refresh notifications'));await browser.wait(text('No notifications in this category.'));
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Refresh notifications"]').textContent`),'');
 const before=[notificationReads,unreadReads];await browser.click('Refresh notifications');
 for(let i=0;i<100&&(notificationReads<=before[0]||unreadReads<=before[1]);i++)await new Promise(resolve=>setTimeout(resolve,30));
 assert.ok(notificationReads>before[0]);assert.ok(unreadReads>before[1]);await responsive();
 assert.deepEqual(browser.errors,[]);assert.ok(reads.includes('/users/3/goals'));
 console.log('M4b passed: pixel +/creation, real partner totals and unavailable state, compact difficulty rows/pagination, five-step validation/IDs/draft, Back simulation, share accent/action, profile navigation, refresh list+badge and 320/390/768.');
}finally{await browser.close();}
