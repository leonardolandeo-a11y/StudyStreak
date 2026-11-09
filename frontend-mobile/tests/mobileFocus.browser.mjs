import { academicGallery } from './helpers/academicGallery.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const claims = { type: 'access', userId: 101, sub: 'fixture-student', email: 'fixture@example.invalid', role: 'USER', exp: Math.floor(Date.now()/1000)+3600 };
const page = content => ({ content, totalElements: content.length, totalPages: 1, last: true, number: 0, size: 10 });
let session = null; let failGoals = false; let failStats = true; const writes = [];
const browser = await mobileBrowser({ intercept: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/login') return { body: { token: `fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`, refreshToken: 'fixture-only' } };
  if (request.method !== 'GET') {
    const body = request.postData ? JSON.parse(request.postData) : null; writes.push({ path, body });
    if (path === '/api/study/sessions') session = { id: body.sessionId, goal_id: body.goalId, planned_seconds: body.minutes * 60, observed_ms: 0, state: 'RUNNING', ends_at: new Date(Date.now() + body.minutes * 60000).toISOString() };
    else if (path.startsWith('/api/study/sessions/')) {
      if (body.action === 'CANCEL') session = null;
      else if (session && body.action !== 'PULSE') { session.state = body.action === 'PAUSE' ? 'PAUSED' : 'RUNNING'; session.ends_at = session.state === 'RUNNING' ? new Date(Date.now() + session.planned_seconds * 1000).toISOString() : null; }
    }
    return { body: {} };
  }
  if (path === '/api/study/active') return { body: { session, serverNow: new Date().toISOString() } };
  if (path === '/api/profile') return { body: { id: 101, username: 'fixture-student' } };
  if (path.endsWith('/avatar')) return { status: 404 };
  if (path === '/users/101/goals' && failGoals) return { status: 503 };
  if (path === '/users/101/goals') return { body: page([{ id: 1, topic: 'Algebra fixture', completed: false }, { id: 2, topic: 'Physics fixture', completed: false }]) };
  if (path.includes('notifications')) return { body: page([]) };
  if (path === '/api/focus-sessions/stats') {
    if (failStats) return { status: 503 };
    const days = Number(new URL(request.url).searchParams.get('days'));
    const daily = Array.from({ length: days }, (_, index) => ({ date: new Date(Date.UTC(2026,10,index+1)).toISOString().slice(0,10), minutes: 0, sessions: 0 }));
    return { body: { days, timeZone: 'America/Lima', verifiedPeriod: { minutes: 0, sessions: 0, daily }, verifiedMinutes: 0, estimatedMinutes: 99,
      daily, activity: [], byGoal: [], hourly: [], weekly: [], monthly: [], completionPercent: null, changePercent: null,
      activeDays: 0, studyStreak: 0, bestStudyStreak: 0, individualMinutes: 0, groupMinutes: 0, groupSessions: 0, previousMinutes: 0, periodMinutes: 0 } };
  }
  if (path === '/api/study/history') return { body: page([]) };
  return { status: 404 };
} });
const has = label => `!!document.querySelector('[aria-label="${label}"]')`;
try {
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.navigate('/'); await browser.wait(has('Username')); await browser.fill('[aria-label="Username"]','fixture-student');
  await browser.fill('[aria-label="Password"]','fixture-only'); await browser.click('Sign in'); await browser.wait(has('Open menu'));
  failGoals = true;
  await browser.click('Open menu'); await browser.click('Focus Studio'); await browser.waitForDrawerClosed();
  await browser.wait(has('Retry Goals')); failGoals = false; await browser.click('Retry Goals');
  await browser.wait(`!document.querySelector('[aria-label="Retry Goals"]')`);
  await browser.wait(`document.querySelector('[aria-label="Start focus"]')?.getAttribute('aria-disabled') !== 'true' && document.body.innerText.includes('Timer only')`);
  await browser.click('Focus settings'); await browser.wait(has('Decrease Focus')); await browser.click('Decrease Focus');
  await browser.click('Volume 25 percent'); await browser.click('Save Focus settings');
  await browser.wait(has('Time remaining 24:00'));
  await browser.click('Choose study Goal'); await browser.click('Select Goal Algebra fixture');
  await browser.click('Start focus'); await browser.wait(has('Pause timer')); assert.ok(session);
  const id = session.id;
  await browser.click('Pause timer'); await browser.wait(has('Resume session'));
  assert.equal(session.state, 'PAUSED'); assert.equal(session.id, id);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Choose study Goal"]').getAttribute('aria-disabled')`), 'true');
  await browser.click('Focus settings'); await browser.wait(has('Decrease Focus'));
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Decrease Focus"]').getAttribute('aria-disabled')`), 'true');
  await browser.click('Close Focus settings'); await browser.click('Resume session'); await browser.wait(has('Pause timer'));
  assert.equal(session.id, id);
  await browser.click('Open menu'); await browser.click('Dashboard'); await browser.waitForDrawerClosed();
  await browser.click('Open menu'); await browser.click('Focus Studio'); await browser.waitForDrawerClosed(); await browser.wait(has('Pause timer'));
  assert.equal(writes.filter(write => write.path === '/api/study/sessions').length, 1);
  await browser.click('Reset current session'); await browser.wait(has('Start focus'));
  for (let attempt = 0; session && attempt < 100; attempt++) await new Promise(resolve => setTimeout(resolve,20));
  assert.equal(session, null); assert.ok(writes.some(write => write.body?.action === 'CANCEL'));
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Session progress"]').getAttribute('aria-valuenow')`),'0');
  for (const width of [320, 390, 768, 1440, 1920]) {
    await browser.command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await browser.wait('document.documentElement.scrollWidth <= innerWidth');
    await browser.wait(`(() => {const r=document.querySelector('[data-testid="pomodoro-circle"]').getBoundingClientRect();return r.width>0 && Math.abs(r.width-r.height)<1;})()`);
    assert.equal(await browser.evaluate(`(() => {const e=document.querySelector('[data-testid="pomodoro-circle"]');const r=e.getBoundingClientRect();return Math.abs(parseFloat(getComputedStyle(e).borderRadius)-r.width/2)<1;})()`),true);
    const frame=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/73a-focus-${width}.png`,Buffer.from(frame.data,'base64'));

  }
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.evaluate(`document.querySelector('[aria-label="Focus settings"]').scrollIntoView()`);
  const image = await browser.command('Page.captureScreenshot', { format: 'png' }); writeFileSync('.expo/focus-studio.png',Buffer.from(image.data,'base64'));
  const soundCards = await browser.evaluate(`document.querySelector('[aria-label="Soundscape carousel"]').querySelectorAll('[role="button"]').length`);
  assert.equal(soundCards,12);
  await browser.click('Explore your study statistics'); await browser.wait(has('Retry statistics'));
  failStats = false; await browser.click('Retry statistics'); await browser.wait(`document.body.innerText.includes('Verified focus')`);
  assert.equal(await browser.evaluate(`document.body.innerText.includes('99 min historical estimates')`),true);
  await browser.click('30 days'); await browser.wait(`document.body.innerText.includes('Last 30 days · verified only')`);
  await browser.click('Hide statistics');
  assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Focus settings"] [data-testid="icon-gear"]')`),true);
  async function pressMenu(expectedMotion) {
    await browser.click('Open menu');
    await browser.wait(`Array.from(document.querySelectorAll('[aria-label="Menu"]')).some(e=>!e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().left>=0)`);
    assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Settings"] [data-testid="icon-gear"]')`),true);
    assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Menu"] [data-testid="icon-house"]') && !document.querySelector('[aria-label="Dashboard"] [data-testid="icon-house"]')`),true);
    const pos=await browser.evaluate(`(() => {const el=Array.from(document.querySelectorAll('[aria-label="Menu"]')).find(e=>!e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().left>=0);const r=el.getBoundingClientRect();return {x:r.x+20,y:r.y+r.height/2,before:getComputedStyle(el.querySelector('[data-testid="icon-door"]')).transform};})()`);
    await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:pos.x,y:pos.y});
    await browser.command('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:pos.x,y:pos.y});
    await new Promise(resolve=>setTimeout(resolve,70));
    const during=await browser.evaluate(`getComputedStyle(Array.from(document.querySelectorAll('[aria-label="Menu"]')).find(e=>!e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().left>=0).querySelector('[data-testid="icon-door"]')).transform`);
    assert.equal(pos.before!==during,expectedMotion);
    await new Promise(resolve=>setTimeout(resolve,350));
    const returned=await browser.evaluate(`getComputedStyle(Array.from(document.querySelectorAll('[aria-label="Menu"]')).find(e=>!e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().left>=0).querySelector('[data-testid="icon-door"]')).transform`);
    assert.equal(returned,pos.before);
    await browser.command('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pos.x,y:pos.y});
    await browser.waitForDrawerClosed();
  }
  await pressMenu(true);
  await browser.click('Open menu'); await browser.click('Focus Studio'); await browser.waitForDrawerClosed();
  await browser.click('Open menu'); await browser.click('Settings'); await browser.wait(has('Light')); await browser.click('Light'); await browser.click('Orange');
  await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);
  await browser.evaluate('history.back()'); await browser.wait(has('Focus settings')); await browser.click('Focus settings');
  await browser.key('Tab'); assert.equal(await browser.evaluate(`!!document.activeElement?.closest('[aria-modal="true"]')`),true);
  const lightImage = await browser.command('Page.captureScreenshot', { format: 'png' }); writeFileSync('.expo/focus-settings-light.png',Buffer.from(lightImage.data,'base64'));
  await browser.click('Cancel');
  await pressMenu(false);
  await browser.click('Open menu');await browser.click('Focus Studio');await browser.waitForDrawerClosed();
  await academicGallery(browser,'focus');
  assert.deepEqual(browser.errors, []);
  process.stdout.write('Focus browser checks passed: settings, goal selection, start/pause/resume, immutable linked duration, navigation, cancellation and 320–1920px.\n');
} catch(error) {
  writeFileSync('.expo/focus-failure.json',JSON.stringify({ text: await browser.evaluate('document.body.innerText'), writes, errors: browser.errors })); throw error;
} finally { await browser.close(); }
