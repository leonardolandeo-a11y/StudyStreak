import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,writeFileSync} from 'node:fs';
import {chrome,profileBrowser} from './helpers/profileBrowser.mjs';

test('academic glyphs share one original source with native, without external graphics',()=>{
 const web=readFileSync(new URL('../src/components/academic/glyphs.ts',import.meta.url),'utf8');
 assert.equal(web,readFileSync(new URL('../../frontend-mobile/src/components/academic/glyphs.ts',import.meta.url),'utf8'));
 const source=JSON.parse(readFileSync(new URL('../../assets/academic/glyphs.json',import.meta.url),'utf8'));
 assert.equal(source.grid,24);for(const glyph of ['book','lamp','chart','spark'])assert.ok(source[glyph].length>4);
 assert.doesNotMatch(web,/https?:|data:image/);
});
const claims={type:'access',userId:42,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800};
const token=`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
test('Chrome: scoped academic Dashboard/Focus, themes, pixel progress and responsive circular timer',{timeout:90000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const mutations=[];
 const page=await profileBrowser({intercept:async request=>{
  const url=new URL(request.url),path=url.pathname;
  if(request.method!=='GET'){mutations.push(path);return {status:500};}
  if(path==='/api/profile')return {body:{id:42,username:'Scholar',presentationName:'Scholar'}};
  if(path.includes('/notifications'))return {body:{content:[],totalElements:0,totalPages:0}};
  if(path==='/api/study/active')return {body:null};
  if(path==='/api/focus-sessions/stats'){
   const days=Number(url.searchParams.get('days'))||7;
   const daily=Array.from({length:days},(_,i)=>({date:new Date(Date.UTC(2026,10,days-i)).toISOString().slice(0,10),minutes:i===0?25:0,sessions:i===0?1:0})).reverse();
   return {body:{days,timeZone:'America/Lima',verifiedPeriod:{minutes:25,sessions:1,daily},daily,studyStreak:2,periodMinutes:99999,totalMinutes:99999,verifiedMinutes:25,estimatedMinutes:0,groupMinutes:0,individualMinutes:25,groupSessions:0,previousMinutes:0,changePercent:null,completionPercent:null,averageMinutes:25/days,activeDays:1,bestStudyStreak:2,weekMinutes:25,completedSessions:1,periodSessions:1,bestDayMinutes:25,activity:daily,byGoal:[],hourly:[],weekly:[],monthly:[]}};
  }
  if(path==='/users/42/goals')return {body:{content:[{id:1,topic:'Linear algebra',completed:false,frequency:3,duration:25}],last:true,totalPages:1,totalElements:1}};
  if(path==='/api/study/history')return {body:{content:[],last:true,totalPages:0,totalElements:0}};
  return {status:404};
 }});
 try{
  await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
  for(const route of ['/dashboard','/focus-studio']){
   await page.navigate(route);await page.wait('!!document.querySelector(".academic-page")');
   if(route==='/dashboard')await page.wait(`!!document.querySelector('[aria-label="Active study days in this period"]')`);
   for(const width of [320,390,768,1440,1920]){
    await page.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
    for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
     await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
     await page.wait('document.documentElement.scrollWidth<=innerWidth');
     assert.equal(await page.evaluate(`document.querySelector('.academic-page').querySelectorAll('h1').length`),1);
     assert.equal(await page.evaluate(`document.querySelector('.academic-page').getAnimations({subtree:true}).filter(a=>a.playState==='running').length`),0);
     if(route==='/focus-studio')assert.equal(await page.evaluate(`(()=>{const r=document.querySelector('.academic-dial').getBoundingClientRect();return r.width>0&&Math.abs(r.width-r.height)<1;})()`),true);
    }
    const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/73a-${route.slice(1)}-${width}-light.png`,Buffer.from(shot.data,'base64'));
   }
   await page.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:false})`);
   await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
   await new Promise(resolve=>setTimeout(resolve,300));
   const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/73a-${route.slice(1)}-dark.png`,Buffer.from(shot.data,'base64'));
   if(route==='/dashboard'){
    assert.equal(await page.evaluate(`document.body.textContent.includes('99999')`),false);
    assert.equal(await page.evaluate(`document.querySelector('[aria-label="Active study days in this period"]').getAttribute('aria-valuenow')`),'1');
    await page.click('Lines');await page.click('30 days');await page.wait(`document.querySelector('[aria-label="Active study days in this period"]')?.getAttribute('aria-valuemax')==='30'`);
   }else{
    await page.evaluate(`document.querySelector('[aria-label="Pomodoro settings"]').focus()`);assert.equal(await page.evaluate('document.activeElement.matches(":focus-visible")'),true);
    assert.equal(await page.evaluate(`document.querySelectorAll('[data-slot="carousel-item"]').length`),12);
   }
  }
  assert.deepEqual(mutations,[]);assert.deepEqual(page.errors,[]);
 }catch(error){process.stderr.write(JSON.stringify({errors:page.errors,text:await page.evaluate('document.body.innerText'),path:await page.evaluate('location.pathname')})+'\n');throw error;}finally{await page.close();}
});
