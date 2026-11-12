import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFileSync } from 'node:fs';
import { profileBrowser } from './helpers/profileBrowser.mjs';
const levels=['TRIVIAL','EASY','INTERMEDIATE','HARD'];
const labels=['Intrascendente','Fácil','Intermedio','Difícil'];
const paged=content=>({content,number:0,size:10,totalElements:content.length,totalPages:1,first:true,last:true,empty:!content.length});
test('Chrome: persisted difficulty forms, compact identities and complementary recorded calendar', {timeout:120000}, async()=>{
 let goals=[...levels,null].map((difficulty,i)=>({id:7+i,topic:i===4?'Historical goal':labels[i]+' study goal',frequency:3,duration:25,completed:false,difficulty}));
 let legacy=false;
 const requests=[],writes=[];
 const browser=await profileBrowser({intercept:async request=>{
  const u=new URL(request.url),p=u.pathname; requests.push(p);
  if(request.method!=='GET'){
   const body=JSON.parse(request.postData||'{}'); writes.push({p,body});
   if(p==='/users/42/goals'){const goal={...body,id:100+goals.length,...(legacy?{difficulty:undefined}:{})};goals.push(goal);return {status:201,body:goal};}
   if(/^\/users\/42\/goals\/\d+$/.test(p)){const goal=goals.find(g=>g.id===Number(p.split('/').at(-1)));Object.assign(goal,body);return{body:goal};}
   return{status:403};
  }
  if(p==='/api/profile')return{body:{id:42,username:'Scholar'}};
  if(p==='/api/study/active')return{body:null};
  if(p==='/users/42/goals')return{body:paged(goals)};
  if(/^\/users\/42\/goals\/\d+$/.test(p))return{body:goals.find(g=>g.id===Number(p.split('/').at(-1)))};
  if(p.endsWith('/streak'))return{body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-12'}};
  if(p.endsWith('/summary'))return{body:{goalId:Number(p.split('/')[3]),totalMinutes:25,completedSessions:1}};
  if(p.endsWith('/daily-records'))return{body:paged([{id:12,date:'2026-11-12',note:'Real record fixture'}])};
  if(p==='/api/focus-sessions/stats'){
   const days=Number(u.searchParams.get('days'))||7;
   const activity=Array.from({length:365},(_,i)=>({date:new Date(Date.UTC(2025,10,13+i)).toISOString().slice(0,10),minutes:i===358?15:i===364?30:0,sessions:i===358||i===364?1:0}));
   const daily=activity.slice(-days);const verified=daily.map((d,i)=>({...d,minutes:i===0?0:d.minutes}));
   return{body:{days,timeZone:'America/Lima',daily,activity,verifiedPeriod:{minutes:30,sessions:1,daily:verified},
    totalMinutes:95,verifiedMinutes:75,estimatedMinutes:20,completedSessions:4,periodMinutes:45,periodSessions:2,weekMinutes:30,activeDays:2,
    studyStreak:1,bestStudyStreak:3,completionPercent:75,previousMinutes:20,changePercent:125,individualMinutes:25,groupMinutes:20,groupSessions:1,
    hourly:[{hour:13,hours:.75}],weekly:[{date:daily[0].date,hours:.75}],monthly:[{date:daily[0].date,hours:.75}],byGoal:[]}};
  }
  if(p.includes('/notifications'))return{body:p.includes('unread')?0:paged([])};
  if(p==='/api/study/history')return{body:paged([])};
  return{status:404};
 }});
 const review=async name=>{
  for(const width of [320,390,768,1440]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
   for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
    await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   }
   await browser.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:true});document.querySelectorAll('[aria-label="Dismiss notification"]').forEach(b=>b.click())`);
   if(name==='journey')await browser.evaluate(`document.querySelector('[aria-label="Detailed study statistics"]').scrollIntoView({block:'start'})`);
   else await browser.evaluate('window.scrollTo(0,0)');
   const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/741-web-'+name+'-'+width+'.png',Buffer.from(shot.data,'base64'));
  }
 };
 try{
  const token='fixture.'+Buffer.from(JSON.stringify({type:'access',userId:42,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
  await browser.navigate('/goals');await browser.wait('document.querySelectorAll(".goal-compact-card").length===5');
  assert.equal(await browser.evaluate(`document.body.innerText.includes('Focus on this Goal')`),false);
  assert.equal(await browser.evaluate(`!!document.querySelector('[data-difficulty=NONE]')`),true);
  await review('goals');
  for(const [index,level]of levels.entries()){
   await browser.click('Create Goal');await browser.wait('!!document.querySelector("dialog[open]")');
   await browser.fill('#topic','Created '+labels[index]);await browser.evaluate(`document.querySelector('input[value=${level}]').click()`);
   await browser.evaluate('document.querySelector("dialog button[type=submit]").click()');await browser.wait('!document.querySelector("dialog")');
   assert.equal(writes.at(-1).body.difficulty,level);
  }
  legacy=true;const before=writes.length;await browser.click('Create Goal');await browser.wait('!!document.querySelector("dialog[open]")');await browser.fill('#topic','Unconfirmed legacy goal');await browser.evaluate(`document.querySelector('input[value=EASY]').click()`);await browser.evaluate('document.querySelector("dialog button[type=submit]").click()');
  await browser.wait(`!!document.querySelector('dialog [role="alert"]')`);assert.equal(writes.length,before+1);assert.equal(await browser.evaluate('document.querySelector("dialog button[type=submit]").disabled'),true);assert.equal(await browser.evaluate('document.querySelector("#topic").value'),'Unconfirmed legacy goal');
  await browser.click('Cancel');legacy=false;
  await browser.reload();await browser.wait(`document.body.textContent.includes('Created Difícil')`);
  await browser.evaluate(`document.querySelector('a[aria-label="Open Fácil study goal"]').click()`);await browser.wait('!!document.querySelector(".goal-detail-hero")');
  await browser.click('Update Goal');await browser.wait(`document.querySelector('input[value=EASY]').checked`);await browser.evaluate(`document.querySelector('input[value=HARD]').click()`);
  await browser.evaluate('document.querySelector("dialog button[type=submit]").click()');await browser.wait('!document.querySelector("dialog")');await browser.reload();await browser.wait(`!!document.querySelector('.goal-difficulty-badge[data-difficulty=HARD]')`);
  await review('details');
  await browser.navigate('/goals');await browser.wait('!!document.querySelector(".goal-compact-focus")');
  await browser.evaluate('document.querySelector(".goal-compact-focus").click()');await browser.wait('location.pathname.includes("focus-studio")');
  assert.equal(await browser.evaluate('location.search.includes("goalId=7")'),true);
  await browser.navigate('/dashboard');await browser.wait(`!!document.querySelector('[aria-label="Recorded study statistics"]')`);
  await review('dashboard');
  const count=requests.filter(p=>p==='/api/focus-sessions/stats').length;
  await browser.evaluate(`document.querySelector('[aria-label="Detailed study statistics"]').open=true`);await browser.wait(`!!document.querySelector('[aria-label="Recorded activity calendar"]')`);
  assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Daily study time"]')`),false);
  await browser.evaluate(`Array.from(document.querySelectorAll('details')).find(d=>d.querySelector('summary')?.textContent.includes('Recorded trends')).open=true`);
  await browser.wait(`!!document.querySelector('[aria-label="Weekly study time"]')`);await browser.click('Monthly');await browser.wait(`!!document.querySelector('[aria-label="Monthly study time"]')`);
  await browser.evaluate(`Array.from(document.querySelectorAll('details')).find(d=>d.querySelector('summary')?.textContent.includes('Recorded trends')).open=false`);
  await browser.evaluate(`document.querySelector('[aria-label="Previous activity month"]').click()`);await browser.wait(`document.querySelector('[aria-label="Activity month"]').value==='2026-10'`);
  await browser.evaluate(`document.querySelector('[aria-label="Next activity month"]').click()`);await browser.wait(`document.querySelector('[aria-label="Activity month"]').value==='2026-11'`);
  await browser.evaluate(`document.querySelector('[aria-label="2026-11-12: 30 minutes, 1 sessions"]').click()`);
  await review('journey');
  assert.equal(requests.filter(p=>p==='/api/focus-sessions/stats').length,count,'Expanding or browsing months does not duplicate statistics requests');
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Recorded activity calendar"]').scrollWidth<=document.querySelector('[aria-label="Recorded activity calendar"]').clientWidth`),true);
  assert.deepEqual(browser.errors,[]);
 }finally{await browser.close()}
});
