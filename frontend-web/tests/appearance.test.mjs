import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const bootstrap = readFileSync(new URL('../public/appearance.js', import.meta.url), 'utf8');
const KEY = 'studystreak:appearance:v1';
function boot(saved, denied = false) {
  const values = new Map([['pomodoro-existing', 'unchanged']]);
  if (saved !== undefined) values.set(KEY, saved);
  const context = { window: {}, document: { documentElement: { dataset: {} } }, localStorage: {
    getItem(key) { if (denied) throw Error('Denied'); return values.get(key) ?? null; },
    setItem(key, value) { if (denied) throw Error('Denied'); values.set(key, value); },
  } };
  runInNewContext(bootstrap, context);
  return { api: context.window.studyStreakAppearance, root: context.document.documentElement.dataset, values };
}
const plain = value => JSON.parse(JSON.stringify(value));

test('fresh appearance defaults to Neutral/System before React and leaves other preferences intact', () => {
  const { api, root, values } = boot();
  assert.deepEqual(plain(api.read()), { mode: 'system', background: 'neutral', accent: 'mint', reduceMotion: false });
  assert.deepEqual(root, { theme: 'system', background: 'neutral', accent: 'mint', motion: 'system' });
  assert.equal(values.get('pomodoro-existing'), 'unchanged');
});

test('malformed, old and invalid preferences safely use known values', () => {
  for (const raw of ['broken', 'null', '[]', '3', '{"theme":"sunset","mode":"retro","accent":"red","reduceMotion":"false"}']) {
    const { api } = boot(raw);
    assert.deepEqual(plain(api.read()), { mode: 'system', background: 'neutral', accent: 'mint', reduceMotion: false });
  }
});

test('all modes and accents round-trip without saving arbitrary fields', () => {
  for (const mode of ['dark', 'light', 'system']) for (const accent of ['mint', 'blue', 'purple', 'orange']) {
    const { api, root } = boot();
    const preferences = { mode, background: 'sage', accent, reduceMotion: true };
    assert.equal(api.save({ ...preferences, unrelated: 'discard' }), true);
    api.apply(api.read());
    assert.deepEqual(plain(api.read()), preferences);
    assert.deepEqual(root, { theme: mode, background: 'sage', accent, motion: 'reduce' });
  }
});

test('unavailable storage never prevents appearance changes for the current visit', () => {
  const { api, root } = boot(undefined, true);
  assert.equal(api.save({ mode: 'light', accent: 'blue' }), false);
  api.apply({ mode: 'light', accent: 'blue' });
  assert.deepEqual(root, { theme: 'light', background: 'neutral', accent: 'blue', motion: 'system' });
});

test('bootstrap and blocking CSS are loaded before the application entry', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('/appearance.js') < html.indexOf('/src/index.css'));
  assert.ok(html.indexOf('/src/index.css') < html.indexOf('/src/main.tsx'));
  assert.doesNotMatch(html.match(/<script[^>]*appearance\.js[^>]*>/)[0], /async|defer|module/);
});

const { createServer } = await import('vite');
const { spawn, spawnSync } = await import('node:child_process');
const { mkdtempSync } = await import('node:fs');
const { rm } = await import('node:fs/promises');
const { tmpdir } = await import('node:os');
const { join } = await import('node:path');
const chrome = [process.env.STUDYSTREAK_CHROME_BIN, 'google-chrome', 'chromium', 'chromium-browser']
  .filter(Boolean).find(binary => spawnSync(binary, ['--version'], { timeout: 2000 }).status === 0);

// Presentation fixtures only. All API traffic is intercepted; no real login,
// backend, database, media connection or study-session write is performed.
test('Chrome: global appearance, first paint, routes, contrast and accessibility', {
  timeout: 120000, skip: chrome ? false : 'Chrome unavailable; set STUDYSTREAK_CHROME_BIN',
}, async () => {
  const live = await createServer({ server: { host: '127.0.0.1', port: 0, hmr: false, watch: null } });
  await live.listen();
  const origin = `http://127.0.0.1:${live.httpServer.address().port}`;
  const profile = mkdtempSync(join(tmpdir(), 'studystreak-appearance-'));
  const browser = spawn(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-background-networking', '--disable-sync', '--no-first-run', `--user-data-dir=${profile}`,
    '--remote-debugging-pipe', 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let nextId = 0, buffer = '', heldEntry, holdEntry = true, loaded;
  const pending = new Map(), runtimeErrors = [], writes = [];
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`Chrome timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve, reject, timer, method });
    browser.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
  browser.stdio[4].setEncoding('utf8');
  browser.stdio[4].on('data', chunk => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\0')) !== -1) {
      const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      if (message.method === 'Page.loadEventFired') loaded?.();
      if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
      if (message.method === 'Fetch.requestPaused') {
        const { request, requestId } = message.params;
        const url = new URL(request.url);
        if (url.origin === origin) {
          if (holdEntry && url.pathname === '/src/main.tsx') heldEntry = { requestId, sessionId: message.sessionId };
          else void send('Fetch.continueRequest', { requestId }, message.sessionId).catch(() => {});
        } else {
          if (!['GET', 'OPTIONS'].includes(request.method)) writes.push(request.method);
          let body;
          if (url.pathname.endsWith('/api/focus-sessions/stats')) {
            const days = Number(url.searchParams.get('days') || 7);
            const daily = Array.from({ length: days }, (_, i) => ({ date: new Date(Date.UTC(2026, 10, 7 - days + 1 + i)).toISOString().slice(0, 10), minutes: i === days - 1 ? 25 : 0, sessions: i === days - 1 ? 1 : 0 }));
            body = { days, timeZone: 'UTC', daily, verifiedPeriod: { minutes: 25, sessions: 1, daily }, totalMinutes: 25, completedSessions: 1, periodMinutes: 25, periodSessions: 1, verifiedMinutes: 25, estimatedMinutes: 0, individualMinutes: 25, groupMinutes: 0, groupSessions: 0, previousMinutes: 0, changePercent: null, completionPercent: 100, averageMinutes: 25 / days, activeDays: 1, studyStreak: 1, bestStudyStreak: 1, weekMinutes: 25, bestDayMinutes: 25, activity: daily, hourly: [], weekly: [], monthly: [], byGoal: [] };
          } else if (url.pathname.endsWith('/goals') || url.pathname.endsWith('/history')) body = { content: [], last: true, totalPages: 0, totalElements: 0 };
          else if (url.pathname.includes('unread')) body = 0;
          if (body !== undefined) {
            void send('Fetch.fulfillRequest', { requestId, responseCode: 200,
              responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Headers', value: 'authorization, content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET' }],
              body: Buffer.from(JSON.stringify(body)).toString('base64'),
            }, message.sessionId).catch(() => {});
          } else void send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }, message.sessionId).catch(() => {});
        }
      }
      const request = pending.get(message.id);
      if (request) { pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(Error(`${request.method}: ${JSON.stringify(message.error)}`)) : request.resolve(message.result); }
    }
  });
  try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const command = (method, params) => send(method, params, sessionId);
    const evaluate = async expression => {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
      assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const wait = async expression => {
      for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 50)); }
      throw Error(`Condition timed out: ${expression}`);
    };
    const pageLoaded = () => new Promise(resolve => { loaded = resolve; });
    const navigate = async path => {
      const complete = pageLoaded();
      await command('Page.navigate', { url: origin + path });
      await complete;
      await wait('!!document.querySelector("h1")');
    };
    const choose = async (name, value) => {
      if (name === 'display-mode') {
        const system = await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked') === 'true'`);
        if (value === 'system') {
          if (!system) await evaluate(`document.querySelector('[role="switch"]').click()`);
          await wait(`document.querySelector('[role="switch"]').getAttribute('aria-checked') === 'true'`);
          return;
        }
        if (system) {
          await evaluate(`document.querySelector('[role="switch"]').click()`);
          await wait(`document.querySelector('[role="switch"]').getAttribute('aria-checked') === 'false'`);
        }
      }
      await evaluate(`document.querySelector('input[name="${name}"][value="${value}"]').click()`);
      await wait(`document.querySelector('input[name="${name}"][value="${value}"]').checked`);
    };
    const key = async (key, code = key) => {
      const windowsVirtualKeyCode = { Tab: 9, Escape: 27, Enter: 13, ArrowRight: 39, ' ': 32 }[key];
      await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, ...(key === 'Enter' ? { text: '\r' } : {}) });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
    };
    await command('Page.enable'); await command('Runtime.enable');
    await command('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
    const payload = { type: 'access', exp: Math.floor(Date.now() / 1000) + 3600, userId: 999999, sub: 'appearance_fixture_with_a_very_long_username_for_layout_checks', email: 'appearance_fixture_with_a_very_long_email_address@example.invalid', role: 'USER' };
    const fixtureToken = `fixture.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`;
    await command('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('accessToken', ${JSON.stringify(fixtureToken)}); if (!localStorage.getItem('${KEY}')) localStorage.setItem('${KEY}', JSON.stringify({mode:'light',accent:'blue',reduceMotion:false}));` });
    const firstLoaded = pageLoaded();
    await command('Page.navigate', { url: origin + '/settings' });
    await wait(`!!document.getElementById('root') && document.documentElement?.dataset.theme === 'light' && getComputedStyle(document.documentElement).backgroundColor === 'rgb(244, 241, 248)'`);
    assert.equal(await evaluate('document.getElementById("root").children.length'), 0, 'Appearance must apply before React loads');
    holdEntry = false;
    assert.ok(heldEntry, 'Entry should still be blocked for the first-paint check');
    await send('Fetch.continueRequest', { requestId: heldEntry.requestId }, heldEntry.sessionId);
    await firstLoaded;
    await wait('!!document.querySelector("input[name=display-mode]")');
    await command('Page.bringToFront');

    assert.equal(await evaluate('document.querySelectorAll("input[name=display-mode]").length'), 2);
    assert.equal(await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`), 'false');
    const samples = await evaluate(`([...document.querySelectorAll('input[name="display-mode"]')].map(input => {
      const frame = input.nextElementSibling, sample = frame.firstElementChild;
      const r = frame.getBoundingClientRect();
      return { mode: input.value, width: r.width, height: r.height, background: getComputedStyle(sample).backgroundColor };
    }))`);
    assert.deepEqual(samples.map(s => [s.width, s.height]), [[80,80],[80,80]]);
    assert.deepEqual(samples.map(s => s.background), ['rgb(33, 27, 48)','rgb(244, 241, 248)'], 'Both previews represent their own mode');
    const swatches = await evaluate(`([...document.querySelectorAll('input[name="accent-palette"]')].map(input => {
      const frame = input.nextElementSibling, r = frame.getBoundingClientRect();
      return { color: getComputedStyle(frame.firstElementChild).backgroundColor, width:r.width, height:r.height };
    }))`);
    assert.equal(new Set(swatches.map(s => s.color)).size, 4, 'Each palette has a different visible swatch');
    assert.ok(swatches.every(s => s.width === 48 && s.height === 48));
    const tokenAudit = `(() => {
      const probe = document.createElement('span'); document.body.append(probe);
      const rgb = variable => { probe.style.color = 'var(' + variable + ')'; const canvas=document.createElement('canvas'); const c=canvas.getContext('2d'); c.fillStyle=getComputedStyle(probe).color; c.fillRect(0,0,1,1); return [...c.getImageData(0,0,1,1).data].slice(0,3); };
      const luminance = color => color.map(v => {v/=255; return v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const contrast = (a,b) => {const x=luminance(rgb(a)), y=luminance(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
      const pairs = [['--ss-text','--ss-background'],['--ss-text-muted','--ss-surface'],['--ss-accent','--ss-surface'],['--ss-on-accent','--ss-accent'],['--ss-on-accent','--ss-accent-hover'],['--ss-danger','--ss-danger-surface'],['--ss-success','--ss-success-surface'],['--ss-warning','--ss-warning-surface']];
      const result = { text: pairs.map(([a,b])=>({a,b,ratio:contrast(a,b)})), border:contrast('--ss-border-strong','--ss-surface'), accentRgb:rgb('--ss-accent'), success:rgb('--ss-success'), background:rgb('--ss-background') }; probe.remove(); return result;
    })()`;
    const reports = [];
    for (const mode of ['dark', 'light']) for (const accent of ['mint', 'blue', 'purple', 'orange']) {
      await choose('display-mode', mode); await choose('accent-palette', accent);
      const report = await evaluate(tokenAudit);
      for (const pair of report.text) assert.ok(pair.ratio >= 4.5, `${mode}/${accent}: ${JSON.stringify(pair)}`);
      assert.ok(report.border >= 3, `${mode}/${accent} control borders`);
      reports.push({ mode, accent, ...report });
    }
    assert.equal(new Set(reports.filter(r=>r.mode==='light').map(r=>JSON.stringify(r.success))).size, 1, 'Success color is independent of accent');
    assert.equal(new Set(reports.filter(r=>r.mode==='light').map(r=>JSON.stringify(r.accentRgb))).size, 4);
    await choose('display-mode', 'system');
    await navigate('/settings');
    assert.equal(await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`), 'true', 'Device theme survives reload');
    assert.equal(await evaluate('document.querySelectorAll("input[name=display-mode]:disabled").length'), 2);
    for (const scheme of ['light','dark']) {
      await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
      await wait(`document.body.textContent.includes('Currently using ${scheme} appearance from your system')`);
      const actual = await evaluate(tokenAudit);
      assert.deepEqual(actual.background, reports.find(r=>r.mode===scheme && r.accent==='orange').background);
      assert.equal(await evaluate(`document.querySelector('input[name="display-mode"]:checked').value`), scheme, 'Square shows the effective device mode');
    }
    await evaluate(`document.querySelector('[role="switch"]').focus()`);
    await key('Enter');
    await wait(`document.querySelector('[role="switch"]').getAttribute('aria-checked') === 'false'`);
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark', 'Disabling device mode retains its effective theme');
    assert.equal(await evaluate('document.querySelectorAll("input[name=display-mode]:disabled").length'), 0);
    await evaluate(`document.querySelector('input[name="display-mode"][value="dark"]').focus()`);
    await key('ArrowRight');
    await wait('document.documentElement.dataset.theme === "light"');
    await evaluate(`document.querySelector('input[name="accent-palette"][value="mint"]').focus()`);
    await key('ArrowRight');
    await wait('document.documentElement.dataset.accent === "blue"');
    await choose('display-mode', 'light'); await choose('accent-palette', 'blue');
    await evaluate('Array.from(document.querySelectorAll("label")).find(e=>e.textContent.trim()==="Always reduce motion").querySelector("input").click()');
    await wait('document.documentElement.dataset.motion === "reduce"');
    await navigate('/settings');
    assert.equal(await evaluate('Array.from(document.querySelectorAll("label")).find(e=>e.textContent.trim()==="Always reduce motion").querySelector("input").checked'), true);
    assert.equal(await evaluate('document.querySelector("input[value=blue]").checked'), true);
    assert.equal(await evaluate('getComputedStyle(document.querySelector("button")).transitionDuration'), '0s');
    await evaluate('Array.from(document.querySelectorAll("label")).find(e=>e.textContent.trim()==="Always reduce motion").querySelector("input").click()');
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await wait('document.body.textContent.includes("Reduced motion is active.")');
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await wait('document.body.textContent.includes("Standard motion is active.")');
    for (const width of [320,390,768,1440]) {
      await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Settings overflow at ${width}`);
    }
    await evaluate('document.querySelector("input[value=dark]").focus()');
    await key('Tab');
    assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineWidth'), '2px');
    assert.equal(await evaluate('document.activeElement.matches(":focus-visible")'), true);
    assert.equal(await evaluate('getComputedStyle(document.activeElement.nextElementSibling).outlineWidth'), '2px');

    const checkUserPanel = async () => {
      const panel = await evaluate(`(() => {
        const panel=[...document.querySelectorAll('[aria-label="User panel"]')].find(e=>e.checkVisibility());
        const gear=panel.querySelector('a[aria-label="Open settings"]'), p=panel.getBoundingClientRect(), g=gear.getBoundingClientRect();
        return { name:gear.getAttribute('aria-label'), tooltip:gear.title, href:gear.getAttribute('href'), width:g.width, height:g.height, inside:g.x>=p.x && g.right<=p.right, overflow:panel.scrollWidth>panel.clientWidth, user:panel.querySelector('[title]').textContent, email:panel.querySelectorAll('p')[1].textContent };
      })()`);
      assert.equal(panel.name,'Open settings'); assert.equal(panel.tooltip,'Settings'); assert.equal(panel.href,'/settings');
      assert.equal(panel.width,44); assert.equal(panel.height,44); assert.ok(panel.inside && !panel.overflow);
      assert.equal(panel.user,payload.sub); assert.equal(panel.email,payload.email);
    };
    await checkUserPanel();
    await navigate('/dashboard');
    await evaluate(`document.querySelector('a[aria-label="Open settings"]').focus()`);
    await key('Tab');
    await evaluate(`document.querySelector('a[aria-label="Open settings"]').focus()`);
    assert.equal(await evaluate(`getComputedStyle(document.activeElement).outlineWidth`),'2px');
    await key('Enter');
    await wait('location.pathname === "/settings" && !!document.querySelector("input[name=display-mode]")');
    await command('Emulation.setDeviceMetricsOverride',{width:320,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate(`document.querySelector('[aria-label="Toggle navigation"]').click()`);
    await wait(`!![...document.querySelectorAll('[aria-label="User panel"]')].find(e=>e.checkVisibility())`);
    await checkUserPanel();
    await evaluate(`[...document.querySelectorAll('a[aria-label="Open settings"]')].find(e=>e.checkVisibility()).click()`);
    await wait(`document.querySelector('[aria-label="Toggle navigation"]').getAttribute('aria-expanded') === 'false'`);
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
    await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    const routes = ['/', '/login', '/register', '/dashboard', '/focus-studio', '/goals', '/resources', '/tracking-links', '/validations', '/notifications', '/study-rooms'];
    for (const route of routes) {
      console.log(`Appearance route: ${route}`);
      await navigate(route);
      // M4d sends an existing session away from public auth routes; guest forms are covered by authScenes.
      if (['/', '/login', '/register'].includes(route)) await wait(`location.pathname === "/dashboard" && !!document.querySelector('[aria-label="Recorded study statistics"]')`);
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".min-h-screen")).backgroundColor'), await evaluate(`'rgb(244, 241, 248)'`), route);
      assert.equal(await evaluate('document.documentElement.dataset.accent'), 'blue', route);
      assert.equal(await evaluate('getComputedStyle(document.querySelector("h1")).color'), 'rgb(15, 23, 42)', route);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${route} desktop overflow`);
      if (route === '/dashboard') {
        await wait('!!document.querySelector(".recharts-bar-rectangle path")');
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".recharts-bar-rectangle path")).fill'), 'rgb(29, 78, 216)');
      }
      if (route === '/focus-studio') {
        await evaluate(`document.querySelector('[aria-label="Pomodoro settings"]').click()`);
        await wait('document.querySelector("dialog")?.open');
        assert.equal(await evaluate('getComputedStyle(document.querySelector("dialog")).backgroundColor'), 'rgb(255, 255, 255)');
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('svg[viewBox="0 0 250 250"] circle:last-child')).stroke`), 'rgb(29, 78, 216)');
        await key('Escape');
      }
    }
    // Follow the existing user-navigation entry; preference survives client routing.
    await evaluate(`document.querySelector('a[href="/settings"]').click()`);
    await wait('!!document.querySelector("input[name=display-mode]")');
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light');
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Restore default appearance')).click()`);
    await wait('document.documentElement.dataset.theme === "system" && document.documentElement.dataset.background === "neutral" && document.documentElement.dataset.accent === "mint"');
    assert.equal(await evaluate('Array.from(document.querySelectorAll("label")).find(e=>e.textContent.trim()==="Always reduce motion").querySelector("input").checked'), false);
    for (const path of ['/login', '/dashboard', '/focus-studio']) {
      await navigate(path);
      if (path === '/login') await wait('location.pathname === "/dashboard"');
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".min-h-screen")).backgroundColor'), await evaluate(`'rgb(32, 36, 42)'`), path);
    }
    await navigate('/settings');
    // Storage denial is reported truthfully while preferences still apply.
    await evaluate(`Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new Error('Test storage denial'); }, configurable: true }); void 0`);
    await choose('accent-palette', 'purple');
    await wait('document.body.textContent.includes("Browser storage is unavailable")');
    assert.equal(await evaluate('document.documentElement.dataset.accent'), 'purple');
    await evaluate(`Array.from(document.querySelectorAll('aside button')).find(e=>e.textContent.trim()==='Sign out').click()`);
    await wait('location.pathname === "/login" && !!document.querySelector("form")');
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".auth-content h1")).color'), 'rgb(241, 245, 249)');
    assert.equal(await evaluate('sessionStorage.getItem("accessToken")'), null, 'Sidebar uses the existing sign-out mechanism');
    assert.deepEqual(runtimeErrors, []);
    assert.deepEqual(writes, []);
    console.log(`Appearance: ${reports.length} theme/accent pairs; minimum text contrast ${Math.min(...reports.flatMap(r=>r.text.map(t=>t.ratio))).toFixed(2)}:1; minimum control border ${Math.min(...reports.map(r=>r.border)).toFixed(2)}:1; ${routes.length} real routes; responsive 320–1440 px.`);
  } finally {
    if (browser.exitCode === null && browser.signalCode === null) { const stopped = new Promise(resolve=>browser.once('exit',resolve)); await send('Browser.close'); await stopped; }
    for (const request of pending.values()) clearTimeout(request.timer);
    await live.close();
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
