import { academicGallery } from './helpers/academicGallery.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const claims = { type: 'access', userId: 101, sub: 'fixture-student', email: 'fixture@example.invalid', role: 'USER', exp: Math.floor(Date.now() / 1000) + 3600 };
const tokens = { token: `fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`, refreshToken: 'fixture-only' };
const page = { content: [], empty: true, totalElements: 0, totalPages: 0, number: 0, size: 10, last: true };
let mode = 'success'; let goalsError = false; let recentError = false;
let holdSeven = false; let releaseSeven;
const historyQueries = []; const mutations = [];
const statRequests = [];
function stats(days) {
  const daily = Array.from({ length: days }, (_, index) => ({ date: new Date(Date.UTC(2026, 10, 31 - days + index)).toISOString().slice(0, 10),
    minutes: mode === 'empty' ? 0 : index === 0 ? 35 : index === days - 1 && days === 30 ? 25 : 0,
    sessions: mode === 'empty' ? 0 : index === 0 ? 2 : index === days - 1 && days === 30 ? 1 : 0 }));
  return { days, timeZone: 'America/Lima', studyStreak: 4, totalMinutes: 95, verifiedMinutes: 75, estimatedMinutes: 20, completedSessions: 4, weekMinutes: 45, periodMinutes: 45, periodSessions: 2, activeDays: 1, bestStudyStreak: 5, completionPercent: 75, previousMinutes: 25, changePercent: 80, individualMinutes: 25, groupMinutes: 20, groupSessions: 1, activity: daily, hourly: [], weekly: [], monthly: [], byGoal: [], daily,
    verifiedPeriod: mode === 'missing' ? undefined : { minutes: mode === 'empty' ? 0 : days === 7 ? 35 : 60,
      sessions: mode === 'empty' ? 0 : days === 7 ? 2 : 3, daily } };
}
const browser = await mobileBrowser({ intercept: async request => {
  const url = new URL(request.url), path = url.pathname;
  if (path === '/login') return { body: tokens };
  if (request.method !== 'GET') { mutations.push(path); return { status: 500 }; }
  if (path === '/api/profile') return { body: { id: 101, username: 'fixture-student', presentationName: 'Fixture Student', bio: null } };
  if (path === '/api/profile/avatar') return { status: 404 };
  if (path === '/api/focus-sessions/stats') {
    statRequests.push({ mode, days: url.searchParams.get('days') });
    const days = Number(url.searchParams.get('days'));
    const reply = mode === 'error' ? { status: 500 } : { body: stats(days) };
    if (holdSeven && days === 7) return new Promise(resolve => { releaseSeven = () => resolve(reply); });
    return reply;
  }
  if (path === '/users/101/goals') {
    if (goalsError) return { status: 500 };
    const index = Number(url.searchParams.get('page'));
    return { body: { ...page, empty: false, last: index === 1, totalPages: 2, totalElements: 4,
      content: index === 0 ? [{ id: 1, topic: 'Completed goal', completed: true }, { id: 2, topic: 'Calculus', completed: false, frequency: 3, duration: 25 },
        { id: 3, topic: 'Physics', completed: false, frequency: 2, duration: 30 }] : [{ id: 4, topic: 'Algebra from page two', completed: false, frequency: 1, duration: 15 }] } };
  }
  if (path === '/api/study/history') {
    historyQueries.push({ from: url.searchParams.get('from'), to: url.searchParams.get('to'), page: url.searchParams.get('page') });
    if (recentError) return { status: 500 };
    return { body: { ...page, content: Array.from({ length: 5 }, (_, index) => ({ id: `session-${index}`, goal_name: `Recent session ${index}`,
      source: index === 0 ? 'LEGACY' : 'INDIVIDUAL', state: 'COMPLETE', confirmed_seconds: 900, started_at: '2026-11-29T19:00:00Z', verified: index !== 0 })) } };
  }
  if (path.includes('/notifications') || path.startsWith('/api/tracking-links')) return { body: page };
  return { status: 404 };
} });
const has = label => `!!document.querySelector('[aria-label="${label}"]')`;
const chart = type => `!!document.querySelector('[aria-label^="${type} chart"]')`;
try {
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.navigate('/'); await browser.wait(has('Username'));
  await browser.fill('[aria-label="Username"]', 'fixture-student'); await browser.fill('[aria-label="Password"]', 'Fixture-password-1');
  await browser.click('Sign in'); await browser.wait(has('Open menu')); await browser.click('Open menu');
  await browser.click('Dashboard'); await browser.wait(chart('Bar'));
  await browser.waitForDrawerClosed();
  assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Active study days in this period"]')`),false);
  await browser.wait(`document.body.innerText.includes('All-time recorded')`);
  assert.equal(statRequests.length,1);
  await browser.click('Explore study details');await browser.wait(`document.body.innerText.includes('Completion rate')`);
  await browser.click('Hide study details');
  await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid="academic-panel"]')).find(e=>e.textContent.includes('Your study journey')).scrollIntoView({block:'start'})`);
  const insightsShot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/74a-dashboard-insights.png',Buffer.from(insightsShot.data,'base64'));
  assert.equal(statRequests.length,1);
  await browser.wait(`document.body.innerText.includes('Algebra from page two') && document.body.innerText.includes('Historical / unverified')`);
  assert.equal(await browser.evaluate(`document.body.innerText.includes('77777')`), false);
  assert.equal(await browser.evaluate(`document.body.innerText.includes('Recent session 4')`), false);
  assert.ok(historyQueries.some(query => query.from === '2026-11-24' && query.to === '2026-11-30' && query.page === '0'));
  await browser.click('Lines'); await browser.wait(chart('Line'));
  await browser.click('30 days'); await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days, 60 verified minutes"]')`);
  await browser.click('Show daily values'); await browser.wait(`document.body.innerText.includes('25 min · 1 sessions')`);
  await browser.click('Hide daily values');
  holdSeven = true; await browser.click('7 days');
  for (let attempt = 0; !releaseSeven && attempt < 100; attempt++) await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(releaseSeven, 'The delayed seven-day request was issued.');
  await browser.click('30 days'); await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days, 60 verified minutes"]')`);
  holdSeven = false; releaseSeven();
  await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days, 60 verified minutes"]')`);
  mode = 'empty'; await browser.click('7 days'); await browser.wait(`document.body.innerText.includes('No verified study time')`);
  mode = 'error'; await browser.click('30 days'); await browser.wait(has('Retry activity'));
  mode = 'missing'; await browser.click('Retry activity'); await browser.wait(`document.body.innerText.includes('unavailable or inconsistent')`);
  mode = 'success'; await browser.click('Retry activity'); await browser.wait(chart('Line'));
  recentError = true; await browser.click('7 days'); await browser.wait(has('Retry recent activity'));
  recentError = false; await browser.click('Retry recent activity'); await browser.wait(`document.body.innerText.includes('Recent session 0')`);
  goalsError = true; await browser.click('Open menu'); await browser.click('Menu'); await browser.wait(has('Create a goal'));
  await browser.click('Open menu'); await browser.click('Dashboard'); await browser.wait(has('Retry goals'));
  goalsError = false; await browser.click('Retry goals'); await browser.wait(has('Open Algebra from page two'));
  await browser.waitForDrawerClosed();
  for (const width of [320, 390, 768, 1440, 1920]) {
    await browser.command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await browser.wait('document.documentElement.scrollWidth <= innerWidth');
    await browser.evaluate(`Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`);
    const frame=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/73a-dashboard-${width}.png`,Buffer.from(frame.data,'base64'));
  }
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.click('30 days'); await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days"]')`);
  await browser.click('Bars'); await browser.wait(chart('Bar'));
  const barImage = await browser.command('Page.captureScreenshot', { format: 'png' });
  writeFileSync('.expo/dashboard-bars.png', Buffer.from(barImage.data, 'base64'));
  await browser.click('Lines'); await browser.wait(chart('Line'));
  const lineImage = await browser.command('Page.captureScreenshot', { format: 'png' });
  writeFileSync('.expo/dashboard-lines.png', Buffer.from(lineImage.data, 'base64'));
  await browser.click('Open menu'); await browser.click('Settings'); await browser.wait(has('Light'));
  await browser.click('Light'); await browser.click('Blue');
  await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);
  await browser.evaluate('history.back()'); await browser.wait(chart('Line'));
  await browser.click('Open menu'); await browser.wait(has('Dismiss menu')); await browser.command('Page.bringToFront');
  await browser.evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{document.querySelector('[aria-label="Dismiss menu"]').focus();resolve()})))`);await browser.key('Escape');
  await browser.wait(`!document.querySelector('[aria-label="Dismiss menu"]')`);
  await academicGallery(browser,'dashboard');
  assert.deepEqual(mutations, []); assert.deepEqual(browser.errors, []);
  process.stdout.write('Dashboard browser checks passed: both charts, 7/30, empty/error/retry, missing verifiedPeriod, paged goals, recent labels, themes, reduced-motion menu and 320–1920px.\n');
} catch (error) {
  writeFileSync('.expo/dashboard-failure.json', JSON.stringify({ text: await browser.evaluate('document.body.innerText'), statRequests, errors: browser.errors }));
  throw error;
} finally { releaseSeven?.(); await browser.close(); }
