import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const before=process.env.F4_BEFORE==='1',part='notifications';
const output=new URL('../../docs/images/final-ui-f4/',import.meta.url);mkdirSync(output,{recursive:true});
let owner=101;
const notes=[{id:10,type:'WEEKLY_SUMMARY',message:'Existing weekly summary',read:false,createdAt:'2026-11-14T09:00:00'},{id:9,type:'GOAL_COMPLETED',message:'Existing goal update',relatedGoalId:7,read:true,createdAt:'2026-11-13T09:00:00'}];
const requests=[];
const press=async name=>{await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>!b.disabled&&(b.getAttribute('aria-label')===${JSON.stringify(name)}||b.textContent.trim()===${JSON.stringify(name)}))`);await browser.evaluate(`Array.from(document.querySelectorAll('button')).find(b=>!b.disabled&&(b.getAttribute('aria-label')===${JSON.stringify(name)}||b.textContent.trim()===${JSON.stringify(name)})).click()`);};
const page=content=>({content,number:0,size:20,totalElements:content.length,totalPages:1,first:true,last:true,empty:!content.length});
const browser=await profileBrowser({desktopPointer:true,cacheDir:fileURLToPath(new URL('../../.local/f4/vite-cache/',import.meta.url)),intercept:request=>{
 const path=new URL(request.url).pathname;requests.push({path,method:request.method});
 if(path==='/api/profile')return{body:{id:owner,username:'Fixture Student'}};
 if(path.includes('/notifications')){
  if(request.method==='DELETE'){notes.splice(notes.findIndex(n=>path.endsWith('/'+n.id)),1);return{status:204};}
  if(request.method==='PATCH'){const n=notes.find(n=>path.includes('/'+n.id+'/'));if(n)n.read=true;return{body:n};}
  return{body:page(path.endsWith('/unread')?notes.filter(n=>!n.read):notes)};
 }
 return environmentFixture(request);
}});
const capture=async name=>{await browser.evaluate(`Promise.all(Array.from(document.querySelectorAll('.notification-popup')).flatMap(el=>el.getAnimations()).map(a=>a.finished.catch(()=>{})))`);const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL((before?'before-':'after-')+name+'.png',output),Buffer.from(shot.data,'base64'));};
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',sessionStorage.getItem('accessToken')||${JSON.stringify(token)});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 if(before){
  await browser.navigate('/focus-studio');await browser.wait('!!document.querySelector("[data-slot=carousel]")');await browser.evaluate('document.querySelector("[data-slot=carousel]").scrollIntoView({block:"center"})');await capture('focus');
  await browser.navigate('/notifications');await browser.wait(`document.body.textContent.includes('Existing weekly summary')`);await capture('notifications');
 }else{

  if(part==='all'||part==='notifications'){
   await browser.navigate('/notifications');await browser.wait(`document.body.textContent.includes('Existing weekly summary')`);assert.equal(await browser.evaluate('document.querySelectorAll(".notification-popup").length'),0);
   await press('Delete notification');await browser.wait(`!!document.querySelector('[role="dialog"]')`);await press('Cancel');assert.equal(requests.some(r=>r.method==='DELETE'),false);await press('Delete notification');await press('Delete');await browser.wait(`!document.querySelector('[aria-label="Delete notification"]:disabled')`);
   for(let i=11;i<=14;i++)notes.unshift({id:i,type:'WEEKLY_SUMMARY',message:'New notification '+i,read:false,createdAt:'2026-11-14T11:00:00'});
   await browser.evaluate(`window.dispatchEvent(new Event('focus'))`);await browser.wait('document.querySelectorAll(".notification-popup").length===3');await capture('notifications-new');await browser.evaluate(`window.dispatchEvent(new Event('focus'))`);await browser.wait('document.querySelectorAll(".notification-popup").length===3');
   await press('Dismiss notification 12');await browser.wait('document.querySelectorAll(".notification-popup").length===2');await browser.evaluate(`window.dispatchEvent(new Event('focus'))`);await browser.wait('document.querySelectorAll(".notification-popup").length===2');
   await browser.evaluate(`document.querySelector('.notification-popup > button').click()`);await browser.wait(`location.pathname==='/dashboard'`);assert.ok(requests.some(r=>r.method==='PATCH'));await browser.reload();await browser.wait('!!document.querySelector(".cozy-dashboard")');assert.equal(await browser.evaluate('document.querySelectorAll(".notification-popup").length'),0);
   const other='fixture.'+Buffer.from(JSON.stringify({type:'access',userId:202,sub:'Other Student',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';owner=202;await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(other)})`);await browser.reload();await browser.wait('!!document.querySelector(".cozy-dashboard")');assert.equal(await browser.evaluate('document.querySelectorAll(".notification-popup").length'),0);
   await browser.navigate('/notifications');await browser.wait(`document.body.textContent.includes('Existing goal update')`);
   await press('Unread');await browser.wait(`!document.body.textContent.includes('Existing goal update')`);await press('All');await browser.wait(`document.body.textContent.includes('Existing goal update')`);
   for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
    await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   }
   for(const width of [390,768,1440,1920]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture('notifications-'+width);}
  }
  for(let id=15;id<=17;id++)notes.unshift({id,type:'WEEKLY_SUMMARY',message:'New for second account '+id,read:false,createdAt:'2026-11-14T12:00:00'});await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:1100,deviceScaleFactor:1,mobile:true});await browser.evaluate(`window.dispatchEvent(new Event('focus'))`);await browser.wait('document.querySelectorAll(".notification-popup").length===3');assert.equal(await browser.evaluate(`(()=>{const e=document.querySelector('.notification-popups');return e.getBoundingClientRect().height<=160&&e.scrollHeight>e.clientHeight})()`),true);await capture('notifications-mobile-popup');await browser.command('Emulation.setDeviceMetricsOverride',{width:1920,height:1100,deviceScaleFactor:1,mobile:false});await press('Sign out');await browser.wait('!document.querySelector(".notification-popup")');
  assert.deepEqual(browser.errors,[]);console.log('F4 notifications passed: silent baseline, three maximum, deduplication, navigation, confirmations and accounts. API writes mocked.');

 }
}finally{await browser.close();}
