import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const labels={'focus-summary':'Focus Summary',streak:'Study Streak',activity:'Study Activity',goals:'Active Goals',journey:'Study Journey',recent:'Recent Activity',partners:'Study Partners',quick:'Quick Focus'};
export async function reviewDashboardWidgets(browser,platform,{account,statsRequests,tokenFor}) {
 const mobile=platform==='mobile',root=resolve(process.env.STUDY_ENV_CAPTURES||'../docs/images/academia-pixel-viva-8-2');mkdirSync(root,{recursive:true});
 const visibleWidgets=mobile?`Array.from(document.querySelectorAll('[data-testid^="widget-"]')).filter(e=>!e.closest('[aria-hidden="true"]')).map(e=>e.dataset.testid.slice(7))`:`Array.from(document.querySelectorAll('[data-widget]')).map(e=>e.dataset.widget)`;
 const attr=mobile?'data-testid':'data-widget';
 const widget=id=>`document.querySelector('[${attr}="${mobile?'widget-':''}${id}"]')`;
 const open=async()=>{await browser.click('Customize Dashboard');await browser.wait(`!!document.querySelector('[aria-label="Show Active Goals"]')`);};
 const toggle=label=>browser.evaluate(`document.querySelector('[aria-label="Show ${label}"]').click()`);
 const move=label=>browser.evaluate(`document.querySelector('[aria-label="Move ${label} up"]').click()`);
 const capture=async name=>{
  await browser.evaluate(`window.scrollTo(0,0);Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`);
  await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`${platform}-${name}.png`),Buffer.from(shot.data,'base64'));
 };
 const load=async(id,reload=false)=>{
  account(id);
  if(!mobile){
   await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(tokenFor(id))})`);
   if(reload)await browser.reload();else await browser.navigate('/dashboard');
  }else{
   if(reload)await browser.reload();else await browser.navigate('/');
   await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
   await browser.fill('[aria-label="Username"]','Fixture Student');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');
   await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();
  }
  await browser.wait(`${widget('activity')}&&document.body.innerText.includes('All-time recorded')`);
  await browser.wait(`!!document.querySelector('button:not(:disabled),[role="button"]')`);
 };
 await browser.command('Emulation.setTimezoneOverride',{timezoneId:'America/Lima'});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:1100,deviceScaleFactor:1,mobile:true});
 if(!mobile){await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',sessionStorage.getItem('accessToken')||${JSON.stringify(tokenFor(101))});`});await browser.navigate('/dashboard');await browser.wait(`document.body.innerText.includes('All-time recorded')`);}else await load(101);
 await browser.wait(`document.body.innerText.includes('Authorized partner')`);
 assert.equal(await browser.evaluate(`document.body.innerText.includes('Pending private member')||document.body.innerText.includes('Foreign private member')`),false);
 const initial=statsRequests();
 for(const width of mobile?[320,390,768]:[320,390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture(`default-${width}`);
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:1100,deviceScaleFactor:1,mobile:true});
 await open();await toggle('Active Goals');await browser.wait(`!${widget('goals')}`);
 await browser.command('Page.bringToFront');
 await browser.evaluate(`document.querySelector('[aria-label="Move Study Partners up"]').focus()`);
 await browser.command('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await browser.command('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await browser.wait(`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101')).findIndex(row=>row.id==='partners')===5`);
 assert.equal(await browser.evaluate(`document.activeElement?.getAttribute('aria-label')`),'Move Study Partners up','Reordering preserves keyboard focus');
 for(let n=0;n<5;n++){await move('Study Partners');await browser.wait(`JSON.parse(localStorage.getItem('studystreak-dashboard-v1-101')).findIndex(row=>row.id==='partners')===${4-n}`);}
 await browser.wait(`(${visibleWidgets})[0]==='partners'`);
 assert.equal(statsRequests(),initial,'Customizing never refetches shared statistics');
 await capture('customize');await browser.click('Done customizing');await capture('customized-390');
 const saved=await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-101')`);assert.ok(saved&&!saved.includes('token'));
 await load(101,true);await browser.wait(`(${visibleWidgets})[0]==='partners'&&!${widget('goals')}`);
 await load(202,true);assert.equal(await browser.evaluate(`(${visibleWidgets})[0]`),'focus-summary');assert.equal(await browser.evaluate(`!!${widget('goals')}`),true);
 await open();await toggle('Recent Activity');await browser.click('Done customizing');
 await load(101,true);await browser.wait(`(${visibleWidgets})[0]==='partners'&&!${widget('goals')}`);assert.equal(await browser.evaluate(`!!${widget('recent')}`),true);
 await open();await browser.click('Restore default layout');await browser.wait(`(${visibleWidgets}).length===8&&(${visibleWidgets})[0]==='focus-summary'`);
 // Focusable order controls, live announcements and visibility switches keep native semantics.
 await browser.evaluate(`document.querySelector('[aria-label="Move Focus Summary down"]').focus()`);
 assert.equal(await browser.evaluate(`document.activeElement===document.querySelector('[aria-label="Move Focus Summary down"]')`),true);
 await browser.key('Tab');assert.notEqual(await browser.evaluate('document.activeElement.tagName'),'BODY');
 for(const label of Object.values(labels))await toggle(label);
 await browser.wait(`(${visibleWidgets}).length===0&&document.body.innerText.includes('Your Dashboard is clear')`);
 await browser.click('Restore default layout');await browser.click('Done customizing');
 await browser.click('Lines');await browser.click('30 days');await browser.wait(`document.body.innerText.includes('Across all 30 days')`);await browser.click('Bars');
 await browser.evaluate(`localStorage.setItem('studystreak-dashboard-v1-101','corrupt')`);await load(101,true);assert.equal(await browser.evaluate(`(${visibleWidgets}).length`),8);
 if(!mobile){
  for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
   await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  }
  assert.equal(await browser.evaluate(`getComputedStyle(${widget('activity')}).animationName`),'none');
  await capture('light-orange');
 }else{
  await browser.click('Open menu');await browser.click('Settings');await browser.click('Light');await browser.click('Purple');
  await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);await browser.evaluate('history.back()');await browser.wait(`!!${widget('activity')}`);await capture('light-purple');
 }
 assert.deepEqual(browser.errors,[]);
 console.log(`${platform}: visibility/order/reload/defaults/account isolation/invalid settings/charts/keyboard/responsive/appearance passed.`);
}
