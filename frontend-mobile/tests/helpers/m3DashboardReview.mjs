import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const ids=['focus-summary','streak','activity','goals','journey','recent','partners','quick'];
const visible=`Array.from(document.querySelectorAll('[data-testid^="widget-"]')).filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).map(e=>e.dataset.testid.slice(7))`;
const modal=`!!document.querySelector('[data-testid="dashboard-customization-modal"]')`;
const calendars=`Array.from(document.querySelectorAll('[data-testid="recorded-activity-calendar"]')).filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).length`;
export async function reviewM3Dashboard(browser,{account,statsRequests}){
 const load=async id=>{
  account(id);await browser.navigate('/');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
  await browser.fill('[aria-label="Username"]','Fixture Student');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');
  await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();
  await browser.wait(`!!document.querySelector('[data-testid="widget-activity"]')&&document.body.textContent.includes('All-time recorded')`);
 };
 const open=async()=>{await browser.click('Customize Dashboard');await browser.wait(modal);};
 const end=async()=>{await browser.click('Done customizing');await browser.wait('!'+modal);};
 const layout=`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101')||'[]')`;
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await browser.command('Emulation.setTouchEmulationEnabled',{enabled:true});
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.navigate('/');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
 await browser.evaluate(`localStorage.setItem('studystreak-dashboard-v1-101',${JSON.stringify(JSON.stringify(ids.map((id,index)=>({id,visible:true,...(index===0?{layoutVersion:2}:{})}))))})`);
 await load(101);assert.equal(await browser.evaluate(`(${visible}).length`),8);assert.equal(await browser.evaluate(calendars),0);
 assert.equal(await browser.evaluate(`document.body.textContent.includes('Your notifications')`),false);
 await open();assert.equal(await browser.evaluate(`document.querySelectorAll('[data-testid^="customize-row-"]').length`),9);
 assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Move Study Streak up"]')`),false);
 const initial=statsRequests();
 // True touch events exercise native PanResponder (no HTML drag events).
 const rect=await browser.evaluate(`(()=>{const r=document.querySelector('[aria-label="Reorder Focus Summary"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 const destination=await browser.evaluate(`(()=>{const r=document.querySelector('[aria-label="Reorder Study Activity"]').getBoundingClientRect();return r.y+r.height/2})()`);
 await browser.command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x,y:rect.y,id:1}]});
 for(let i=1;i<=12;i++){await browser.command('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x,y:rect.y+(destination-rect.y)*i/12,id:1}]});await new Promise(r=>setTimeout(r,20));}
 await browser.wait(`!!document.querySelector('[data-testid="widget-drop-target"]')`);
 await browser.command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await browser.wait(`${layout}.findIndex(row=>row.id==='focus-summary')===2`);
 assert.equal(await browser.evaluate(`document.body.textContent.includes('Place Focus Summary')`),false,'drag must not open position picker');
 // Keyboard selection and visibility remain available without a position picker.
 await browser.evaluate(`document.querySelector('[aria-label="Reorder Focus Summary"]').focus()`);await browser.command('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await browser.command('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await browser.wait(`document.querySelector('[aria-label="Reorder Focus Summary"]').getAttribute('aria-pressed')==='true'`);assert.equal(await browser.evaluate(`document.body.textContent.includes('Place Focus Summary')`),false);

 // Cancelled touches never persist an intermediate order.
 const beforeCancel=await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`);
 const source=await browser.evaluate(`(()=>{const r=document.querySelector('[aria-label="Reorder Focus Summary"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await browser.command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...source,id:1}]});
 await browser.command('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:source.x,y:source.y+90,id:1}]});
 await browser.command('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 assert.equal(await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`),beforeCancel);
 // Holding near the viewport edge scrolls through the whole nine-row list.
 const edge=await browser.evaluate(`document.querySelector('[aria-label="Restore default layout"]').getBoundingClientRect().top-45`);
 await browser.command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...source,id:1}]});
 for(let i=1;i<=12;i++){await browser.command('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:source.x,y:source.y+(edge-source.y)*i/12,id:1}]});await new Promise(r=>setTimeout(r,20));}
 await new Promise(r=>setTimeout(r,1800));
 await browser.command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await browser.wait(`${layout}.findIndex(row=>row.id==='focus-summary')===8`);
 await browser.click('Reorder Focus Summary');assert.equal(await browser.evaluate(`document.body.textContent.includes('Place Focus Summary')`),false);
 await browser.evaluate(`document.querySelector('[aria-label="Show Activity Calendar"]').click()`);
 await browser.wait(`${layout}.find(row=>row.id==='calendar').visible===true`);
 assert.equal(statsRequests(),initial,'customization adds no statistics requests');
 const capture=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/m3-customize.png',Buffer.from(capture.data,'base64'));
 await end();await browser.wait(`${calendars}===1`);
 await browser.click('Explore study details');await browser.wait(`document.body.textContent.includes('See the Activity Calendar widget')`);assert.equal(await browser.evaluate(calendars),1);
 await open();await browser.evaluate(`document.querySelector('[aria-label="Show Activity Calendar"]').click()`);await end();
 await browser.wait(`${calendars}===1`);assert.equal(await browser.evaluate(`document.body.textContent.includes('See the Activity Calendar widget')`),false);
 await browser.wait(`(${visible}).at(-1)==='focus-summary'`);
 // Reload loses only the in-memory preview login; saved layout remains per account.
 await load(101);await browser.wait(`(${visible}).at(-1)==='focus-summary'`);
 await load(202);assert.equal(await browser.evaluate(`(${visible})[0]`),'activity');assert.equal(await browser.evaluate(`(${visible}).length`),9);
 await load(101);await browser.wait(`(${visible}).at(-1)==='focus-summary'`);
 await open();await browser.click('Restore default layout');await end();await browser.wait(`(${visible}).length===9&&(${visible})[0]==='activity'`);
 await open();
 const labels=await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid="dashboard-customization-modal"] [aria-label^="Show "]')).map(e=>e.getAttribute('aria-label'))`);
 for(const label of labels){await browser.evaluate(`document.querySelector('[aria-label="${label}"]').click()`);await browser.wait(`${layout}.filter(row=>row.visible).length===${9-labels.indexOf(label)-1}`);}
 await end();await browser.wait(`document.body.textContent.includes('Your Dashboard is clear')`);
 await open();await browser.click('Restore default layout');await end();await browser.wait(`(${visible}).length===9`);
 await open();await browser.key('Escape');await browser.wait('!'+modal);
 await browser.wait(`document.activeElement?.getAttribute('aria-label')==='Customize Dashboard'`);
 for(const width of [320,390,768]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);}
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 // Route traversal includes the shared heading implicated in the native warning.
 for(const [path,title] of [['/goals','My Goals'],['/tracking','Tracking Links'],['/validations','Validations'],['/study-rooms','Study Rooms'],['/resources','Study resources'],['/notifications','Notifications'],['/focus-studio','Focus Studio'],['/profile','Profile'],['/settings','Appearance']]){
  await browser.evaluate(`window.history.pushState({},'',${JSON.stringify(path)});window.dispatchEvent(new PopStateEvent('popstate'))`);
  await browser.wait(`document.body.textContent.includes(${JSON.stringify(title)})`);
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,path);
 }
 await browser.click('Sky background');await browser.click('Dark');await browser.evaluate('history.back()');
 await browser.evaluate(`window.history.pushState({},'','/dashboard');window.dispatchEvent(new PopStateEvent('popstate'))`);
 await browser.wait(`!!document.querySelector('[data-testid="widget-activity"]')`);
 const dashboard=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/m3-dashboard.png',Buffer.from(dashboard.data,'base64'));
 assert.deepEqual(browser.errors,[]);
 console.log('M3: native touch drag/drop, target feedback, tap selection, modal Escape/focus, calendar uniqueness, A/B/A persistence, defaults, routes and 320–768px passed.');
}
