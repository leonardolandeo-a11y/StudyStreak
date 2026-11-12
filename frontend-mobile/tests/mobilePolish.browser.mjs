import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { reviewNativeModule } from './helpers/academicModuleReview.mjs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const claims = { type: 'access', userId: 101, sub: 'fixture-student', email: 'fixture@example.invalid', role: 'USER', exp: Math.floor(Date.now() / 1000) + 3600 };
const tokens = { token: `fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`, refreshToken: 'fixture-only' };
const goals = [{ id: 1, topic: 'Existing completed goal', completed: true, frequency: 2, duration: 25 }];
const partner = { id: 3, username: 'partner' };
const link = { id: 1, requesterId: 101, receiverId: 3, requesterUsername: 'fixture-student', receiverUsername: 'partner', status: 'ACCEPTED' };
const makePage = content => ({ content, empty: content.length === 0, totalElements: content.length, totalPages: content.length ? 1 : 0, last: true, number: 0, size: 10 });
const writes = []; let holdGoal; let finishGoal; let room; let failValidation = true;
const reads = { goals: 0, history: 0, partners: 0, rooms: 0 };
const browser = await mobileBrowser({ intercept: async request => {
  const url = new URL(request.url), path = url.pathname;
  if (path === '/login') return { body: tokens };
  if (request.method !== 'GET') {
    const body = request.postData ? JSON.parse(request.postData) : null;
    writes.push({ path, body });
    if (path === '/users/101/goals') {
      if (holdGoal) return new Promise(resolve => { finishGoal = () => resolve({ status: 400, body: { message: 'Fixture validation error' } }); });
      const goal = { ...body, id: 2 }; goals.push(goal); return { body: goal };
    }
    if (path === '/api/tracking-links/3') return { body: { ...link, id: 2, status: 'PENDING' } };
    if (path.endsWith('/validation')) { if (failValidation) { failValidation = false; return { status: 503 }; } return { body: { ...body, id: 1 } }; }
    if (path === '/api/study-rooms') {
      room = { id: 'fixture-room', name: body.name, inviteCode: 'ABCDEFGHIJ', host: true, ownerId: 101, phase: 'FOCUS', timerStatus: 'PAUSED',
        remainingSeconds: 1500, endsAt: null, serverNow: new Date().toISOString(), version: 1, members: [] };
      return { body: room };
    }
    if (path.endsWith('/heartbeat')) return { body: room };
    return { status: 404 };
  }
  if (path === '/api/profile') return { body: { id: 101, username: 'fixture-student', presentationName: 'Fixture Student', bio: 'Fixture biography' } };
  if (path === '/api/profile/avatar') return { status: 404 };
  if (path === '/users/101/goals') { reads.goals++; return { body: makePage(goals) }; }
  if (path === '/users/3/goals') return { body: makePage([{ id: 4, topic: 'Partner algebra', completed: false, frequency: 2, duration: 25 }]) };
  if (path === '/api/goals/4/daily-records') return { body: makePage([{ id: 11, date: '2026-11-08', note: 'Fixture record', photoAvailable: false, voiceAvailable: false }]) };
  if (path === '/api/goals/4/daily-records/11') return { body: { id: 11, date: '2026-11-08', note: 'Fixture record', photoAvailable: false, voiceAvailable: false } };
  if (path.endsWith('/validation')) return { status: 404 };
  if (path === '/users/search') return { body: makePage([partner]) };
  if (path === '/api/tracking-links/active') { reads.partners++; return { body: makePage([link]) }; }
  if (path === '/api/tracking-links') { reads.history++; return { body: makePage([link]) }; }
  if (path === '/api/tracking-links/pending') return { body: makePage([]) };
  if (path.includes('/notifications')) return { body: { ...makePage([{ id: 11, type: 'DAILY_RECORD_CREATED', message: 'Fixture review request',
    relatedGoalId: 4, relatedDailyRecordId: 11, createdAt: '2026-11-08T12:00:00Z', read: true }]), totalElements: 4 } };
  if (path === '/api/study-rooms') { reads.rooms++; return { body: room ? [room] : [] }; }
  if (path === '/api/study-rooms/fixture-room') return { body: room };
  if (path === '/api/focus-sessions/stats') {
    const days = Number(url.searchParams.get('days'));
    const daily = Array.from({ length: days }, (_, index) => ({ date: new Date(Date.UTC(2026, 10, index + 1)).toISOString().slice(0, 10), minutes: index === 0 ? 25 : 0, sessions: index === 0 ? 1 : 0 }));
    return { body: { days, timeZone: 'America/Lima', studyStreak: 2, verifiedPeriod: { minutes: 25, sessions: 1, daily } } };
  }
  if (path === '/api/study/history') return { body: makePage([]) };
  return { status: 404 };
} });
const has = label => `!!document.querySelector('[aria-label="${label}"]')`;
const inModal = expression => `(() => { const modal=document.querySelector('[aria-modal="true"]');return !!modal && (${expression});})()`;
async function cancel() { await browser.click('Cancel creation'); await browser.wait(`!document.querySelector('[aria-label="Cancel creation"]')`); }
async function pressIcon(label, id) {
  await browser.wait(`Array.from(document.querySelectorAll('[aria-label="${label}"]')).some(el=>{const r=el.getBoundingClientRect();return !el.closest('[aria-hidden="true"]')&&r.left>=0&&r.right<=innerWidth+1;})`);
  const target = await browser.evaluate(`(() => {const row=Array.from(document.querySelectorAll('[aria-label="${label}"]')).find(el=>!el.closest('[aria-hidden="true"]')&&el.getBoundingClientRect().left>=0);const r=row.getBoundingClientRect();return {x:r.left+20,y:r.top+r.height/2,before:getComputedStyle(row.querySelector('[data-testid="${id}"]')).transform};})()`);
  await browser.command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y });
  await browser.command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x: target.x, y: target.y });
  await new Promise(resolve => setTimeout(resolve, 65));
  const after = await browser.evaluate(`(() => {const row=Array.from(document.querySelectorAll('[aria-label="${label}"]')).find(el=>!el.closest('[aria-hidden="true"]')&&el.getBoundingClientRect().left>=0);return getComputedStyle(row.querySelector('[data-testid="${id}"]')).transform;})()`);
  await browser.command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x: target.x, y: target.y });
  return target.before !== after;
}
try {
  await browser.command('Page.addScriptToEvaluateOnNewDocument', { source: `window.addEventListener('error', event => { window.__runtimeFailure = event.error?.stack || event.message; });` });
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.navigate('/'); await browser.wait(has('Username'));
  await browser.fill('[aria-label="Username"]', 'fixture-student'); await browser.fill('[aria-label="Password"]', 'Fixture-password-1');
  await browser.click('Sign in'); await browser.wait(has('Create a goal'));
  await browser.click('Create a goal'); await browser.wait(inModal(`modal.innerText.includes('New Goal')`));
  assert.equal(await browser.evaluate(inModal(`modal.innerText.includes('Completed') || modal.innerText.includes('Your goals') || modal.innerText.includes('Existing completed goal')`)), false);
  assert.equal(writes.length, 0);
  await browser.fill('[aria-label="Topic"]', 'Created fixture goal');await browser.click('Fácil · Alegre');
  holdGoal = true; await browser.click('Create goal');
  for (let index = 0; !finishGoal && index < 100; index++) await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(finishGoal); assert.equal(writes[0].body.completed, false);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Cancel creation"]').getAttribute('aria-disabled')`), 'true');
  finishGoal(); await browser.wait(inModal(`modal.innerText.includes('Fixture validation error')`)); holdGoal = false;
  await browser.click('Create goal'); await browser.wait(`!document.querySelector('[aria-label="Cancel creation"]')`);
  await browser.wait(`document.body.innerText.includes('Created fixture goal')`); assert.ok(reads.goals >= 2);
  await browser.click('Tracking'); await browser.wait(has('Send a tracking request')); await browser.click('Send a tracking request');
  await browser.wait(has('Search study partners'));
  assert.equal(await browser.evaluate(inModal(`modal.innerText.includes('All tracking links') || modal.innerText.includes('Active partners')`)), false);
  await browser.fill('[aria-label="Search study partners"]', 'partner'); await browser.wait(`document.querySelector('[aria-modal="true"]').innerText.includes('@partner')`);
  await browser.click('Select tracking partner partner'); await browser.click('Send tracking request');
  await browser.wait(`!document.querySelector('[aria-label="Cancel creation"]')`); assert.ok(reads.history >= 2);
  await browser.click('Validations'); await browser.wait(has('Start a validation')); await reviewNativeModule(browser, '74b-validations-partner'); await browser.click('Start a validation');
  await browser.wait(has('Cancel creation'));
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Continue"]').getAttribute('aria-disabled')`), 'true');
  await browser.click('Review goals from partner'); await browser.click('Continue');
  await browser.wait(has('View records for Partner algebra')); await browser.click('View records for Partner algebra'); await browser.click('Continue');
  await browser.wait(has('Review record 2026-11-08')); await browser.click('Review record 2026-11-08'); await browser.click('Continue');
  await browser.wait(`document.querySelector('[aria-modal="true"]').innerText.includes('Review evidence')`);
  assert.equal(await browser.evaluate(`!!document.querySelector('[aria-modal="true"] [aria-label="Approve"]') && getComputedStyle(document.querySelector('[aria-label="Approve"]').parentElement).display !== 'none'`), false);
  await reviewNativeModule(browser, '74b-validations-evidence');
  await browser.click('Continue'); await browser.wait(has('Review decision')); await browser.click('Approve');
  await browser.fill('[aria-label="Comment (optional)"]', 'Retain this review draft');
  await browser.click('Previous step'); await browser.wait(`document.querySelector('[aria-modal="true"]').innerText.includes('Review evidence')`);
  await browser.click('Continue'); await browser.wait(has('Review decision'));
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Comment (optional)"]').value`), 'Retain this review draft');
  assert.equal(writes.filter(w => w.path.endsWith('/validation')).length, 0);
  await browser.click('Review decision'); await browser.wait(has('Create validation'));
  assert.equal(writes.filter(w => w.path.endsWith('/validation')).length, 0);
  await reviewNativeModule(browser, '74b-validations-confirm');
  await browser.click('Create validation'); await browser.wait(`document.body.innerText.includes('The server is temporarily unavailable')`);
  await browser.click('Edit decision'); assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Comment (optional)"]').value`), 'Retain this review draft');
  await browser.click('Review decision'); await browser.click('Create validation'); await browser.wait(`!document.querySelector('[aria-label="Cancel creation"]')`);
  assert.deepEqual(writes.filter(w=>w.path.endsWith('/validation')).map(w=>[w.path,w.body]), Array(2).fill(['/api/goals/4/daily-records/11/validation',{approved:true,comment:'Retain this review draft'}]));
  await browser.click('Study Rooms'); await browser.wait(has('Create a study room')); await browser.click('Create a study room');
  await browser.wait(has('Room name'));
  assert.equal(await browser.evaluate(inModal(`modal.innerText.includes('Join friends') || modal.innerText.includes('Your rooms')`)), false);
  await browser.fill('[aria-label="Room name"]', 'Created fixture room'); await browser.click('Create room');
  await browser.wait(`!document.querySelector('[aria-label="Cancel creation"]')`); await browser.wait(`document.body.innerText.includes('Created fixture room')`);
  await browser.click('All rooms'); assert.ok(reads.rooms >= 2);
  await browser.click('Open menu'); await browser.wait(has('Resources'));
  await browser.wait(`Array.from(document.querySelectorAll('[aria-label="Resources"]')).some(el=>el.getBoundingClientRect().left>=0)`);
  assert.equal(await browser.evaluate(`document.querySelectorAll('[data-testid="unread-badge"]').length`), 1);
  const menuImage = await browser.command('Page.captureScreenshot', { format: 'png' }); writeFileSync('.expo/polish-drawer.png', Buffer.from(menuImage.data, 'base64'));
  assert.equal(await pressIcon('Resources', 'icon-page'), true, 'The individual page visibly transforms on press.');
  await browser.waitForDrawerClosed();
  assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('[role="button"]')).some(el=>!el.closest('[aria-hidden="true"]')&&/^‹ (Back|Home)$/.test(el.innerText))`), false);
  await browser.click('Open menu'); await browser.click('Settings'); await browser.wait(has('Light')); await browser.click('Light'); await browser.click('Purple');
  await browser.evaluate('document.activeElement?.blur()');
  const settingsImage = await browser.command('Page.captureScreenshot', { format: 'png' }); writeFileSync('.expo/polish-settings.png', Buffer.from(settingsImage.data, 'base64'));
  await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);
  await browser.evaluate('history.back()'); await browser.wait(has('Open menu')); await browser.click('Open menu'); await browser.wait(has('Dismiss menu'));
  assert.equal(await pressIcon('Notifications', 'icon-notifications-motion'), false, 'Reduced motion keeps the bell static.');
  await browser.wait(`!document.querySelector('[aria-label="Dismiss menu"]')`);
  await browser.wait(has('Review new record')); await browser.click('Review new record');
  await browser.wait(`location.pathname.includes('/records/11') && location.search.includes('review=1')`);
  await browser.wait(`document.body.innerText.includes('Review this record')`);
  await browser.evaluate('history.back()'); await browser.wait(`location.pathname.includes('notifications')`);
  await browser.click('Open menu'); await browser.click('Dashboard'); await browser.wait(`!!document.querySelector('[aria-label^="Bar chart"]')`); await browser.waitForDrawerClosed();
  assert.equal(await browser.evaluate(has('Refresh activity')), false);
  await browser.click('Lines'); await browser.wait(`!!document.querySelector('[aria-label^="Line chart"]')`);
  await browser.click('30 days'); await browser.wait(`!!document.querySelector('[aria-label^="Line chart, 30 days"]')`);
  for (const width of [320, 390, 768, 1440]) { await browser.command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true }); await browser.wait('document.documentElement.scrollWidth <= innerWidth'); }
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const dashboardImage = await browser.command('Page.captureScreenshot', { format: 'png' }); writeFileSync('.expo/polish-dashboard.png', Buffer.from(dashboardImage.data, 'base64'));
  assert.ok(writes.some(write => write.path.endsWith('/validation') && write.body.approved === true));
  assert.deepEqual(browser.errors, []);
  process.stdout.write('Polish browser checks passed: dedicated creation, confirmed fixture writes, nested Back, compact UI, page animation, reduced motion and responsive.\n');
} catch (error) {
  writeFileSync('.expo/polish-failure.json', JSON.stringify({ text: await browser.evaluate('document.body.innerText'), paths: writes.map(write => write.path), errors: browser.errors, runtime: await browser.evaluate('window.__runtimeFailure') })); throw error;
} finally { finishGoal?.(); await browser.close(); }
