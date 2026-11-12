import { reviewNativeModule } from './helpers/academicModuleReview.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const claims={type:'access',userId:101,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600};
const tokens={token:`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`,refreshToken:'fixture-refresh'};
let goal={id:7,topic:'Biology fixture',completed:false,frequency:3,duration:25},records=[],tags=[];
let failTags=false,failSummary=true; const writes=[],reads=[];
const page=content=>({content,empty:!content.length,totalElements:content.length,totalPages:content.length?1:0,last:true,number:0,size:10});
const browser=await mobileBrowser({intercept:async request=>{
 const url=new URL(request.url),p=url.pathname,method=request.method;
 if(p==='/login')return {body:tokens};
 if(method!=='GET') {
  const body=request.postData?JSON.parse(request.postData):null; writes.push({p,method,body});
  if(p==='/users/101/goals/7') {if(method==='DELETE'){goal=null;return {status:204};}goal={...goal,...body};return {body:goal};}
  if(p==='/api/goals/7/daily-records'){records=[{id:11,date:'2026-11-09',...body,photoAvailable:false,voiceAvailable:false}];return {body:records[0]};}
  if(p==='/api/goals/7/daily-records/11'){if(method==='DELETE'){records=[];return {status:204};}records[0]={...records[0],...body};return {body:records[0]};}
  if(p==='/users/101/goals/7/tags'){tags=[{id:2,...body}];return {body:tags[0]};}
  if(p==='/users/101/goals/7/tags/2'){if(method==='DELETE'){tags=[];return {status:204};}tags[0]={id:2,...body};return {body:tags[0]};}
  return {status:404};
 }
 reads.push(p);
 if(p==='/api/profile')return {body:{id:101,username:'fixture',presentationName:'Fixture'}};
 if(p==='/users/101/goals')return {body:page(goal?[goal]:[])};
 if(p==='/users/101/goals/7')return {body:goal};
 if(p==='/api/goals/7/daily-records')return {body:page(records)};
 if(p==='/api/goals/7/daily-records/11')return {body:records[0]};
 if(p==='/users/101/goals/7/tags')return failTags?{status:503,body:{message:'Fixture unavailable'}}:{body:page(tags)};
 if(p==='/api/goals/7/streak')return {body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-09'}};
 if(p==='/api/goals/7/focus-sessions/summary')return failSummary?{status:503}:{body:{goalId:7,totalMinutes:25,completedSessions:1}};
 if(p.includes('notifications'))return {body:page([])};
 return {status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const modalGone=()=>browser.wait(`!document.querySelector('[aria-modal="true"]')`);
async function dialog(){await browser.wait(`!!document.querySelector('[aria-label="Cancel creation"]')&&document.activeElement?.closest('[role="dialog"]')!==null`);}
async function screenshot(name){await reviewNativeModule(browser,'goals-'+name);await browser.evaluate('document.activeElement?.blur()');const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/parity-${name}.png`,Buffer.from(shot.data,'base64'));}
try {
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','fixture-only-password');await browser.click('Sign in');
 await browser.wait(`document.body.innerText.includes('Biology fixture')`);await reviewNativeModule(browser,'goals');
 await browser.evaluate(`Array.from(document.querySelectorAll('[role="button"]')).find(e=>e.innerText.includes('Biology fixture')).click()`);
 await browser.wait(has('View Tags')); await browser.wait(`document.body.innerText.includes('Totals unavailable')`);failSummary=false;await browser.click('Refresh recorded totals');await browser.wait(`document.body.innerText.includes('Server-confirmed snapshot')`);await browser.wait(`document.body.innerText.includes('Current streak')`); await browser.click('Update Goal');await dialog();
 await browser.fill('[aria-label="Topic"]','Biology updated');await browser.click('Save changes');await modalGone();await browser.wait(`document.body.innerText.includes('Biology updated')`);
 await browser.click('Add a daily record');await dialog();assert.equal(await browser.evaluate(`!!document.querySelector('[aria-modal="true"] [aria-label="Date"]')`),false);
 await browser.fill('[aria-label="Notes"]','First fixture note');await browser.fill('[aria-label="Evidence"]','Text evidence');await browser.click('Create record');await modalGone();await browser.wait(has('Edit record'));
 assert.equal(writes.find(w=>w.p==='/api/goals/7/daily-records').body.date,undefined);
 await browser.click('Edit record');await dialog();await browser.fill('[aria-label="Notes"]','Edited note');await browser.click('Save record');await modalGone();await browser.wait(`document.body.innerText.includes('Edited note')`);
 assert.equal(reads.some(p=>p.endsWith('/photo')||p.endsWith('/voice')),false,'Collapsed cards do not download evidence');
 await browser.click('Manage evidence');await browser.wait(has('Take evidence photo'));assert.ok(await browser.evaluate(has('Record study voice note')));await browser.click('Hide evidence');
 await browser.click('View Tags');await browser.wait(has('Add tag'));await browser.click('Add tag');await browser.wait(has('Tag name'));await browser.fill('[aria-label="Tag name"]',' Biology ');await browser.click('Save tag');await modalGone();await browser.wait(has('Edit tag Biology'));
 await browser.click('Edit tag Biology');await browser.wait(has('Tag name'));assert.ok(await browser.evaluate(`document.body.innerText.includes('may affect other goals')`));await browser.fill('[aria-label="Tag name"]','Science');await browser.click('Save tag');await modalGone();await browser.wait(has('Remove tag Science'));
 await screenshot('tags');await browser.click('Remove tag Science');await browser.wait(has('Confirm remove tag'));await browser.click('Keep tag');await modalGone();assert.equal(tags.length,1);
 await browser.click('Remove tag Science');await browser.wait(has('Confirm remove tag'));await browser.click('Confirm remove tag');await modalGone();await browser.wait(`document.body.innerText.includes('No tags for this goal')`);
 await browser.click('View Tags');failTags=true;await browser.click('View Tags');await browser.wait(has('Retry tags'));failTags=false;await browser.click('Retry tags');await browser.wait(`document.body.innerText.includes('No tags for this goal')`);
 await browser.wait(has('Edit record'));
 for(const width of [320,390,768,1440]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await screenshot('goal');
 await browser.click('Delete record');await dialog();assert.equal(records.length,1);await browser.click('Confirm delete record');await modalGone();await browser.wait(`document.body.innerText.includes('No daily records')`);
 await browser.click('Delete goal');await dialog();assert.ok(goal);await browser.click('Keep');await modalGone();assert.ok(goal);await browser.click('Delete goal');await dialog();await browser.click('Delete permanently');await modalGone();await browser.wait(has('Create a goal'));assert.equal(goal,null);
 assert.deepEqual(browser.errors,[]);process.stdout.write('Goals parity browser passed: goal edit/delete, daily-record CRUD, evidence disclosure, tag CRUD/retry, confirmations, native Back and 320–1440 layout.\n');
} catch(error){writeFileSync('.expo/parity-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),errors:browser.errors,writes}));throw error;}finally{await browser.close();}
