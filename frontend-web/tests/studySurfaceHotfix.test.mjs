import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFileSync } from 'node:fs';
import { profileBrowser } from './helpers/profileBrowser.mjs';
const phase=process.env.STUDYSTREAK_CAPTURE_PHASE||'after';
const page=content=>({content,number:0,size:10,totalElements:content.length,totalPages:1,first:true,last:true,empty:!content.length});
test('Chrome: Goal Details and all Journey tabs share surfaces; zero/few/many charts remain usable',{timeout:120000},async()=>{
 let scenario='few';const writes=[];
 const browser=await profileBrowser({intercept:async request=>{
 const p=new URL(request.url).pathname;
 if(request.method!=='GET'){writes.push(p);return{status:403};}
 if(p==='/api/profile')return{body:{id:42,username:'Scholar'}};
 if(p==='/api/study/active')return{body:null};
 const goal={id:7,topic:'Focused study goal',frequency:3,duration:25,completed:false,difficulty:'EASY'};
 if(p==='/users/42/goals')return{body:page([goal])};if(p==='/users/42/goals/7')return{body:goal};
 if(p.endsWith('/summary'))return{body:{goalId:7,totalMinutes:25,completedSessions:1}};
 if(p.endsWith('/streak'))return{body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-12'}};
 if(p.endsWith('/daily-records'))return{body:page([{id:12,date:'2026-11-12',note:'Study record'}])};
 if(p.includes('/notifications'))return{body:p.includes('unread')?0:page([])};
 if(p==='/api/study/history')return{body:page([{id:'fixture',goal_name:'Saved session',source:'INDIVIDUAL',state:'COMPLETE',confirmed_seconds:1500,planned_seconds:1500,started_at:'2026-11-12T12:00:00Z',verified:true}])};
 if(p==='/api/focus-sessions/stats'){
  const daily=Array.from({length:7},(_,i)=>({date:`2026-11-${String(i+6).padStart(2,'0')}`,minutes:scenario==='zero'?0:i===6?25:0,sessions:scenario==='zero'?0:i===6?1:0}));
  return{body:{days:7,timeZone:'America/Lima',daily,activity:daily,verifiedPeriod:{minutes:25,sessions:1,daily},totalMinutes:95,verifiedMinutes:75,estimatedMinutes:20,completedSessions:4,periodMinutes:45,periodSessions:2,weekMinutes:30,studyStreak:2,bestStudyStreak:4,activeDays:2,completionPercent:75,previousMinutes:20,changePercent:125,individualMinutes:25,groupMinutes:20,groupSessions:1,
  weekly:[{date:'2026-11-09',hours:.75}],monthly:[{date:'2026-11-01',hours:.75}],byGoal:[{goalId:7,topic:'Focused study goal',minutes:45,sessions:2}],hourly:Array.from({length:scenario==='many'?24:2},(_,i)=>({hour:i,hours:scenario==='zero'?0:scenario==='many'?(i+1)/60:i===0?.75:0}))}};
 }return{status:404};
 }});
 async function capture(name,element){for(const width of [320,390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
  await browser.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:true});${element?`document.querySelector(${JSON.stringify(element)}).scrollIntoView({block:'start'})`:'window.scrollTo(0,0)'}`);
  const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/hotfix-${phase}-${name}-${width}.png`,Buffer.from(shot.data,'base64'));
 }}
 try{
 const token='fixture.'+Buffer.from(JSON.stringify({type:'access',userId:42,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
 await browser.navigate('/goals/7');await browser.wait('document.body.textContent.includes("Server-confirmed snapshot")');await capture('details');
 if(phase==='after')assert.equal(await browser.evaluate(`(()=>{const hero=getComputedStyle(document.querySelector('.goal-detail-hero')).backgroundColor;const streak=getComputedStyle(document.querySelector('.streak-card')).backgroundColor;const totals=getComputedStyle(document.querySelector('[aria-label="Recorded for this Goal"]')).backgroundColor;return hero===streak&&totals!==hero&&totals===getComputedStyle(document.querySelector('.streak-card .bg-surface-hover')).backgroundColor})()`),true);
 await browser.navigate('/dashboard');await browser.wait('!!document.querySelector(".journey-details")');await browser.evaluate('document.querySelector(".journey-details").open=true');
 for(const tab of ['Activity','Goals','Together','History']){await browser.click(tab);if(tab==='History')await browser.wait('document.body.textContent.includes("Saved session")');await capture(tab,'.journey-details');if(phase==='after')assert.equal(await browser.evaluate(`(()=>{const cards=[...document.querySelectorAll('.study-analytics .study-panel,.study-analytics .academic-metric')];const colors=cards.map(e=>getComputedStyle(e).backgroundColor);return colors.length>0&&colors.every(c=>c===colors[0])&&colors[0]!==getComputedStyle(document.querySelector('.journey-panel')).backgroundColor})()`),true,tab);}
 for(const value of ['zero','many']){scenario=value;await browser.reload();await browser.wait('!!document.querySelector(".journey-details")');await browser.evaluate('document.querySelector(".journey-details").open=true');await capture(value,'.journey-details');if(phase==='after'){if(value==='zero')assert.equal(await browser.evaluate(`document.querySelectorAll('[data-chart-layout="columns"]').length`),0);else assert.ok(await browser.evaluate(`document.querySelector('[data-chart-layout="columns"]').getBoundingClientRect().height<=144`));}}
 assert.deepEqual(writes,[]);assert.deepEqual(browser.errors,[]);
 }finally{await browser.close()}
});
