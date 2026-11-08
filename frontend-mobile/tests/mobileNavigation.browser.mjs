// Run from frontend-mobile after exporting to .expo/integration-export.
// Every request outside the local Expo renderer is intercepted with fixtures.
import assert from 'node:assert/strict';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const claims = { type: 'access', userId: 101, sub: 'fixture-student', email: 'fixture@example.invalid', role: 'USER',
  exp: Math.floor(Date.now() / 1000) + 3600 };
const tokens = { token: `fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`, refreshToken: 'fixture-only' };
const mutations = [];
const page = { content: [], empty: true, totalElements: 0, totalPages: 0, number: 0, size: 10, last: true };
const browser = await mobileBrowser({ intercept: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/login') return { body: tokens };
  if (request.method !== 'GET') { mutations.push(path); return { status: 500 }; }
  if (path === '/api/profile') return { body: { id: 101, username: 'fixture-student', presentationName: 'Fixture Student', bio: 'Fixture biography' } };
  if (path === '/api/profile/avatar') return { status: 404 };
  if (path === '/api/study-rooms') return { body: [] };
  if (path === '/api/tracking-links/active') return { body: page };
  if (path.includes('/notifications')) return { body: { ...page, totalElements: 3 } };
  if (path.includes('/goals') || path.startsWith('/api/tracking-links')) return { body: page };
  return { status: 404 };
} });
const has = label => `!!document.querySelector('[aria-label="${label}"]')`;
try {
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.navigate('/'); await browser.wait(has('Username'));
  await browser.fill('[aria-label="Username"]', 'fixture-student');
  await browser.fill('[aria-label="Password"]', 'Fixture-password-1');
  await browser.click('Sign in'); await browser.wait(has('Create a goal'));
  await browser.click('Create a goal'); await browser.wait(`document.body.innerText.includes('Create goal')`);
  assert.equal(await browser.evaluate('Array.from(document.querySelectorAll("[role=tab]")).filter(el => el.getClientRects().length && !el.closest("[aria-hidden=true]")).length'), 0);
  await browser.click('Cancel'); await browser.wait(has('Tracking'));
  await browser.click('Tracking'); await browser.wait(has('Send a tracking request'));
  await browser.click('Send a tracking request'); await browser.wait(has('Search study partners'));
  await browser.click('Close request form'); await browser.wait(has('Validations'));
  await browser.click('Validations'); await browser.wait(has('Start a validation'));
  await browser.click('Start a validation'); await browser.wait(`document.body.innerText.includes('Choose a tracking partner below')`);
  await browser.click('Close validation flow'); await browser.wait(has('Study Rooms'));
  await browser.click('Study Rooms'); await browser.wait(has('Create a study room'));
  await browser.click('Create a study room'); await browser.wait(has('Room name'));
  await browser.click('Cancel creation'); await browser.wait(has('Create a study room'));
  assert.deepEqual(mutations, []);
  for (const width of [320, 390, 768]) {
    await browser.command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.equal(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  }
  await browser.click('Open menu'); await browser.wait(has('Open your profile, Fixture Student'));
  await browser.click('Open your profile, Fixture Student'); await browser.wait(`document.body.innerText.includes('Fixture biography')`);
  assert.equal(await browser.evaluate('Array.from(document.querySelectorAll("[role=tab]")).filter(el => el.getClientRects().length && !el.closest("[aria-hidden=true]")).length'), 0);
  await browser.evaluate('history.back()'); await browser.wait(has('Open menu'));
  await browser.click('Open menu'); await browser.wait(has('Notifications (3 unread)'));
  await browser.click('Notifications (3 unread)'); await browser.wait(`location.pathname.includes('notifications')`);
  await browser.click('Open menu'); await browser.wait(has('Menu')); await browser.click('Menu');
  await browser.wait(has('Create a study room')); // Menu remembers the selected tab.
  assert.deepEqual(mutations, []);
  assert.deepEqual(browser.errors, []);
  process.stdout.write('Navigation browser checks passed: contextual forms, tab history, drawer, profile, badge, Back, 320–768px.\n');
} finally { await browser.close(); }
