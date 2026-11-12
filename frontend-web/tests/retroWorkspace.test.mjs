import assert from 'node:assert/strict';
import {test} from 'node:test';
import {writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
const paged=content=>({content,totalPages:1,totalElements:content.length,first:true,last:true,empty:!content.length,number:0,size:10});
const link={id:1,requesterId:42,receiverId:77,requesterUsername:'Scholar',receiverUsername:'Study partner',status:'ACCEPTED'};
test('Chrome: original retro illustrations, palette isolation and visible Dashboard/Tracking composition', {timeout:90000}, async()=>{
const requests=[], mutations=[];
let links=[link,{...link,id:2,status:'PENDING',requesterId:78,receiverId:42,requesterUsername:'Invited scholar',receiverUsername:'Scholar'},{...link,id:3,status:'PENDING',requesterId:79,receiverId:42,requesterUsername:'Another scholar',receiverUsername:'Scholar'}];
const browser=await profileBrowser({intercept:async request=>{
 const u=new URL(request.url),p=u.pathname,days=Number(u.searchParams.get('days'))||7;
 requests.push(p);
 if(request.method!=='GET'){mutations.push([request.method,p]);const id=Number(p.split('/')[3]);if(request.method==='DELETE')links=links.filter(l=>l.id!==id);if(request.method==='PATCH')links=links.map(l=>l.id===id?{...l,status:JSON.parse(request.postData).status}:l);return{body:{}};}
 if(p==='/api/profile')return{body:{id:42,username:'Scholar',presentationName:'Study Scholar'}};
 if(p==='/api/focus-sessions/stats'){
 const daily=Array.from({length:days},(_,i)=>({date:new Date(Date.UTC(2026,10,30-days+i)).toISOString().slice(0,10),minutes:i===days-1?25:0,sessions:i===days-1?1:0}));
 return{body:{days,daily,verifiedPeriod:{minutes:25,sessions:1,daily},timeZone:'America/Lima',totalMinutes:95,verifiedMinutes:75,estimatedMinutes:20,periodMinutes:45,weekMinutes:45,completedSessions:4,periodSessions:2,studyStreak:2,bestStudyStreak:5,activeDays:1,completionPercent:75,previousMinutes:25,changePercent:80,individualMinutes:25,groupMinutes:20,groupSessions:1,averageMinutes:25/days,bestDayMinutes:25,activity:daily,hourly:[],weekly:[],monthly:[],byGoal:[]}};
 }
 if(p==='/api/users/77/profile')return{body:{id:77,username:'Study partner',presentationName:'Study partner',bio:'A shared academic profile.',presence:{status:'HIDDEN'},statistics:{}}};
 if(p.startsWith('/api/tracking-links'))return{body:paged(p.endsWith('pending')?links.filter(l=>l.status==='PENDING'):p.endsWith('active')?links.filter(l=>l.status==='ACCEPTED'):links)};
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
 const capture=async name=>{const image=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/74-visual-'+name+'.png',Buffer.from(image.data,'base64'))};
 for(const route of ['dashboard','tracking-links']){
  await browser.navigate('/'+route);
  await browser.wait(`document.querySelectorAll('[data-academic-sprite]').length>=${route==='dashboard'?7:2}`);
  if(route==='dashboard')await browser.wait(`!!document.querySelector('[aria-label="Recorded study statistics"]')`);
  if(route==='tracking-links')await browser.wait(`document.querySelectorAll('h2>button[aria-expanded]').length===3`);
  await browser.wait(`Array.from(document.querySelectorAll('img[data-academic-sprite]')).every(i=>i.complete&&i.naturalWidth>0)`);
  assert.equal(await browser.evaluate(`!!document.querySelector('.retro-shell')`),true);
  for(const width of [320,390,768,1440]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
   for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
    await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
    assert.equal(await browser.evaluate(`document.documentElement.dataset.accent`),accent);
    assert.equal(await browser.evaluate(`document.querySelector('.retro-shell').getAnimations({subtree:true}).filter(a=>a.playState==='running').length`),0);
   }
   await browser.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:true})`);
   if(route==='tracking-links')assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('.tracking-group article')).every(a=>a.getBoundingClientRect().right<=a.closest('.tracking-group').getBoundingClientRect().right)`),true);
   await capture(route+'-dark-'+width);
   if(route==='dashboard'&&width===1440){
    assert.equal(await browser.evaluate(`(()=>{const chart=document.querySelector('[aria-labelledby="study-activity-heading"]').getBoundingClientRect(),metrics=document.querySelector('[aria-label="Study statistics"]').getBoundingClientRect();return metrics.left>chart.right&&Math.abs(metrics.top-chart.top)<2})()`),true);
   }
   if(width===390||width===1440){await browser.evaluate(`window.studyStreakAppearance.apply({mode:'light',accent:'purple',reduceMotion:true})`);await capture(route+'-light-'+width);}
  }
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await browser.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:false});document.querySelector('[aria-label="Collapse sidebar"]').click()`);
 await browser.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===84`);
 await capture('sidebar-collapsed');
 await browser.navigate('/focus-studio');
 assert.equal(await browser.evaluate(`!!document.querySelector('.retro-shell')`),false,'The treatment must not leak into Focus or other modules');
 assert.deepEqual(mutations,[]);assert.deepEqual(browser.errors,[]);
}finally{await browser.close()}
});
