import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const ids=['focus-summary','streak','activity','goals','journey','recent','partners','quick'];
export async function reviewPersonalization(browser,platform,{setStatsFailure,statsRequests}){
 const mobile=platform==='mobile',baseline=process.env.STUDY84_BASELINE==='1';
 const root=resolve('../.local/captures/academia-pixel-viva-8-4');mkdirSync(root,{recursive:true});
 const prefix=`${baseline?'before':'after'}-${platform}`;
 const hero=mobile?'[data-testid="study-environment"]':'.study-environment';
 const widget=id=>mobile?`[data-testid="widget-${id}"]`:`[data-widget="${id}"]`;
 const key='studystreak-dashboard-v1-101';
 const scene=id=>mobile?`${hero} [data-testid="environment-scene-${id}"]`:`${hero} .panorama-art[data-environment="${id}"]`;
 const visible=`document.documentElement.scrollWidth<=innerWidth`;
 const top=`window.scrollTo(0,0);Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`;
 const shot=async(name,scroll=true)=>{if(scroll)await browser.evaluate(top);await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');const r=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`${prefix}-${name}.png`),Buffer.from(r.data,'base64'));};
 const dashboard=async()=>{
  if(mobile){await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);await browser.fill('[aria-label="Username"]','Fixture Student');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await browser.click('Open menu');await browser.click('Dashboard');await browser.waitForDrawerClosed();}
  else await browser.navigate('/dashboard');
  await browser.wait(`!!document.querySelector('${scene('campus')}')`);await browser.wait(`!!document.querySelector('${mobile?'[data-testid^="widget-"]':'[data-widget]'}')`);
 };
 const reload=async()=>{await browser.reload();await dashboard();};
 const layout=async selected=>{await browser.evaluate(`localStorage.setItem('${key}',${JSON.stringify(JSON.stringify(ids.map(id=>({id,visible:selected.includes(id)}))))})`);await reload();};
 const settings=async()=>{if(mobile){await browser.click('Open menu');await browser.click('Settings');}else await browser.navigate('/settings');await browser.wait(`document.body.innerText.includes('Study Environment')`);};
 const back=async()=>{await browser.evaluate('history.back()');if(mobile)await browser.waitForDrawerClosed();await browser.wait(`!!document.querySelector('${hero}')`);};
 const theme=async mode=>{
  await settings();
  if(mobile){await browser.click(mode==='dark'?'Dark':'Light');await browser.click('Mint');}
  else await browser.evaluate(`(()=>{const s=document.querySelector('[aria-labelledby="appearance-heading"] button[role="switch"]');if(s.getAttribute('aria-checked')==='true')s.click();document.querySelector('input[name="display-mode"][value="${mode}"]').click();document.querySelector('input[name="accent-palette"][value="mint"]').click();})()`);
  await shot(`settings-${mode}`);
  await browser.evaluate(`${mobile?`document.querySelector('[data-testid="environment-settings"]')`:`document.querySelector('.environment-settings')`}.scrollIntoView({block:'center'})`);await shot(`environment-${mode}`,false);
  await back();await browser.wait(`!!document.querySelector('${scene('campus')}')`);
 };
 await browser.command('Emulation.setTimezoneOverride',{timezoneId:'America/Lima'});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:1050,deviceScaleFactor:1,mobile});
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__84RealDate=Date;window.Date=class extends Date{constructor(...args){super(...(args.length?args:[new window.__84RealDate(2026,10,13,15).getTime()]));}static now(){return window.__84RealDate.now();}};`});
 if(mobile)await browser.navigate('/');
 await dashboard();await browser.wait(`document.body.innerText.includes('All-time recorded')`);
 for(const mode of ['dark','light']){await theme(mode);await browser.wait(visible);await shot(`dashboard-${mode}`);}
 await theme('dark');
 await layout(['activity']);await browser.wait(`document.body.innerText.includes('Daily focus')`);
 for(const width of mobile?[390,768]:[390,768,1440,1920]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<768});await browser.wait(visible);await shot(`single-${width}`);
  if(!mobile){const ratio=await browser.evaluate(`(()=>{const g=document.querySelector('.custom-widget-grid').getBoundingClientRect(),w=document.querySelector('${widget('activity')}').getBoundingClientRect();return w.width/g.width;})()`);console.log(`single-${width} ratio=${ratio}`);if(!baseline)assert.ok(ratio>.98,'A single widget fills available grid width');}
 }
 await layout(['focus-summary','streak']);await browser.command('Emulation.setDeviceMetricsOverride',{width:mobile?768:1440,height:1050,deviceScaleFactor:1,mobile});await shot('summary');
 if(mobile){const rows=await browser.evaluate(`new Set(Array.from(document.querySelectorAll('[data-testid="widget-focus-summary"] [data-testid="academic-panel"]')).map(e=>Math.round(e.getBoundingClientRect().top))).size`);console.log('tablet summary rows='+rows);if(!baseline)assert.equal(rows,1,'Three summary metrics fit a tablet row');}
 else if(!baseline){const widths=await browser.evaluate(`Array.from(document.querySelectorAll('.dashboard-widget')).map(e=>e.getBoundingClientRect().width)`);assert.ok(Math.abs(widths[0]-widths[1])<2,'Two widgets share width evenly');}
 // Existing retry must remain reachable when the chart widget is hidden.
 setStatsFailure(true);await layout(['focus-summary']);
 const retry=`!!document.querySelector('[aria-label="Retry study statistics"]')`;
 if(baseline){console.log('retry without Activity='+await browser.evaluate(retry));await shot('hidden-chart-error');}
 else{await browser.wait(retry);await shot('hidden-chart-error');const before=statsRequests();setStatsFailure(false);await browser.click('Retry study statistics');await browser.wait(`document.body.innerText.includes('25')`);assert.equal(statsRequests(),before+1);}
 setStatsFailure(false);await layout(ids);
 if(!mobile){
  await browser.click('Customize Dashboard');
  for(let n=0;n<2;n++){await browser.evaluate(`document.querySelector('[aria-label="Move Quick Focus up"]').click()`);await browser.evaluate('new Promise(r=>requestAnimationFrame(r))');}
  const overlap=await browser.evaluate(`Math.max(0,...Array.from(document.querySelectorAll('[data-widget]')).map(e=>e.getAnimations().filter(a=>a.playState==='running'&&a.effect.getKeyframes().some(k=>k.transform!==undefined)).length))`);
  console.log('overlapping position animations='+overlap);if(!baseline)assert.ok(overlap<=1,'Rapid moves cancel previous position animations');
  await browser.click('Done customizing');
 }

 if(mobile){
  await settings();await browser.click('Select Rainy Library');
  await browser.wait(`JSON.parse(localStorage.getItem('studystreak:study-environment:v1:101')).selection==='library'`);
  await browser.evaluate(`window.__84OriginalGet=Storage.prototype.getItem;window.__84Reads=[];Storage.prototype.getItem=function(k){const value=window.__84OriginalGet.call(this,k);return k==='studystreak:study-environment:v1:101'?new Promise(resolve=>window.__84Reads.push(()=>resolve(value))):value;}`);
  await back();await browser.wait('window.__84Reads.length>0');await shot('back-pending');
  const retained=await browser.evaluate(`!!document.querySelector('${scene('campus')}')`);console.log('retained scene while read pending='+retained);if(!baseline)assert.equal(retained,true,'Back keeps last loaded panorama while reading preferences');
  await browser.evaluate('Storage.prototype.getItem=window.__84OriginalGet;window.__84Reads.forEach(run=>run())');await browser.wait(`!!document.querySelector('${scene('library')}')`);
  await shot('back-ready');
 }
 // Each restore control changes only its own preference domain.
 const appearance=await browser.evaluate(`localStorage.getItem('studystreak:appearance:v1')`);
 const widgets=await browser.evaluate(`localStorage.getItem('${key}')`);
 await settings();await browser.click('Restore default environment');
 await browser.wait(`JSON.parse(localStorage.getItem('studystreak:study-environment:v1:101')).selection==='automatic'`);
 assert.equal(await browser.evaluate(`localStorage.getItem('studystreak:appearance:v1')`),appearance);
 assert.equal(await browser.evaluate(`localStorage.getItem('${key}')`),widgets);
 const environment=await browser.evaluate(`localStorage.getItem('studystreak:study-environment:v1:101')`);
 await browser.click('Restore default appearance');
 assert.equal(await browser.evaluate(`localStorage.getItem('studystreak:study-environment:v1:101')`),environment);
 assert.equal(await browser.evaluate(`localStorage.getItem('${key}')`),widgets);
 await back();await browser.click('Customize Dashboard');await browser.click('Restore default layout');
 assert.equal(await browser.evaluate(`localStorage.getItem('studystreak:study-environment:v1:101')`),environment);
 await browser.click('Done customizing');
 assert.deepEqual(browser.errors,[]);
 console.log(`${platform} ${baseline?'baseline':'final'} personalization review passed`);
}
