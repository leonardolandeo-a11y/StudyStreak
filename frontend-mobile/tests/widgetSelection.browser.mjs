import assert from 'node:assert/strict';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { environmentFixture } from '../../scripts/tests/studyEnvironmentFixture.mjs';
const legacy=['focus-summary','streak','activity','goals','journey','recent','partners','quick','calendar'].map(id=>({id,visible:true}));
let owner=101;
const browser=await mobileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;
 if(path==='/login')return {body:{token:'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:owner,sub:'Fixture Student',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature',refreshToken:'fixture-only'}};
 if(path==='/api/profile')return {body:{id:owner,username:'Fixture Student',presentationName:'Fixture Student'}};
 if(path===`/users/${owner}/goals`&&owner!==101)return {body:{content:[],totalPages:0,totalElements:0,last:true}};
 return environmentFixture(request);
}});
const modal=`!!document.querySelector('[data-testid="dashboard-customization-modal"]')`;
const stored=`localStorage.getItem('studystreak-dashboard-v1-101')`;
const layout=`JSON.parse(${stored}||'[]')`;
const pressed=label=>`(document.querySelector('[aria-label="${label}"]').getAttribute('aria-pressed')==='true')`;
const load=async id=>{
 owner=id;await browser.navigate('/');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
 await browser.fill('[aria-label="Username"]','Fixture Student');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');
 await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();
 await browser.wait(`document.body.textContent.includes('All-time recorded')`);
};
const tap=async label=>{
 await browser.evaluate(`document.querySelector('[aria-label="${label}"]').scrollIntoView({block:'center'})`);
 const point=await browser.evaluate(`(()=>{const r=document.querySelector('[aria-label="${label}"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,id:1}})()`);
 await browser.command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await browser.command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
};
try{
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await browser.command('Emulation.setTouchEmulationEnabled',{enabled:true});
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.navigate('/');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
 await browser.evaluate(`localStorage.setItem('studystreak-dashboard-v1-101',${JSON.stringify(JSON.stringify(legacy))})`);
 await load(101);await browser.wait(`${layout}[0].id==='activity'&&${layout}[0].layoutVersion===2`);
 const initial=await browser.evaluate(stored);
 await tap('Move widget Study Activity');await browser.wait(pressed('Move widget Study Activity'));
 assert.equal(await browser.evaluate(modal),false);assert.equal(await browser.evaluate(`document.querySelectorAll('[data-testid="selected-widget-outline"]').length`),1);
 await browser.click('Lines');assert.equal(await browser.evaluate(pressed('Move widget Study Activity')),true);
 await tap('Move widget Study Activity');await browser.wait('!'+pressed('Move widget Study Activity'));
 await tap('Move widget Study Activity');await tap('Move widget Focus Summary');await browser.wait(pressed('Move widget Focus Summary'));
 assert.equal(await browser.evaluate(pressed('Move widget Study Activity')),false);assert.equal(await browser.evaluate(stored),initial);
 await browser.click('Customize Dashboard');await browser.wait(modal);assert.equal(await browser.evaluate(pressed('Reorder Focus Summary')),true);
 await tap('Reorder Focus Summary');await browser.wait('!'+pressed('Reorder Focus Summary'));
 await tap('Reorder Study Activity');await browser.wait(pressed('Reorder Study Activity'));
 const label='About Study Activity';
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label="${label}"]').getAttribute('aria-expanded')`),'false');
 assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="${label}"] [data-testid="icon-chevron-up-motion"]')`),true);
 await tap(label);await browser.wait(`!!document.querySelector('[data-testid="widget-description-activity"]')`);
 assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="${label}"] [data-testid="icon-chevron-down-motion"]')`),true);
 assert.match(await browser.evaluate(`document.querySelector('[data-testid="widget-description-activity"]').textContent`),/bars or a line/);
 await tap(label);await browser.wait(`!document.querySelector('[data-testid="widget-description-activity"]')`);
 assert.equal(await browser.evaluate(stored),initial);assert.equal(await browser.evaluate(`/Place (Focus|Study|Active|Recent|Quick|Activity)/.test(document.body.textContent)`),false);
 // Modal touch drop still saves; the existing full drag regression covers autoscroll.
 const point=async name=>browser.evaluate(`(()=>{const r=document.querySelector('[aria-label="${name}"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await browser.evaluate(`document.querySelector('[aria-label="Reorder Study Activity"]').scrollIntoView({block:'start'})`);
 const from=await point('Reorder Study Activity'),to=await point('Reorder Focus Summary');
 await browser.command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
 for(let i=1;i<=10;i++){await browser.command('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x,y:from.y+(to.y-from.y)*i/10,id:1}]});await new Promise(r=>setTimeout(r,20));}
 await browser.command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await browser.wait(`${layout}[1].id==='activity'`);
 assert.equal(await browser.evaluate(pressed('Reorder Study Activity')),true,'drop must not toggle selection');
 await browser.click('Done customizing');await browser.wait('!'+modal);assert.equal(await browser.evaluate(pressed('Move widget Study Activity')),true);
 await load(101);await browser.wait(`${layout}[1].id==='activity'`);assert.equal(await browser.evaluate(pressed('Move widget Study Activity')),false);
 await load(202);assert.equal(await browser.evaluate(`document.querySelector('[data-testid="dashboard-widgets"]').firstElementChild.getAttribute('data-testid')`),'widget-activity');
 await load(101);await browser.wait(`${layout}[1].id==='activity'`);
 await tap('Move widget Study Activity');await browser.click('Open menu');await browser.click('Settings');await browser.click('Sky background');await browser.click('Dark');await browser.evaluate('history.back()');
 await browser.wait(`!!document.querySelector('[aria-label="Move widget Study Activity"]')`);assert.equal(await browser.evaluate(pressed('Move widget Study Activity')),false);
 await browser.click('Customize Dashboard');await browser.click('Restore default layout');await browser.click('Done customizing');await browser.wait('!'+modal);await browser.wait(`${layout}[0].id==='activity'&&${layout}.length===9`);
 assert.deepEqual(browser.errors,[]);
 console.log('Widget selection passed: actual taps toggle/exclude selection, no Place views, chevrons, touch drop, legacy default migration, A/B/A, blur reset, Sky/Dark and restore.');
}finally{await browser.close();}
