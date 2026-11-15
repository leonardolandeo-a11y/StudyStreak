import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { environmentFixture } from '../../scripts/tests/studyEnvironmentFixture.mjs';
let owner=101, statsRequests=0;
const token=id=>'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:id,sub:'Fixture Student',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
const browser=await mobileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;
 if(path==='/login')return {body:{token:token(owner),refreshToken:'fixture-only'}};
 if(path==='/logout')return {status:204};
 if(path==='/api/profile')return {body:{id:owner,username:'Fixture Student',presentationName:'Fixture Student'}};
 if(path==='/api/focus-sessions/stats')statsRequests++;
 if(path===`/users/${owner}/goals`&&owner!==101)return {body:{content:[],totalPages:0,totalElements:0,last:true}};
 return environmentFixture(request);
}});
const layout=`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101')||'[]')`;
const widgets=`Array.from(document.querySelectorAll('[data-testid^="widget-"]')).filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).map(e=>e.dataset.testid.slice(7))`;
const modal=`!!document.querySelector('[data-testid="dashboard-customization-modal"]')`;
const load=async id=>{
 owner=id;await browser.navigate('/');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
 await browser.fill('[aria-label="Username"]','Fixture Student');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');
 await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();
 await browser.wait(`!!document.querySelector('[data-testid="widget-activity"]')&&document.body.textContent.includes('All-time recorded')`);
};
const reset=()=>browser.evaluate(`Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`);
const center=label=>browser.evaluate(`(()=>{const r=document.querySelector('[aria-label="${label}"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
const touch=async(from,to,{cancel=false,hold=0}={})=>{
 await browser.command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
 for(let i=1;i<=15;i++){await browser.command('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/15,y:from.y+(to.y-from.y)*i/15,id:1}]});await new Promise(r=>setTimeout(r,20));}
 await browser.wait(`!!document.querySelector('[data-testid="dashboard-drop-target"]')`);
 assert.equal(await browser.evaluate(modal),false,'Dashboard drag must stay outside customization');
 if(hold)await new Promise(r=>setTimeout(r,hold));
 await browser.command('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
};
try{
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await browser.command('Emulation.setTouchEmulationEnabled',{enabled:true});
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await load(101);assert.equal(await browser.evaluate(`(${widgets})[0]`),'activity');
 const composition=await browser.evaluate(`(()=>{const art=document.querySelector('[data-testid="study-environment"]'),heading=document.querySelector('[data-testid="dashboard-heading"]'),chart=document.querySelector('[data-testid="widget-activity"]'),fade=document.querySelector('[data-testid="environment-edge-fade"]');return{art:getComputedStyle(art).cssText,border:getComputedStyle(art).borderTopWidth,bg:getComputedStyle(art).backgroundColor,ratio:art.getBoundingClientRect().width/art.getBoundingClientRect().height,heading:heading.getBoundingClientRect().bottom,chart:chart.getBoundingClientRect().top,gradient:getComputedStyle(fade).backgroundImage,copy:art.textContent}})()`);
 assert.equal(composition.border,'0px');assert.equal(composition.bg,'rgba(0, 0, 0, 0)');assert.ok(Math.abs(composition.ratio-3)<.05);
 assert.ok(composition.chart>=composition.heading&&composition.chart<420);assert.ok(composition.gradient.includes('linear-gradient'));
 assert.equal(composition.copy.trim(),'');
 for(const text of ['Good evening','Welcome back to StudyStreak!','Start focusing','Join a Study Room'])assert.equal(await browser.evaluate(`document.body.textContent.includes(${JSON.stringify(text)})`),false);
 const initialShot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/m3-hotfix-compact.png',Buffer.from(initialShot.data,'base64'));
 const beforeStats=statsRequests;
 await browser.evaluate(`(()=>{let e=document.querySelector('[data-testid="dashboard-widgets"]').parentElement;while(e&&!['auto','scroll'].includes(getComputedStyle(e).overflowY))e=e.parentElement;if(e)e.scrollTop=120;})()`);
 await new Promise(r=>setTimeout(r,100));
 const from=await center('Move widget Study Activity'),to=await center('Move widget Focus Summary');
 assert.ok(to.y<840,'the next card handle is visible in the compact viewport');
 await touch(from,to);await browser.wait(`${layout}.findIndex(row=>row.id==='activity')===1`);
 assert.equal(statsRequests,beforeStats,'direct reorder adds no requests');
 await reset();await new Promise(r=>setTimeout(r,100));
 const saved=await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`);
 await touch(await center('Move widget Focus Summary'),await center('Move widget Study Activity'),{cancel:true});
 assert.equal(await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`),saved);
 // Continuous autoscroll reaches the final card without opening the modal.
 await reset();const first=await center('Move widget Focus Summary');
 await touch(first,{x:first.x,y:865},{hold:7000});
 await browser.wait(`${layout}.at(-1).id==='focus-summary'`);
 await load(101);assert.equal(await browser.evaluate(`(${widgets}).at(-1)`),'focus-summary');
 await load(202);assert.equal(await browser.evaluate(`(${widgets})[0]`),'activity');
 await load(101);assert.equal(await browser.evaluate(`(${widgets}).at(-1)`),'focus-summary');
 // Direct handle activation selects without opening customization.
 await browser.click('Move widget Study Activity');assert.equal(await browser.evaluate(modal),false);
 await browser.click('Customize Dashboard');await browser.wait(modal);await browser.click('Restore default layout');await browser.click('Done customizing');await browser.wait('!'+modal);
 assert.equal(await browser.evaluate(`(${widgets})[0]`),'activity');assert.equal(await browser.evaluate(`(${widgets}).length`),9);
 await browser.click('Lines');await browser.click('30 days');await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days"]')`);
 // Real semantic background is used by both gradients in all ten family/mode pairs.
 for(const background of ['Neutral','Lavender','Sage','Amber','Sky'])for(const mode of ['Light','Dark']){
  await browser.click('Open menu');await browser.click('Settings');await browser.click(background+' background');await browser.click(mode);await browser.evaluate('history.back()');
  await browser.wait(`!!document.querySelector('[data-testid="environment-edge-fade"]')`);
  const themed=await browser.evaluate(`(()=>{const e=document.querySelector('[data-testid="environment-edge-fade"]'),r=e.getBoundingClientRect();return{gradient:getComputedStyle(e).backgroundImage,bg:(()=>{let p=e.parentElement;while(p&&getComputedStyle(p).backgroundColor==='rgba(0, 0, 0, 0)')p=p.parentElement;return p?getComputedStyle(p).backgroundColor:''})(),overflow:document.documentElement.scrollWidth>innerWidth,width:r.width}})()`);
  assert.notEqual(themed.gradient,'none');assert.ok(themed.gradient.includes(themed.bg),background+'/'+mode+' uses the actual canvas color');assert.equal(themed.overflow,false);
 }
 await reset();
 for(const width of [320,390,768]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
 // Two-column drops use horizontal hit testing rather than just row height.
 await browser.wait(`document.body.textContent.includes('All-time recorded')`);
 await browser.evaluate(`document.querySelector('[aria-label="Move widget Study Streak"]').scrollIntoView({block:'center'})`);
 await new Promise(r=>setTimeout(r,150));
 await touch(await center('Move widget Study Streak'),await center('Move widget Active Goals'));
 await browser.wait(`${layout}.findIndex(row=>row.id==='streak')===3`);
 assert.deepEqual(browser.errors,[]);
 console.log('Compact Dashboard passed: art/gradient, activity first, direct touch drag/cancel/autoscroll, selection without popups, A/B/A, chart controls, ten theme pairs and 320/390/768 widths.');
}catch(error){writeFileSync('.expo/m3-hotfix-failure.json',JSON.stringify({error:String(error),text:await browser.evaluate('document.body.innerText'),runtime:browser.errors}));throw error;}finally{await browser.close();}
