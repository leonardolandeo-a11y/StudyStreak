import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const phase=process.env.STUDYSTREAK_CAPTURE_PHASE||'after';
const page=content=>({content,totalElements:content.length,totalPages:1,empty:!content.length,last:true,number:0,size:10});
const goal={id:7,topic:'Focused study goal',frequency:3,duration:25,completed:false,difficulty:'EASY'};
const claims={type:'access',userId:101,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:4102444800};
const tokens={token:`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`,refreshToken:'fixture-only'};
const writes=[];
const browser=await mobileBrowser({intercept:async request=>{
 const p=new URL(request.url).pathname;
 if(p==='/login')return{body:tokens};
 if(request.method!=='GET'){writes.push(p);return{status:403};}
 if(p==='/api/profile')return{body:{id:101,username:'fixture'}};
 if(p==='/users/101/goals')return{body:page([goal])};if(p==='/users/101/goals/7')return{body:goal};
 if(p.endsWith('/summary'))return{body:{goalId:7,totalMinutes:25,completedSessions:1}};
 if(p.endsWith('/streak'))return{body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-12'}};
 if(p.endsWith('/daily-records'))return{body:page([{id:12,date:'2026-11-12',note:'Saved record',photoAvailable:false,voiceAvailable:false}])};
 if(p.includes('/notifications'))return{body:page([])};
 if(p==='/api/study/history')return{body:page([{id:'fixture',goal_name:'Saved session',source:'INDIVIDUAL',state:'COMPLETE',confirmed_seconds:1500,planned_seconds:1500,started_at:'2026-11-12T12:00:00Z',verified:true}])};
 if(p==='/api/focus-sessions/stats'){
  const daily=Array.from({length:7},(_,i)=>({date:`2026-11-${String(i+6).padStart(2,'0')}`,minutes:i===6?25:0,sessions:i===6?1:0}));
  return{body:{days:7,timeZone:'America/Lima',daily,activity:daily,verifiedPeriod:{minutes:25,sessions:1,daily},totalMinutes:95,verifiedMinutes:75,estimatedMinutes:20,completedSessions:4,periodMinutes:45,periodSessions:2,weekMinutes:30,studyStreak:2,bestStudyStreak:4,activeDays:2,completionPercent:75,previousMinutes:20,changePercent:125,individualMinutes:25,groupMinutes:20,groupSessions:1,weekly:[{date:'2026-11-09',hours:.75}],monthly:[{date:'2026-11-01',hours:.75}],byGoal:[{goalId:7,topic:'Focused study goal',minutes:45,sessions:2}],hourly:[{hour:12,hours:.75},{hour:13,hours:0}]}};
 }return{status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
async function capture(name,selector){for(const width of [320,390,768,1440]){
 await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');
 await browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'});document.activeElement?.blur()`);
 const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/hotfix-${phase}-${name}-${width}.png`,Buffer.from(shot.data,'base64'));
}}
try{
 await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Open Focused study goal'));await browser.click('Open Focused study goal');await browser.wait(has('Refresh study streak'));await browser.wait(`document.body.innerText.includes('Last calculated')`);await capture('details','[aria-label="Refresh study streak"]');
 await browser.evaluate('history.back()');await browser.wait(has('Open menu'));await browser.click('Open menu');await browser.click('Dashboard');await browser.wait(has('Explore study details'));await browser.click('Explore study details');
 for(const tab of ['Activity','Goals','Together','History']){await browser.click(tab);if(tab==='History')await browser.wait(`document.body.innerText.includes('Saved session')`);await capture(tab,'[aria-label="Hide study details"]');}
 assert.deepEqual(writes,[]);assert.deepEqual(browser.errors,[]);
 process.stdout.write('Native surfaces: all Journey tabs, Goal streak, responsive and read-only fixtures passed.\n');
}finally{await browser.close();}
