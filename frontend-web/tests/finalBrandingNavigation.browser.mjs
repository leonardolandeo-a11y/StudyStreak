import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const before=process.env.F5_BEFORE==='1';
const output=new URL(process.env.F5_CAPTURES || '../../docs/images/final-ui-f5/',import.meta.url);mkdirSync(output,{recursive:true});
const page=content=>({content,totalPages:1,totalElements:content.length,first:true,last:true,empty:!content.length});
const goal={id:7,topic:'Fixture study goal',frequency:3,duration:25,completed:false,difficulty:'EASY'};
const browser=await profileBrowser({desktopPointer:true,cacheDir:fileURLToPath(new URL('../../.local/f5/vite-cache/',import.meta.url)),intercept:request=>{
 const path=new URL(request.url).pathname;
 if(path==='/users/101/goals/7')return{body:goal};
 if(path.endsWith('/streak'))return{body:{currentStreak:1,bestStreak:2}};
 if(path.endsWith('/summary'))return{body:{goalId:7,totalMinutes:25,completedSessions:1}};
 if(path==='/api/tracking-links/active')return{body:page([{id:1,requesterId:101,receiverId:77,requesterUsername:'Scholar',receiverUsername:'Study partner',status:'ACCEPTED'}])};
 if(path==='/users/77/goals')return{body:page([{...goal,id:8,topic:'Partner goal'}])};
 return environmentFixture(request);
}});
const capture=async name=>{const r=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL((before?'before-':'after-')+name+'.png',output),Buffer.from(r.data,'base64'));};
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('f5SignedOut'))sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__F5Date=Date;window.__F5Now=new Date(2026,10,14,8).getTime();window.Date=class extends Date{constructor(...args){if(args.length)super(...args);else super(window.__F5Now)}static now(){return window.__F5Now}};window.__F5Hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__F5Hidden});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await browser.navigate('/goals');await browser.wait(`document.body.textContent.includes('Linear algebra')`);await capture('sidebar-navigation');
 await browser.navigate('/validations');await browser.wait(`document.body.textContent.includes('Study partner')`);await capture('validations');
 await browser.evaluate(`sessionStorage.setItem('f5SignedOut','yes');sessionStorage.removeItem('accessToken')`);await browser.navigate('/login');await browser.wait('!!document.querySelector("#username")');await browser.evaluate('document.querySelector(".auth-scene-base").decode()');await capture('login');
 if(!before){

  const title='.auth-content .study-brand-name';await browser.evaluate(`document.querySelector('${title}').focus()`);await browser.wait(`getComputedStyle(document.querySelector('.auth-content .study-brand-tagline')).opacity==='1'`);assert.equal(await browser.evaluate(`document.activeElement.getAttribute('aria-describedby')===document.querySelector('.auth-content [role="tooltip"]').id`),true);
  await browser.key('Escape');await browser.wait(`getComputedStyle(document.querySelector('.auth-content .study-brand-tagline')).opacity==='0'`);
  for(const path of ['/login','/register']){
   await browser.navigate(path);await browser.wait('!!document.querySelector("#username")');
   for(const [hour,period] of [[8,'morning'],[15,'afternoon'],[22,'night']]){
    await browser.evaluate(`window.__F5Now=new window.__F5Date(2026,10,14,${hour}).getTime();window.dispatchEvent(new Event('focus'))`);await browser.wait(`document.querySelector('.auth-scene').dataset.studyPeriod==='${period}'`);await browser.evaluate(`document.querySelector('.auth-scene-base').decode()`);assert.equal(await browser.evaluate(`!!document.querySelector('[data-static-exterior]')`),true);await capture(path.slice(1)+'-'+period);
   }
  }
  await browser.evaluate(`window.studyStreakAppearance.apply({background:'lavender',mode:'dark',accent:'mint',reduceMotion:false})`);await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await browser.wait(`document.querySelector('.auth-scene').dataset.ambient==='running'`);
  await browser.evaluate(`window.__F5Hidden=true;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.auth-scene').dataset.ambient==='paused'`);assert.equal(await browser.evaluate(`document.querySelector('.auth-scene').getAnimations({subtree:true}).some(a=>a.playState==='running')`),false);
  await browser.evaluate(`window.__F5Hidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.querySelector('.auth-scene').dataset.ambient==='running'`);
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await browser.wait(`!document.querySelector('.auth-scene').getAnimations({subtree:true}).some(a=>a.playState==='running')`);
  for(const width of [390,768,1440,1920]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture('auth-'+width);}
  // Protected deep links remain protected while signed out.
  await browser.navigate('/goals/7');await browser.wait(`location.pathname==='/login'`);
  await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(token)});sessionStorage.removeItem('f5SignedOut')`);await browser.navigate('/goals');await browser.wait(`document.body.textContent.includes('Linear algebra')`);
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  const brand='.workspace-sidebar .study-brand-name';await browser.evaluate(`window.studyStreakAppearance.apply({background:'sage',mode:'dark',accent:'mint',reduceMotion:false});document.querySelector('${brand}').focus()`);await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await browser.wait(`getComputedStyle(document.querySelector('.workspace-sidebar .study-brand-tagline')).opacity==='1'`);assert.equal(await browser.evaluate(`document.querySelector('.workspace-sidebar .study-brand-tagline').getAttribute('role')`),null);await capture('sidebar-title-focus');
  assert.equal(await browser.evaluate(`document.querySelector('.sidebar-brand [data-study-mark]').getAnimations().some(a=>a.animationName==='brand-cup-nod')`),true);
  await browser.evaluate(`Promise.all(document.querySelector('.sidebar-brand [data-study-mark]').getAnimations().map(a=>a.finished.catch(()=>{})))`);
  const r=await browser.evaluate(`(()=>{const cup=document.querySelector('.sidebar-brand [data-study-mark]').getBoundingClientRect(),title=document.querySelector('${brand}').getBoundingClientRect(),band=document.querySelector('.sidebar-brand').getBoundingClientRect();return{cup:{x:cup.x,y:cup.y,width:cup.width,bottom:cup.bottom},title:{x:title.x,y:title.y,width:title.width},band:band.height}})()`);assert.equal(r.cup.width,44);assert.ok(r.title.y>=r.cup.bottom);assert.ok(Math.abs(r.cup.x+r.cup.width/2-r.title.x-r.title.width/2)<1);assert.ok(r.band>=100&&r.band<=108,'Expanded brand reserves one tagline row without excessive height');
  await browser.key('Escape');await browser.wait(`getComputedStyle(document.querySelector('.workspace-sidebar .study-brand-tagline')).opacity==='0'`);
  await browser.evaluate(`document.querySelector('[aria-label="Collapse sidebar"]').click()`);await browser.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===84`);await capture('sidebar-collapsed');await browser.evaluate(`document.querySelector('[aria-label="Expand sidebar"]').click()`);await browser.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===264`);
  for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
  for(const path of ['/goals','/validations','/tracking-links','/settings','/notifications','/resources','/study-rooms']){
   await browser.navigate(path);await browser.wait(`!!document.querySelector('main h1')`);assert.equal(await browser.evaluate(`!!document.querySelector('header [aria-label="Breadcrumbs"] a[href="/dashboard"]')`),false);assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('header button')).some(b=>b.textContent.trim()==='Back')`),false);
  }
  await browser.navigate('/validations');await browser.wait(`document.body.textContent.includes('Study partner')`);assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Select tracking partner"] a[href^="/users/"]')`),false);await browser.click('View goals');await browser.wait(`document.body.textContent.includes('Partner goal')`);await capture('validations-no-profile');
  await browser.navigate('/goals/7');await browser.wait(`!!document.querySelector('.goal-detail-hero')`);await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Back')`);await browser.click('Back');await browser.wait(`location.pathname==='/goals'`);
  // Client navigation uses history, while a direct detail link has a parent fallback.
  await browser.evaluate(`document.querySelector('[data-nav-icon="Notifications"]').click()`);await browser.wait(`location.pathname==='/notifications'`);await browser.evaluate(`document.querySelector('[data-nav-icon="Goals"]').click()`);await browser.wait(`location.pathname==='/goals'`);await browser.wait(`!!document.querySelector('.goal-compact-main')`);await browser.evaluate(`document.querySelector('.goal-compact-main').click()`);await browser.wait(`location.pathname.includes('/goals/')`);await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Back')`);await browser.click('Back');await browser.wait(`location.pathname==='/goals'`);
  for(const width of [390,768,1440,1920]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture('workspace-'+width);}
  await browser.click('Sign out');await browser.wait(`location.pathname==='/login'`);assert.deepEqual(browser.errors,[]);console.log('F5 passed: identity tooltip/focus, skyline, collapse, 80 appearances, six auth scenes, background/reduced motion, root/detail/history/protected navigation, validation selection and logout. API fixtures only.');

 }
}catch(error){writeFileSync(new URL('../../.local/f5/failure.json',import.meta.url),JSON.stringify({text:await browser.evaluate('document.body.innerText'),errors:browser.errors}));throw error;}finally{await browser.close();}
