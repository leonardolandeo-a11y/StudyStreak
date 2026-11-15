// Expo web simulation; every external request uses fixtures.
import assert from 'node:assert/strict';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { readFileSync } from 'node:fs';
let account=101;
const empty={content:[],empty:true,totalElements:0,totalPages:0,number:0,size:10,last:true};
const browser=await mobileBrowser({intercept:async request=>{
 const path=new URL(request.url).pathname;
 if(path==='/login')return {body:{token:`fixture.${Buffer.from(JSON.stringify({type:'access',userId:account,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')}.signature`,refreshToken:'fixture'}};
 if(path==='/logout')return {status:204};
 if(path==='/api/profile')return {body:{id:account,username:'fixture',presentationName:'Fixture Student'}};
 if(path.includes('/avatar')||path.includes('/banner'))return {status:404};
 if(path==='/api/study-rooms')return {body:[]};
 if(path==='/api/notifications/count')return {body:0};
 if(path==='/api/focus-sessions/stats')return {status:503};
 return {body:empty};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const selected=(name,attr='aria-selected')=>`document.querySelector('[aria-label="${name}"]').getAttribute('${attr}')==='true'`;
const login=async()=>{await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','Fixture-pass-1');await browser.click('Sign in');await browser.wait(has('Create a goal'));};
const settings=async()=>{await browser.click('Open menu');await browser.click('Settings');await browser.wait(has('Neutral background'));};
const logout=async()=>{await browser.evaluate('history.back()');await browser.wait(has('Open menu'));await browser.click('Open menu');await browser.wait(has('Sign out'));await browser.click('Sign out');await browser.wait(has('Username'));};
const css=readFileSync(new URL('../../frontend-web/src/styles/tokens.css',import.meta.url),'utf8');
const rgb=hex=>`rgb(${hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')})`;
try{
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.navigate('/');await browser.wait(has('Username'));
 await browser.evaluate(`localStorage.setItem('studystreak:appearance:v1',JSON.stringify({mode:'dark',accent:'blue',reduceMotion:false}))`);
 await login();await settings();await browser.wait(selected('Lavender background','aria-checked'));
 assert.equal(await browser.evaluate(selected('Dark')),true);assert.equal(await browser.evaluate(selected('Blue')),true);
 let combinations=0;
 for(const background of ['neutral','lavender','sage','amber','sky']){
  await browser.click(background[0].toUpperCase()+background.slice(1)+' background');
  const block=css.match(new RegExp(':root\\[data-background="'+background+'"\\][^{]+\\{([^}]+)'))[1];
  const surfaces=block.match(/--ss-surface: light-dark\((#[a-f0-9]+), (#[a-f0-9]+)\)/);
  for(const [mode,system]of [['Light','dark'],['Dark','light'],['System','light'],['System','dark']]){
   await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:system},{name:'prefers-reduced-motion',value:'reduce'}]});await browser.click(mode);
   const expected=rgb(surfaces[(mode==='Light'||mode==='System'&&system==='light')?1:2]);
   for(const accent of ['Mint','Blue','Purple','Orange']){
    await browser.click(accent);combinations++;
    await browser.wait(`Array.from(document.querySelectorAll('[data-testid="academic-panel"]')).filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).every(e=>getComputedStyle(e).backgroundColor===${JSON.stringify(expected)})`);
    assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   }
  }
 }
 assert.equal(combinations,80);
 await browser.click('Sage background');await browser.click('Light');await browser.click('Purple');
 await browser.wait(`JSON.parse(localStorage.getItem('studystreak:appearance:v2:101')||'{}').background==='sage'`);
 await browser.evaluate('history.back()');await browser.wait(has('Open menu'));
 for(const path of ['/dashboard','/focus-studio','/resources','/notifications','/goals','/tracking','/validations','/study-rooms']){
  await browser.evaluate(`window.history.pushState({},'',${JSON.stringify(path)});window.dispatchEvent(new PopStateEvent('popstate'))`);
  await browser.wait(`location.pathname===${JSON.stringify(path)}`);await browser.wait(has('Open menu'));
  await new Promise(resolve=>setTimeout(resolve,100));assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,path);
  const discordant=await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid="academic-panel"]')).filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).map(e=>getComputedStyle(e).backgroundColor).filter(color=>color!=='rgb(251, 253, 249)')`);
  assert.deepEqual(discordant,[],path+' surfaces');
 }
 await settings();await logout();account=202;await login();await settings();await browser.wait(selected('Neutral background','aria-checked'));
 assert.equal(await browser.evaluate(selected('System')),true);assert.equal(await browser.evaluate(selected('Mint')),true);
 await browser.click('Amber background');await browser.wait(`JSON.parse(localStorage.getItem('studystreak:appearance:v2:202')||'{}').background==='amber'`);
 await logout();account=101;await login();await settings();await browser.wait(selected('Sage background','aria-checked'));assert.equal(await browser.evaluate(selected('Purple')),true);
 await browser.evaluate(`localStorage.setItem('studystreak-dashboard-v1-101','fixture-layout');localStorage.setItem('studystreak:study-environment:v1:101','fixture-environment')`);
 await browser.click('Restore default appearance');await browser.wait(selected('Neutral background','aria-checked'));await browser.wait(selected('System'));
 assert.deepEqual(await browser.evaluate(`[localStorage.getItem('studystreak-dashboard-v1-101'),localStorage.getItem('studystreak:study-environment:v1:101')]`),['fixture-layout','fixture-environment']);
 for(const width of [320,390,768]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);}
 assert.deepEqual(browser.errors,[]);process.stdout.write('M2 appearance passed: 80 combinations, migration, A/B/A, reset isolation, routes and 320/390/768 widths.\n');
}catch(error){process.stderr.write(JSON.stringify(await browser.evaluate(`({storage:Object.fromEntries(Object.entries(localStorage)),choices:Array.from(document.querySelectorAll('[role="radio"]')).map(e=>[e.getAttribute('aria-label'),e.getAttribute('aria-checked')])})`))+'\n');throw error;}finally{await browser.close();}
