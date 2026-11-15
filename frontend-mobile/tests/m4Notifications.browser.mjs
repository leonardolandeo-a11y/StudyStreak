import assert from 'node:assert/strict';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { environmentFixture } from '../../scripts/tests/studyEnvironmentFixture.mjs';
let actor=101,polls=0,deleted=0,hold=false,release;
const rows=new Map([[101,[{id:1,type:'WEEKLY_SUMMARY',message:'Historical summary',createdAt:new Date(Date.now()-60000).toISOString(),read:false}]],[202,[]]]);
const add=(id,type='TRACKING_ACCEPTED')=>rows.get(101).push({id,type,message:'New notification '+id,createdAt:new Date(Date.now()+id*1000).toISOString(),read:false,relatedGoalId:7});
const browser=await mobileBrowser({intercept:async request=>{
 const path=new URL(request.url).pathname;
 if(path==='/login')return{body:{token:'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:actor,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature',refreshToken:'fixture-only'}};
 if(path==='/logout')return{status:204};
 if(path==='/api/profile')return{body:{id:actor,username:'Scholar',presentationName:'Scholar'}};
 const match=path.match(/^\/users\/(\d+)\/notifications(?:\/(.*))?$/);
 if(match){const account=Number(match[1]),suffix=match[2],list=rows.get(account)||[];
  if(suffix?.endsWith('/read')){const id=Number(suffix.split('/')[0]),row=list.find(n=>n.id===id);if(row)row.read=true;const reply={body:row};if(hold)return new Promise(resolve=>{release=()=>resolve(reply);});return reply;}
  if(request.method==='DELETE'){deleted++;rows.set(account,list.filter(n=>n.id!==Number(suffix)));return{status:204};}
  if(suffix==='unread')polls++;const content=(suffix==='unread'?list.filter(n=>!n.read):list).toSorted((a,b)=>b.id-a.id);
  return{body:{content:content.slice(0,10),totalElements:content.length,totalPages:Math.ceil(content.length/10),number:0,empty:!content.length,last:true}};
 }
 return environmentFixture(request);
}});
const popup=id=>`!!document.querySelector('[data-testid="notification-popup-${id}"]')`;
const login=async()=>{await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);};
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`const interval=window.setInterval;window.setInterval=(fn,ms,...args)=>interval(fn,ms===30000?250:ms,...args);window.__hidden=false;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__hidden?'hidden':'visible'});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.navigate('/');await login();await new Promise(r=>setTimeout(r,600));assert.ok(polls>0);assert.equal(await browser.evaluate(popup(1)),false);
 add(2);await browser.wait(popup(2));await browser.click('Dismiss notification 2');await new Promise(r=>setTimeout(r,600));assert.equal(await browser.evaluate(popup(2)),false);
 [3,4,5,6].forEach(id=>add(id,id===6?'GOAL_COMPLETED':'TRACKING_ACCEPTED'));await browser.wait(popup(6));
 assert.equal(await browser.evaluate(`document.querySelectorAll('[data-testid^="notification-popup-"]').length`),3);assert.equal(await browser.evaluate(popup(3)),false);
 await browser.click('Dismiss notification 4');await new Promise(r=>setTimeout(r,400));assert.equal(await browser.evaluate(popup(4)),false);
 await browser.click('Open notification 6');await browser.wait(`location.pathname.endsWith('/goals/7')`);assert.equal(rows.get(101).find(n=>n.id===6).read,true);
 await browser.evaluate('history.back()');await browser.wait(`Array.from(document.querySelectorAll('[aria-label="Open menu"]')).some(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`);
 await browser.click('Open menu');await browser.click('Notifications');await browser.waitForDrawerClosed();await browser.wait(`!!document.querySelector('[aria-label="Delete notification"]')`);
 await browser.click('Delete notification');await browser.wait(`document.body.textContent.includes('Delete this notification permanently?')`);assert.equal(deleted,0);await browser.click('Cancel');assert.equal(deleted,0);
 await browser.click('Delete notification');await browser.click('Confirm delete');await browser.wait(`!document.body.textContent.includes('Delete this notification permanently?')`);assert.equal(deleted,1);
 await browser.evaluate(`window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'))`);const before=polls;add(7);await new Promise(r=>setTimeout(r,600));assert.equal(polls,before);assert.equal(await browser.evaluate(popup(7)),false);
 await browser.evaluate(`window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(popup(7));
 hold=true;await browser.click('Open notification 7');await new Promise(r=>setTimeout(r,100));
 await browser.click('Open menu');await browser.click('Open your profile, Scholar');await browser.wait(`!!document.querySelector('[aria-label="Sign out"]')`);await browser.click('Sign out');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
 actor=202;await login();hold=false;release?.();await new Promise(r=>setTimeout(r,500));
 assert.equal(await browser.evaluate(`!!document.querySelector('[data-testid="notification-popups"]')`),false);assert.equal(await browser.evaluate(`location.pathname.includes('tracking')`),false,'late open from account A cannot navigate account B');
 assert.deepEqual(browser.errors,[]);console.log('M4 notifications passed: silent history, polling, max three, dismiss/dedupe, contextual read/open, confirmed delete, background and late account isolation.');
}finally{await browser.close();}
