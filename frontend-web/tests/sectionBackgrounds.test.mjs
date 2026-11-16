import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {collaborationFixture,token} from '../../scripts/tests/roomCollaborationFixture.mjs';
const before=process.env.F1_SECTIONS_BEFORE==='1';
const output=new URL('../../.local/captures/final-ui-f1-sections/',import.meta.url);mkdirSync(output,{recursive:true});
const page=content=>({content,number:0,size:10,totalElements:content.length,totalPages:content.length?1:0,empty:!content.length,first:true,last:true});
const combinations=[['amber','dark','orange'],['sage','dark','mint'],['lavender','dark','purple'],['neutral','light','blue']];
function audit(){
 const root=getComputedStyle(document.documentElement),names=['--ss-background','--ss-surface','--ss-surface-raised','--ss-surface-hover','--ss-border','--ss-border-strong'];
 const drift=[];for(const element of document.querySelectorAll('main, main *, .workspace-sidebar, body > dialog, [role=dialog]')){
  if(element.closest('.background-swatch'))continue;
  const s=getComputedStyle(element);for(const name of names)if(s.getPropertyValue(name).trim()!==root.getPropertyValue(name).trim()){
   drift.push({tag:element.tagName,classes:element.getAttribute('class'),name,value:s.getPropertyValue(name),expected:root.getPropertyValue(name)});break;
  }
 }
 const probe=document.createElement('span');document.documentElement.append(probe);
 const rgb=value=>{probe.style.color=value;const c=document.createElement('canvas').getContext('2d');c.fillStyle=getComputedStyle(probe).color;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data];};
 const equal=(a,b)=>JSON.stringify(rgb(a))===JSON.stringify(rgb(b));
 const lum=v=>v.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const x=lum(rgb(a)),y=lum(rgb(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const badCanvas=[...document.querySelectorAll('.min-h-screen,.workspace-sidebar')].filter(el=>rgb(getComputedStyle(el).backgroundColor)[3]>0&&!equal(getComputedStyle(el).backgroundColor,'var(--ss-background)')).map(el=>({classes:el.className,bg:getComputedStyle(el).backgroundColor,expected:root.backgroundColor}));
 const panels=[];
 for(const [selector,paint]of [['.cozy-rooms .study-panel','--ss-surface'],['.cozy-rooms input,.cozy-rooms textarea,.cozy-rooms select','--ss-surface-hover'],['.cozy-dashboard .retro-stat','--ss-surface-raised'],['.goal-detail-hero,.streak-card,[aria-label="Profile identity"]','--ss-surface'],['dialog[open]:not(.book-details-dialog),.workflow-dialog','--ss-surface'],['article[role=dialog],.book-details-dialog','--ss-surface-raised']]){
  for(const el of document.querySelectorAll(selector)){const s=getComputedStyle(el);panels.push({selector,bg:s.backgroundColor,expected:paint,match:equal(s.backgroundColor,`var(${paint})`),contrast:contrast(s.color,s.backgroundColor)});}
 }
 const controls=[...document.querySelectorAll('.cozy-rooms input,.cozy-rooms textarea,.cozy-rooms select,dialog[open] input:not([type=checkbox]):not([type=radio]):not([type=range]),dialog[open] textarea,[role=dialog] input:not([type=checkbox]):not([type=radio]):not([type=range])')].filter(el=>el.getClientRects().length>0).map(el=>{const s=getComputedStyle(el);return{border:contrast(s.borderTopColor,s.backgroundColor),text:contrast(s.color,s.backgroundColor)}});
 const backgroundOf=el=>{const own=rgb(getComputedStyle(el).backgroundColor);if(own[3]===255)return own;const parent=el.parentElement?backgroundOf(el.parentElement):rgb(root.backgroundColor);const a=own[3]/255;return own.slice(0,3).map((v,i)=>v*a+parent[i]*(1-a)).concat(255);};
 const active=[...document.querySelectorAll('main button[aria-pressed=true],main button[aria-selected=true],.room-primary')].filter(el=>el.getClientRects().length&&!el.disabled).map(el=>{const x=lum(rgb(getComputedStyle(el).color)),y=lum(backgroundOf(el));return{text:el.getAttribute('aria-label')||el.textContent,contrast:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}});
 probe.remove();return{drift,badCanvas,panels,controls,active};
}
test('all functional sections and main dialogs inherit background families; Rooms clock/chat keep their layout',{timeout:300000},async()=>{
 const fixture=collaborationFixture();
 const browser=await profileBrowser({desktopPointer:true,intercept:async req=>{
  const p=new URL(req.url).pathname;
  if(p==='/api/profile')return{body:{id:101,username:'Scholar',presentationName:'Scholar',displayName:null,bio:'Learning together',statistics:{studyStreak:2,bestStudyStreak:4,verifiedMinutes:25,verifiedSessions:1,activeGoals:1}}};
  if(p.endsWith('/goals/7'))return{body:{id:7,topic:'Linear algebra',frequency:3,duration:25,completed:false,difficulty:'EASY'}};
  if(p.endsWith('/tags'))return{body:page([])};
  if(p.endsWith('/streak'))return{body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-13'}};
  if(p.endsWith('/focus-sessions/summary'))return{body:{goalId:7,totalMinutes:25,completedSessions:1}};
  if(p.endsWith('/daily-records'))return{body:page([{id:11,date:'2026-11-13',note:'Fixture study record'}])};
  if(p==='/api/profile/privacy')return{body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
  if(p==='/api/resources/books')return{body:[{id:'book',title:'Algebra companion',authors:['Study Author'],description:'Study resource fixture',thumbnailUrl:null,infoLink:'https://books.google.com/books?id=fixture'}]};
  if(p.endsWith('/notifications')||p.endsWith('/notifications/unread'))return{body:p.endsWith('/unread')?0:page([{id:1,type:'GOAL_COMPLETED',message:'A study goal to review',read:true,createdAt:'2026-11-13T12:00:00Z',relatedGoalId:7}])};
  return fixture.intercept(req);
 }});
 const apply=async(background,mode,accent)=>{await browser.evaluate(`window.studyStreakAppearance.save({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true},101);window.dispatchEvent(new StorageEvent('storage',{key:window.studyStreakAppearance.accountKey(101)}))`);await browser.wait(`document.documentElement.dataset.background==='${background}'&&document.documentElement.dataset.theme==='${mode}'&&document.documentElement.dataset.accent==='${accent}'`);};
 const capture=async name=>{const image=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(`${before?'before':'after'}-${name}.png`,output),Buffer.from(image.data,'base64'));};
 const sample=async label=>{const result=await browser.evaluate(`(${audit.toString()})()`);assert.deepEqual(result.drift,[],label+' local token override');assert.deepEqual(result.badCanvas,[],label+' canvas mismatch');for(const panel of result.panels){assert.ok(panel.match,label+' '+JSON.stringify(panel));assert.ok(panel.contrast>=4.5,label+' text '+JSON.stringify(panel));}for(const active of result.active)assert.ok(active.contrast>=4.5,label+' active '+JSON.stringify(active));for(const c of result.controls){assert.ok(c.border>=3,label+' border');assert.ok(c.text>=4.5,label+' input text');}return result;};
 const enterRoom=async()=>{await browser.evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Campus study circle')).click()`);await browser.wait('!!document.querySelector("#room-message")');};
 const routes=[['/study-rooms','rooms'],['/dashboard','dashboard'],['/goals','goals'],['/goals/7','goal-details'],['/tracking-links','tracking'],['/validations','validations'],['/resources?topic=Algebra','resources'],['/notifications','notifications'],['/profile','profile'],['/settings','settings'],['/focus-studio','focus']];
 try{
  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  const reports=[];
  for(const [route,name]of before?routes.slice(0,2):routes){
   await browser.navigate(route);await browser.wait('!!document.querySelector("main h1")');
   if(name==='rooms')await browser.wait('!!document.querySelector("#room-name")');
   if(name==='dashboard')await browser.wait('document.querySelectorAll(".retro-stat").length>=3');
   if(name==='goal-details')await browser.wait('!!document.querySelector(".streak-card")');
   if(name==='resources')await browser.wait(`document.body.textContent.includes('Algebra companion')`);
   if(name==='profile')await browser.wait(`!!document.querySelector('[aria-label="Profile identity"]')`);
   if(before){await apply('amber','dark','orange');await capture(name+'-amber-dark-orange');reports.push({name,...await browser.evaluate(`(${audit.toString()})()`)});if(name==='rooms'){await enterRoom();await capture('room-open-amber-dark-orange');reports.push({name:'room-open',...await browser.evaluate(`(${audit.toString()})()`)});}continue;}
   for(const [background,mode,accent]of combinations){await apply(background,mode,accent);reports.push({name,background,mode,accent,...await sample(name)});
    if(name==='rooms'){
     await browser.fill('#invite-code','ABCDEFGHIJ');await browser.wait(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Join room')?.disabled===false`);await browser.command('Page.bringToFront');const r=await browser.evaluate(`(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Join room').getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()`);await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',...r});await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
     assert.equal(await browser.evaluate(`(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Join room'),p=document.createElement('span');p.style.background='var(--ss-accent-soft)';p.style.color='var(--ss-accent)';b.append(p);const ok=getComputedStyle(b).backgroundColor===getComputedStyle(p).backgroundColor&&getComputedStyle(b).color===getComputedStyle(p).color;p.remove();return ok})()`),true,'Join hover follows selected accent');await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    }
    if(['rooms','dashboard','profile'].includes(name))await capture(`${name}-${background}-${mode}-${accent}`);}
   console.log('Theme audit:',name);
   // All 80 effective combinations in each module; System follows both OS schemes.
   for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
    await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme}]});await apply(background,mode,accent);await sample(`${name}/${background}/${mode}/${scheme}/${accent}`);
   }
   if(name==='rooms'){
    await enterRoom();
    for(const [background,mode,accent]of combinations){await apply(background,mode,accent);await sample('room-open');await capture(`room-open-${background}-${mode}-${accent}`);}
    for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
     await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme}]});await apply(background,mode,accent);await sample(`room-open/${background}/${mode}/${scheme}/${accent}`);
    }
    for(const width of [390,768,1440]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await sample('room responsive');}
    await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
   }
   const openers={'dashboard':()=>browser.click('Customize Dashboard'),'goal-details':()=>browser.click('Update Goal'),'tracking':()=>browser.evaluate(`document.querySelector('[aria-label^="Remove tracking link"]').click()`),'resources':()=>browser.evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Algebra companion')).click()`),'profile':()=>browser.click('Edit profile'),'focus':()=>browser.evaluate(`document.querySelector('[aria-label="Pomodoro settings"]').click()`)};
   if(openers[name]){
    await openers[name]();await browser.wait('!!document.querySelector("dialog[open],[role=dialog]")');
    for(const [background,mode,accent]of combinations){await apply(background,mode,accent);await sample(name+' modal');if(['profile','resources','goal-details'].includes(name))await capture(`${name}-modal-${background}-${mode}-${accent}`);}
    if(name==='dashboard')await browser.click('Done customizing');else await browser.key('Escape');
   }
  }
  writeFileSync(new URL(`../../.local/f1-sections/${before?'before':'after'}-computed.json`,import.meta.url),JSON.stringify(reports,null,2));
  if(!before){assert.deepEqual(fixture.requests.filter(r=>r.method!=='GET'&&!r.path.endsWith('/heartbeat')),[]);assert.deepEqual(browser.errors,[]);}
 }catch(error){writeFileSync(new URL('../../.local/f1-sections/failure.json',import.meta.url),JSON.stringify({path:await browser.evaluate('location.pathname'),text:await browser.evaluate('document.body.innerText'),errors:browser.errors}));throw error;}finally{await browser.close();}
});

// The same local definitions caused repeated cross-section regressions: guard the ownership boundary.
test('component CSS leaves protected family tokens owned by tokens.css',{skip:before},()=>{
 const walk=directory=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(new URL(entry.name+'/',directory)):entry.name.endsWith('.css')?[new URL(entry.name,directory)]:[]);
 for(const file of walk(new URL('../src/components/',import.meta.url)))assert.doesNotMatch(readFileSync(file,'utf8'),/--ss-(?:background|surface(?:-raised|-hover)?|border(?:-strong)?)\s*:/,file.pathname);
});
