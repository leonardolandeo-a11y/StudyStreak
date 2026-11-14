import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const before=process.env.F3_BEFORE==='1';
const output=new URL('../../docs/images/final-ui-f3/',import.meta.url);mkdirSync(output,{recursive:true});
let owner=101,statsCalls=0,empty=false;
const tokenFor=id=>'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:id,sub:'Fixture Student',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
const browser=await profileBrowser({desktopPointer:true,cacheDir:fileURLToPath(new URL('../../.local/f3/vite-cache/',import.meta.url)),intercept:request=>{
 const path=new URL(request.url).pathname;
 if(path==='/api/tracking-links/active')return{body:{content:owner===101?[
  {id:1,requesterId:101,receiverId:3,requesterUsername:'Fixture Student',receiverUsername:'Authorized partner',status:'ACCEPTED'},
  {id:2,requesterId:101,receiverId:4,requesterUsername:'Fixture Student',receiverUsername:'Private pending member',status:'PENDING'},
  {id:3,requesterId:8,receiverId:9,requesterUsername:'Foreign private member',receiverUsername:'Foreign private member',status:'ACCEPTED'}]:[],totalPages:1,last:true}};
 if(path==='/api/users/3/profile/avatar')return{status:403};
 if(path==='/api/profile')return{body:{id:owner,username:'Fixture Student',presentationName:'Fixture Student'}};
 if(path===`/users/${owner}/goals`&&owner!==101)return{body:{content:[],totalPages:0,last:true}};
 const reply=environmentFixture(request);
 if(path==='/api/focus-sessions/stats'){statsCalls++;if(empty)reply.body={...reply.body,activity:[]};}
 return reply;
}});
const capture=async name=>{await browser.evaluate(`if(!document.querySelector('dialog[open]'))document.activeElement?.blur();window.scrollTo(0,0)`);const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL((before?'before-':'after-')+name+'.png',output),Buffer.from(shot.data,'base64'));};
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',sessionStorage.getItem('accessToken')||${JSON.stringify(tokenFor(101))});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await browser.navigate('/dashboard');await browser.wait(`document.body.textContent.includes('All-time recorded')`);
 await capture('dashboard-1440');const beforeGrid=await browser.evaluate(`(()=>{const r=document.querySelector('.custom-widget-grid').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width}})()`);await browser.click('Customize Dashboard');await browser.wait(`!!document.querySelector('[aria-label="Show Active Goals"]')`);await capture('customize-1440');
 if(!before){

  await browser.wait('!!document.querySelector("dialog[open]")');
  assert.equal(await browser.evaluate(`document.documentElement.style.overflow`),'hidden');
  assert.equal(await browser.evaluate(`document.querySelector('dialog').contains(document.activeElement)`),true);
  assert.equal(await browser.evaluate(`document.body.textContent.includes('Your notifications')`),false);
  assert.equal(await browser.evaluate(`document.querySelectorAll('[aria-label="Recorded activity calendar"]').length`),1);
  const modalGrid=await browser.evaluate(`(()=>{const r=document.querySelector('.custom-widget-grid').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width}})()`);for(const key of ['x','y','width'])assert.ok(Math.abs(modalGrid[key]-beforeGrid[key])<2,'Modal must not displace Dashboard content');
  let initialStats=statsCalls;
  const saved=()=>browser.evaluate(`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101'))`);
  const keyboard=async(selector,key,code=key)=>{await browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);await browser.command('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:{ArrowUp:38,ArrowDown:40,Home:36,End:35}[key]});await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key,code});};
  const open=async()=>{await browser.click('Customize Dashboard');await browser.wait('!!document.querySelector("dialog[open]")');};
  const close=async()=>{await browser.key('Escape');await browser.wait('!document.querySelector("dialog[open]")');};
  await keyboard('dialog [aria-label="Reorder Quick Focus"]','Home');await browser.wait(`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101'))?.[0].id==='quick'`);
  assert.equal(await browser.evaluate(`document.activeElement.getAttribute('aria-label')`),'Reorder Quick Focus');
  await close();assert.equal(await browser.evaluate(`document.activeElement.textContent`),'Customize Dashboard');assert.notEqual(await browser.evaluate('document.documentElement.style.overflow'),'hidden');
  await browser.reload();await browser.wait(`document.querySelector('[data-widget]')?.dataset.widget==='quick'`);await browser.wait(`document.body.textContent.includes('All-time recorded')`);initialStats=statsCalls;await open();
  // Real mouse input exercises the browser's native HTML drag events, not synthetic DragEvent dispatch.
  await browser.click('Restore default layout');await browser.wait(`document.querySelector('dialog [data-reorder-item]')?.dataset.reorderItem==='focus-summary'`);
  const drag=async(sourceSelector,targetSelector,after=false)=>{
   const point=async(selector,edge)=>browser.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+Math.min(22,r.width/2),y:r.y+r.height*${edge}}})()`);
   await browser.command('Page.bringToFront');const target=await point(targetSelector,after?.85:.2),source=await point(sourceSelector,.5);await browser.evaluate(`window.__dragEvents=[];if(!window.__dragRecorder){window.__dragRecorder=true;for(const type of ['dragstart','drop'])document.addEventListener(type,()=>window.__dragEvents.push(type),{capture:true})}`);
   await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',...source});await browser.command('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...source});
   for(let i=1;i<=12;i++)await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:source.x+(target.x-source.x)*i/12,y:source.y+(target.y-source.y)*i/12});
   await browser.wait(`!!document.querySelector('[data-drop]')`);await capture('drag-destination');
   await browser.command('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...target});await browser.wait(`!document.querySelector('[data-dragging]')`);assert.deepEqual(await browser.evaluate('window.__dragEvents'),['dragstart','drop']);
  };
  await drag('dialog [aria-label="Reorder Focus Summary"]','dialog [data-reorder-item="activity"]',true);
  await browser.wait(`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101'))?.[2].id==='focus-summary'`);
  const ordered=await saved();
  await browser.evaluate(`document.querySelector('dialog [aria-label="Show Active Goals"]').click()`);await browser.wait(`!document.querySelector('[data-widget="goals"]')`);
  await browser.click('Done customizing');await browser.wait('!document.querySelector("dialog[open]")');
  // Dragging on the Dashboard itself uses an isolated handle; chart controls remain interactive.
  await browser.evaluate(`window.scrollTo(0,0)`);await drag('[data-widget="streak"] .widget-drag-handle','[data-widget="activity"]',true);
  await browser.wait(`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101'))?.[0].id==='activity'`);
  assert.equal(statsCalls,initialStats,'Customizing and exposing the calendar must not refetch statistics');
  const accountA=await saved();assert.notDeepEqual(accountA,ordered);
  await browser.reload();await browser.wait(`document.querySelector('[data-widget]')?.dataset.widget==='activity'`);assert.deepEqual(await saved(),accountA);
  owner=202;await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(tokenFor(202))})`);await browser.reload();await browser.wait(`document.body.textContent.includes('All-time recorded')`);assert.equal(await browser.evaluate(`document.querySelector('[data-widget]')?.dataset.widget`),'focus-summary');
  await open();await keyboard('dialog [aria-label="Reorder Activity Calendar"]','Home');await close();await browser.wait(`document.querySelector('[data-widget]')?.dataset.widget==='calendar'`);
  owner=101;await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(tokenFor(101))})`);await browser.reload();await browser.wait(`document.querySelector('[data-widget]')?.dataset.widget==='activity'`);assert.deepEqual(await saved(),accountA);
  assert.equal(await browser.evaluate(`document.body.textContent.includes('Private pending member')||document.body.textContent.includes('Foreign private member')`),false);
  await open();await browser.click('Restore default layout');await close();await browser.wait(`document.querySelectorAll('[data-widget]').length===9`);
  // The recorded calendar is rendered once even when Journey details are open.
  await browser.evaluate(`document.querySelector('.journey-details').open=true`);assert.equal(await browser.evaluate(`document.querySelectorAll('[aria-label="Recorded activity calendar"]').length`),1);
  await browser.evaluate(`document.querySelector('.journey-details').open=false`);
  await browser.evaluate(`document.querySelector('[aria-label="Recorded days"] button').click()`);assert.ok(await browser.evaluate(`document.querySelector('[aria-label="Recorded activity calendar"]').textContent.includes('sessions')`));
  await browser.click('Lines');await browser.wait(`Array.from(document.querySelectorAll('[aria-label="Chart style"] button')).some(b=>b.textContent==='Lines'&&b.getAttribute('aria-pressed')==='true')`);await browser.click('Bars');await browser.click('30 days');await browser.wait(`document.querySelector('[aria-label="Study period"] [aria-pressed="true"]').textContent==='30 days'`);await browser.wait(`document.querySelector('[aria-labelledby="study-activity-heading"]').getAttribute('aria-busy')==='false'`);
  await browser.evaluate(`document.querySelector('[data-widget="calendar"]').scrollIntoView({block:'center'})`);const calendarShot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('after-calendar.png',output),Buffer.from(calendarShot.data,'base64'));
  for(const width of [390,768,1440,1920]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture('dashboard-'+width);await open();await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture('modal-'+width);await close();
  }
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await browser.evaluate(`window.scrollTo(0,0);window.studyStreakAppearance.apply({background:'lavender',mode:'dark',accent:'mint',reduceMotion:false})`);
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await browser.wait(`document.querySelector('.panorama-art')?.dataset.ambient==='running'`);
  await browser.evaluate(`window.__f3Hidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__f3Hidden});document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='paused'`);
  await browser.evaluate(`window.__f3Hidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='running'`);
  await browser.evaluate(`window.scrollTo(0,document.body.scrollHeight)`);await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='paused'`);await browser.evaluate('window.scrollTo(0,0)');await browser.wait(`document.querySelector('.panorama-art').dataset.ambient==='running'`);
  await open();await capture('modal-lavender-dark');await close();
  for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
   await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  }
  await browser.wait(`document.querySelector('.panorama-art')?.dataset.ambient==='paused'`);
  empty=true;await browser.reload();await browser.wait(`document.body.textContent.includes('No recorded activity dates available.')`);assert.equal(await browser.evaluate(`document.querySelectorAll('[aria-label="Recorded days"] button').length`),0);
  await browser.evaluate(`localStorage.setItem('studystreak-dashboard-v1-101','invalid')`);await browser.reload();await browser.wait(`document.querySelectorAll('[data-widget]').length===9`);
  assert.deepEqual(browser.errors,[]);
  console.log('F3 passed: modal/focus/Escape, native mouse drag in modal and grid, keyboard, account isolation/reload/defaults, one calendar, no extra statistics fetches, empty data, 390–1920px and 80 appearances. Mock API only.');

 }
}catch(error){writeFileSync(new URL('../../.local/f3/failure.json',import.meta.url),JSON.stringify({text:await browser.evaluate('document.body.innerText'),events:await browser.evaluate('window.__dragEvents'),errors:browser.errors}));throw error;}finally{await browser.close();}
