// Run from frontend-mobile after exporting to .expo/integration-export.
// Every request outside the local Expo renderer is intercepted with fixtures.
import assert from 'node:assert/strict';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const claims = { type: 'access', userId: 101, sub: 'fixture-student', email: 'fixture@example.invalid', role: 'USER',
  exp: Math.floor(Date.now() / 1000) + 3600 };
const tokens = { token: `fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`, refreshToken: 'fixture-only' };
const mutations = [];
const reads=new Map();let heldPath=null,finishRefresh;
const page = { content: [], empty: true, totalElements: 0, totalPages: 0, number: 0, size: 10, last: true };
const browser = await mobileBrowser({ intercept: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/login') return { body: tokens };
  if (request.method !== 'GET') { mutations.push(path); return { status: 500 }; }
  reads.set(path,(reads.get(path)||0)+1);
  if(path===heldPath)await new Promise(resolve=>{finishRefresh=resolve;});
  if (path === '/api/profile') return { body: { id: 101, username: 'fixture-student', presentationName: 'Fixture Student', bio: 'Fixture biography' } };
  if (path === '/api/profile/avatar') return { status: 404 };
  if (path === '/api/study-rooms') return { body: [] };
  if (path === '/api/tracking-links/active') return { body: page };
  if (path.includes('/notifications')) return { body: { ...page, totalElements: 3 } };
  if (path.includes('/goals') || path.startsWith('/api/tracking-links')) return { body: page };
  return { status: 404 };
} });
const has = label => `!!document.querySelector('[aria-label="${label}"]')`;
const refreshElement=`Array.from(document.querySelectorAll('[aria-label="Refresh"]')).find(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`;
let firstAction,firstRefresh;
async function checkAction(label){
 await browser.wait(has(label));await browser.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
 const actual=await browser.evaluate(`(()=>{const glyph=document.querySelector('[data-testid="pixel-goal-action"]'),button=glyph?.parentElement;if(!button)return null;const r=button.getBoundingClientRect(),s=getComputedStyle(button);return{count:document.querySelectorAll('[data-testid="pixel-goal-action"]').length,glyph:glyph.outerHTML,x:r.x,y:r.y,width:r.width,height:r.height,radius:s.borderRadius,background:s.backgroundColor};})()`);
 assert.ok(actual,'Every contextual action must retain the pixel button');assert.equal(actual.count,1);
 if(!firstAction)firstAction=actual;else assert.deepEqual(actual,firstAction,'tab changes must not change shape, colors, position or size');
}
async function checkRefresh(path){
 await browser.wait(`!!(${refreshElement})&&(${refreshElement}).getAttribute('aria-busy')!=='true'`);
 const actual=await browser.evaluate(`(()=>{const e=${refreshElement};return e.innerHTML;})()`);
 assert.match(actual,/icon-reload-motion/);assert.doesNotMatch(actual,/icon-refresh-motion/);
 if(!firstRefresh)firstRefresh=actual;else assert.equal(actual,firstRefresh,'all three screens share the exact same refresh icon');
 for(const width of [320,390,768]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
  await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  assert.equal(await browser.evaluate(`getComputedStyle((${refreshElement}).parentElement).flexDirection`),'row');
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 const before=reads.get(path)||0;heldPath=path;await browser.click('Refresh');
 await browser.wait(`(${refreshElement})?.getAttribute('aria-busy')==='true'`);
 assert.ok((reads.get(path)||0)>before);assert.equal(await browser.evaluate(`(${refreshElement}).getAttribute('aria-disabled')==='true'`),false);
 heldPath=null;finishRefresh();finishRefresh=null;
 await browser.wait(`(${refreshElement})?.getAttribute('aria-busy')!=='true'`);
}
try {
  await browser.command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.navigate('/'); await browser.wait(has('Username'));
  await browser.fill('[aria-label="Username"]', 'fixture-student');
  await browser.fill('[aria-label="Password"]', 'Fixture-password-1');
  await browser.click('Sign in'); await browser.wait(has('Create a goal'));
  await checkRefresh('/users/101/goals');await checkAction('Create a goal');
  await browser.click('Create a goal'); await browser.wait(`document.body.innerText.includes('Create goal')`);
  assert.equal(await browser.evaluate('Array.from(document.querySelectorAll("[role=tab]")).filter(el => el.getClientRects().length && !el.closest("[aria-hidden=true]")).length'), 0);
  await browser.click('Cancel'); await browser.wait(has('Tracking'));
  await browser.click('Tracking'); await browser.wait(has('Send a tracking request'));
  await checkAction('Send a tracking request');
  await browser.click('Send a tracking request'); await browser.wait(has('Search study partners'));
  await browser.click('Cancel creation'); await browser.wait(has('Validations'));
  await browser.click('Validations'); await browser.wait(has('Start a validation'));
  await checkRefresh('/api/tracking-links/active');await checkAction('Start a validation');
  await browser.click('Start a validation'); await browser.wait(`document.body.innerText.includes('New Validation')`);
  await browser.click('Cancel creation'); await browser.wait(has('Study Rooms'));
  await browser.click('Study Rooms'); await browser.wait(has('Create a study room'));
  await checkAction('Create a study room');
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
  await browser.click('Open menu'); await browser.wait(has('Notifications'));
  await browser.click('Notifications'); await browser.wait(`location.pathname.includes('notifications')`);
  const unreadBefore=reads.get('/users/101/notifications/unread')||0;await checkRefresh('/users/101/notifications');assert.ok(reads.get('/users/101/notifications/unread')>unreadBefore);
  await browser.click('Open menu'); await browser.wait(has('Menu')); await browser.click('Menu');
  await browser.wait(has('Create a study room')); // Menu remembers the selected tab.
  assert.deepEqual(mutations, []);
  assert.deepEqual(browser.errors, []);
  process.stdout.write('Navigation passed: identical pixel action/position on all four tabs with original forms, three identical Refresh icons/actions/loading, list+badge, drawer/profile/Back and 320/390/768. Chrome + API fixtures, not physical Android.\n');
} finally { finishRefresh?.();await browser.close(); }
