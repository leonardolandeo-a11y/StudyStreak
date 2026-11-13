import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { environmentFixture } from '../../scripts/tests/studyEnvironmentFixture.mjs';
const root = resolve('../.local/stage83b/environment-regression');
mkdirSync(root, { recursive: true });
const requests = [];
const browser = await mobileBrowser({ intercept: request => {
  requests.push({ path: new URL(request.url).pathname, method: request.method });
  return environmentFixture(request);
} });
const scene = '[data-testid="study-environment"]';
const resetScroll = `window.scrollTo(0,0);Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`;
const capture = async name => {
  await browser.evaluate(resetScroll);
  await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const shot = await browser.command('Page.captureScreenshot', { format: 'png' });
  writeFileSync(resolve(root, `${name}.png`), Buffer.from(shot.data, 'base64'));
};
const navigate = async label => {
  await browser.click('Open menu'); await browser.click(label); await browser.waitForDrawerClosed();
  await browser.wait(`document.body.innerText.includes(${JSON.stringify(label === 'Dashboard' ? 'All-time recorded' : 'DEEP WORK')})`);
};
try {
  await browser.command('Page.addScriptToEvaluateOnNewDocument', { source: `window.__reviewErrors=[];window.addEventListener('error',e=>window.__reviewErrors.push(e.error?.stack||e.message));window.addEventListener('unhandledrejection',e=>window.__reviewErrors.push(String(e.reason?.stack||e.reason)));window.__environmentNow=new Date(2026,10,12,15).getTime();window.__RealDate=Date;window.Date=class extends Date{constructor(...args){super(...(args.length?args:[window.__environmentNow]));}static now(){return window.__RealDate.now();}};window.__environmentHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__environmentHidden});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__environmentHidden?'hidden':'visible'});` });
  await browser.command('Emulation.setDeviceMetricsOverride', { width:390,height:1000,deviceScaleFactor:1,mobile:true });
  await browser.navigate('/'); await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
  await browser.fill('[aria-label="Username"]','Scholar'); await browser.fill('[aria-label="Password"]','Fixture-password-1'); await browser.click('Sign in');
  await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);
  await navigate('Dashboard');
  await browser.wait(`!!document.querySelector('[data-testid="study-scene-afternoon"]')`);
  await browser.wait(`Array.from(document.querySelectorAll('${scene} img')).every(i=>i.complete&&i.naturalWidth>0)`);
  for(const width of [320,390,768]) {
    await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:true});
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
    assert.equal(await browser.evaluate(`(()=>{const hero=document.querySelector('${scene}').getBoundingClientRect();const metrics=document.querySelector('[data-testid="dashboard-metrics"]').getBoundingClientRect();return hero.bottom<=metrics.top&&hero.width>innerWidth*.8})()`),true);
    await capture(`dashboard-${width}`);
    await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid="academic-panel"]')).find(e=>e.textContent.includes('Your study journey')).scrollIntoView({block:'start'})`);
    const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`journey-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
  for(const [hour,period] of [[9,'morning'],[15,'afternoon'],[22,'night']]) {
    await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__environmentNow=new window.__RealDate(2026,10,12,${hour}).getTime();window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));`);
    await browser.wait(`!!document.querySelector('[data-testid="study-scene-${period}"]')`);
    await browser.wait(`Array.from(document.querySelectorAll('${scene} img')).every(i=>i.complete&&i.naturalWidth>0)`);
    await capture(`dashboard-${period}`);
  }
  await browser.wait(`!!document.querySelector('${scene} [data-testid="ambient-running"]')`);
  const steam = `getComputedStyle(document.querySelector('${scene} [data-testid="environment-steam"]')).transform`;
  const before=await browser.evaluate(steam); await new Promise(r=>setTimeout(r,500));assert.notEqual(await browser.evaluate(steam),before);
  await browser.evaluate(`window.__environmentHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);
  await browser.wait(`!!document.querySelector('${scene} [data-testid="ambient-paused"]')`);
  await browser.evaluate(`window.__environmentHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);
  await browser.wait(`!!document.querySelector('${scene} [data-testid="ambient-running"]')`);
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await browser.wait(`!!document.querySelector('${scene} [data-testid="ambient-paused"]')`);
  await browser.click('Lines');await browser.wait(`!!document.querySelector('[aria-label^="Line chart"]')`);
  await browser.click('30 days');await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days"]')`);
  await browser.click('Bars');await browser.wait(`!!document.querySelector('[aria-label^="Bar chart, 30 days"]')`);
  assert.equal(requests.filter(r=>r.path==='/api/focus-sessions/stats').length,2);
  await browser.click('Explore study details');await browser.wait(`document.body.innerText.includes('Completion rate')`);
  for(const tab of ['Goals','Together','History','Activity']) {
    // Exact tab text avoids the navigation drawer destinations.
    await browser.evaluate(`Array.from(document.querySelectorAll('[role="button"]')).find(e=>e.textContent==='${tab}'&&!e.closest('[aria-hidden="true"]')).click()`);
    await browser.wait(`document.body.innerText.includes(${JSON.stringify({Goals:'Where your time goes',Together:'Your study balance',History:'Session history',Activity:'Completion rate'}[tab])})`);
  }
  await browser.click('Hide study details');
  // Same system appearance preferences, no route-local persistence/provider.
  for(const mode of ['Dark','Light','System']) for(const accent of ['Mint','Blue','Purple','Orange']) {
    await browser.click('Open menu');await browser.click('Settings');await browser.click(mode);await browser.click(accent);
    await browser.evaluate('history.back()');await browser.wait(`!!document.querySelector('${scene}')`);
    await browser.waitForDrawerClosed();await browser.wait('document.documentElement.scrollWidth<=innerWidth');
    await capture(`dashboard-${mode.toLowerCase()}-${accent.toLowerCase()}`);
  }
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await browser.click('Open menu');await browser.click('Settings');
  await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);
  await browser.evaluate('history.back()');await browser.wait(`!!document.querySelector('${scene} [data-testid="ambient-paused"]')`);
  await browser.wait(`!!document.querySelector('${scene} [data-testid="environment-steam"]')`);
  const still=await browser.evaluate(steam);await new Promise(r=>setTimeout(r,150));assert.equal(await browser.evaluate(steam),still);
  await navigate('Focus Studio');
  for(const width of [320,390,768]) {
    await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:true});
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
    assert.equal(await browser.evaluate(`(()=>{const r=document.querySelector('[data-testid="pomodoro-circle"]').getBoundingClientRect();return r.width>0&&Math.abs(r.width-r.height)<1})()`),true);
    assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('${scene}')).some(e=>e.getClientRects().length&&!e.closest('[aria-hidden=\"true\"]'))||document.body.innerText.includes('Study ambience')`),false);
    await capture(`focus-studio-${width}`);
  }
  await browser.evaluate(`document.querySelector('[aria-label="Focus settings"]').focus()`);
  assert.equal(await browser.evaluate(`document.activeElement===document.querySelector('[aria-label="Focus settings"]')`),true);
  await browser.click('Focus settings');await browser.wait(`!!document.querySelector('[aria-label="Save Focus settings"]')`);
  await browser.click('Cancel');
  await browser.click('Short break');await browser.wait(`document.body.innerText.includes('05:00')`);
  await browser.click('Long break');await browser.wait(`document.body.innerText.includes('15:00')`);
  await browser.click('Focus');await browser.wait(`document.body.innerText.includes('25:00')`);
  for(const mode of ['Dark','Light','System']) for(const accent of ['Mint','Blue','Purple','Orange']) {
    await browser.click('Open menu');await browser.click('Settings');await browser.click(mode);await browser.click(accent);
    await browser.evaluate('history.back()');await browser.wait(`!!document.querySelector('[data-testid="pomodoro-circle"]')`);
    await browser.waitForDrawerClosed();await capture(`focus-studio-${mode.toLowerCase()}-${accent.toLowerCase()}`);
  }
  // A real image loading failure (not a DOM event) exercises React Native's image loader.
  await browser.command('Network.enable');
  await browser.command('Network.setCacheDisabled',{cacheDisabled:true});
  await browser.command('Network.setBlockedURLs',{urls:['*study-v1/campus.*png','*study-v1/library.*png','*study-v1/night.*png','*study-v1/cafe.*png']});
  await browser.reload();await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
  await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');
  await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await navigate('Dashboard');
  await browser.wait(`!!document.querySelector('${scene}')&&!document.querySelector('${scene} [data-testid="environment-steam"]')`);
  await browser.wait(`Array.from(document.querySelectorAll('${scene} img')).some(i=>i.src.includes('academy-pixel-static')&&i.complete&&i.naturalWidth>0)`);
  await capture('dashboard-static-fallback');
  assert.deepEqual(requests.filter(r=>r.method!=='GET'&&r.path!=='/login'),[]);
  assert.deepEqual(browser.errors,[]);
  console.log('8.1d: Dashboard/Focus, 320/390/768, three periods, 12 appearances, motion/background, 7/30 charts and existing controls passed.');
} catch(error) {
  writeFileSync(resolve(root,'failure.json'),JSON.stringify({text:await browser.evaluate('document.body.innerText'),errors:browser.errors,details:await browser.evaluate('window.__reviewErrors')}));throw error;
} finally { await browser.close(); }
