import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,writeFileSync} from 'node:fs';
import {chrome,profileBrowser} from './helpers/profileBrowser.mjs';
const image=readFileSync(new URL('../../src/test/resources/profile/image.png',import.meta.url));
const paged=content=>({content,number:0,size:10,totalPages:content.length?1:0,totalElements:content.length,first:true,last:true,empty:!content.length});
const goal={id:7,topic:'Algebra study journal',duration:25,frequency:3,completed:false};
const record={id:11,date:'2026-11-09',note:'Reviewed linear transformations.',photoAvailable:false,voiceAvailable:false};
const link={id:1,requesterId:42,receiverId:77,requesterUsername:'Scholar',receiverUsername:'Study partner',status:'ACCEPTED'};
const privacy={showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false};
const statistics={studyStreak:2,bestStudyStreak:3,verifiedMinutes:25,verifiedSessions:1,activeGoals:1};
const room={id:'academic-room',name:'Quiet study room',inviteCode:'ABCDEFGHIJ',ownerId:42,host:true,phase:'FOCUS',timerStatus:'PAUSED',remainingSeconds:1500,endsAt:null,serverNow:new Date().toISOString(),version:1,members:[{userId:42,username:'Scholar',host:true,online:true,studying:false},{userId:77,username:'Study partner',host:false,online:false,studying:true}]};
const claims={type:'access',userId:42,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800};
const token=`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
test('Chrome: academic modules retain forms, avatars, status labels, local themes and responsive layouts',{timeout:180000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const writes=[];
 const page=await profileBrowser({intercept:async request=>{
  const url=new URL(request.url),p=url.pathname;
  if(request.method!=='GET'){writes.push(p);return {status:403};}
  if(p==='/api/profile')return {body:{id:42,username:'Scholar',presentationName:'Study Scholar',displayName:'Study Scholar',bio:'Learning one session at a time.',statistics}};
  if(p==='/api/profile/privacy')return {body:privacy};
  if(/^\/api\/users\/\d+\/profile$/.test(p))return {body:{id:p.includes('/77/')?77:42,username:'Study partner',presentationName:'Study partner',bio:'Shared study profile.',registrationDate:'2026-01-03',presence:{status:'HIDDEN',lastSeenAt:null,serverNow:new Date().toISOString()},statistics:{verifiedMinutes:25}}};
  if(/\/(avatar|banner)$/.test(p))return {body:image,type:'image/png'};
  if(p.startsWith('/api/tracking-links'))return {body:p.endsWith('/pending')?paged([{...link,id:2,status:'PENDING'}]):paged([link])};
  if(p==='/users/42/goals'||p==='/users/77/goals')return {body:paged([goal])};
  if(p.endsWith('/goals/7'))return {body:goal};
  if(p.endsWith('/tags'))return {body:paged([{id:1,name:'Algebra'}])};
  if(p.endsWith('/streak'))return {body:{id:1,currentStreak:2,bestStreak:3,lastUpdateDate:'2026-11-09'}};
  if(p.includes('/focus-sessions/summary'))return {body:{goalId:7,verifiedSeconds:1500,legacySeconds:0,completedSessions:1}};
  if(p.endsWith('/daily-records/11'))return {body:record};
  if(p.endsWith('/daily-records'))return {body:paged([record])};
  if(p.includes('/validations'))return {body:paged([])};
  if(p.includes('/notifications'))return {body:paged([{id:1,type:'GOAL_COMPLETED',message:'A goal milestone to review.',read:false,createdAt:'2026-11-09T12:00:00Z',relatedGoalId:7}])};
  if(p==='/api/resources/books')return {body:[{id:'algebra',title:'Algebra companion',authors:['Study Author'],thumbnailUrl:null,description:'A study resource.',infoLink:'https://books.google.com/books?id=algebra',categories:['Mathematics']}]};
  if(p==='/api/study-rooms')return {body:[room]};
  if(p.endsWith('/media'))return {body:{enabled:false,epoch:'fixture',permissions:[],canPublish:false}};
  if(p.endsWith('/collaboration'))return {body:{messages:[],presence:[],totalPages:0}};
  if(p.endsWith('/selection'))return {body:{goalId:null,sessions:[]}};
  if(p.startsWith('/api/study-rooms/'))return {body:room};
  return {status:404};
 }});
 try{
  await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
  const routes=[['/goals','goals'],['/goals/7','goal-detail'],['/goals/7/tags','tags'],['/goals/7/daily-records','records'],['/goals/7/daily-records/11','record-detail'],['/tracking-links','tracking'],['/validations','validations'],['/study-rooms','rooms'],['/resources?topic=Algebra','resources'],['/notifications','notifications'],['/profile','profile'],['/users/77/profile','member'],['/settings','settings']];
  for(const [route,name]of routes){
   await page.navigate(route);await page.wait('!!document.querySelector(".academic-module")');
   if(name==='resources')await page.wait(`document.body.textContent.includes('Algebra companion')`);
   if(name==='profile'||name==='member')await page.wait(`!!document.querySelector('[aria-label="Profile identity"]')`);
   if(name==='tracking')await page.wait(`document.body.textContent.includes('Study partner')`);
   for(const width of [320,390,768,1440]){
    await page.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
    for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
     if(name!=='settings')await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
     await page.wait('document.documentElement.scrollWidth<=innerWidth');
     assert.equal(await page.evaluate(`!!document.querySelector('.academic-module [data-pixel-glyph], .academic-module [data-academic-sprite]')`),true,route);
    }
    if(name==='settings'){
     await page.evaluate(`(()=>{const toggle=document.querySelector('[role="switch"]');if(toggle.getAttribute('aria-checked')==='true')toggle.click()})()`);
     await page.wait(`!document.querySelector('input[name="display-mode"][value="dark"]').disabled`);
     await page.evaluate(`document.querySelector('input[name="display-mode"][value="dark"]').click()`);
     await page.wait(`document.querySelector('input[name="display-mode"][value="dark"]').checked`);
     await page.evaluate(`document.querySelector('input[name="display-mode"][value="light"]').click()`);
     await page.wait(`document.querySelector('input[name="display-mode"][value="light"]').checked&&document.documentElement.dataset.theme==='light'`);
     await page.evaluate(`document.querySelector('input[name="accent-palette"][value="orange"]').click()`);
    }
    const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/73b-web-${name}-${width}.png`,Buffer.from(shot.data,'base64'));
   }
   if(name==='settings'){
    await page.evaluate(`document.querySelector('input[name="display-mode"][value="dark"]').click()`);
    await page.wait(`document.documentElement.dataset.theme==='dark'`);
    await page.evaluate(`document.querySelector('input[name="accent-palette"][value="mint"]').click()`);
   }else await page.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:true})`);
   const dark=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/73b-web-${name}-dark.png`,Buffer.from(dark.data,'base64'));
   if(name==='profile'){
    await page.click('Edit profile');await page.wait('document.querySelector("dialog")?.open');
    assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('dialog input[type=file]')).display`),'none');
    const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/73b-web-profile-editor.png',Buffer.from(shot.data,'base64'));await page.key('Escape');
   }
  }
  assert.deepEqual(writes,[]);assert.deepEqual(page.errors,[]);
 }catch(error){writeFileSync('/tmp/73b-web-failure.json',JSON.stringify({text:await page.evaluate('document.body.innerText'),errors:page.errors,path:await page.evaluate('location.pathname')}));throw error;}finally{await page.close();}
});
