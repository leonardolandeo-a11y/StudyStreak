import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
after(() => server.close());
const { default: FocusStudio } = await server.ssrLoadModule('/src/components/dashboard/FocusStudio.tsx');
const { SoundscapeCarousel } = await server.ssrLoadModule('/src/components/focus/SoundscapeCarousel.tsx');
const { RecordedSummary } = await server.ssrLoadModule('/src/components/study/RecordedSummary.tsx');
const { FocusDurationDialog } = await server.ssrLoadModule('/src/components/focus/FocusDurationDialog.tsx');
const { newPomodoro } = await server.ssrLoadModule('/src/components/dashboard/pomodoroState.ts');
const { SOUNDSCAPES } = await server.ssrLoadModule('/src/components/dashboard/soundscapes.ts');
const library = props => render(h(SoundscapeCarousel, {
  tracks: SOUNDSCAPES, category: 'all', onCategoryChange() {}, selected: 'dream', playing: false, async onChooseTrack() {}, ...props
}));

test('Focus Studio gives the timer a full-width row, followed by player and goal, sounds without the relocated statistics', () => {
  const html = render(h(MemoryRouter, {}, h(FocusStudio, { userId: 1 })));
  const timer = html.indexOf('aria-label="Pomodoro session timer"');
  const playing = html.indexOf('aria-label="Now playing"');
  const tools = html.indexOf('aria-label="Session tools"');
  const goal = html.indexOf('aria-label="Study goal"');
  const sounds = html.indexOf('id="sound-library-heading"');
  assert.ok(timer >= 0 && timer < tools && tools < playing && playing < goal && goal < sounds);
  assert.match(html, /aria-label="Study goal"/);
  assert.doesNotMatch(html, /Explore your study statistics|Time well spent|Focus study statistics/);
  assert.doesNotMatch(html, /Recorded for this Goal|Session audio|xl:grid-cols-/);
  assert.match(html, /role="timer" aria-live="off" aria-label="25:00 remaining"/);
  assert.match(html, /focus cycles on this device/);
  assert.doesNotMatch(html, /Featured focus mix|Get in the zone/);
  assert.match(html, /aria-label="Pomodoro settings" title="Pomodoro settings" aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /Make it yours|>Aurora<|>Sunset<|>Ocean<|>Customize</);
  assert.ok(html.indexOf('Pomodoro settings') < html.indexOf('role="timer"'), 'Settings stays at the side of the timer header');
});

test('duration dialog preserves interval limits and disables editing while running', () => {
  const props = { onClose() {}, preferences: newPomodoro().preferences, locked: false, onSave() {} };
  const html = render(h(FocusDurationDialog, props));
  assert.match(html, /<dialog[^>]+aria-labelledby=/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /aria-label="Focus minutes" min="5" max="120"/);
  assert.match(html, /aria-label="Short break minutes" min="1" max="30"/);
  assert.match(html, /aria-label="Long break minutes" min="5" max="60"/);
  assert.match(html, /Changing the current interval resets it/);
  assert.equal((render(h(FocusDurationDialog, { ...props, locked: true })).match(/disabled=""/g) || []).length, 4);
  assert.match(html, />Save</);
  assert.match(html, />Cancel</);
  assert.match(html, /Session start, pause and finish sounds/);
  assert.match(render(h(FocusDurationDialog, { ...props, locked: true })), /type="checkbox"[^>]*checked=""/);
  assert.match(html, /Long break every 4 focus sessions \(fixed\)/);
});

test('all original sounds have native selectable controls and labelled carousel slides', () => {
  const html = library();
  assert.equal((html.match(/data-slot="carousel-item"/g) || []).length, 12);
  for (const track of SOUNDSCAPES) assert.ok(html.includes(`Play ${track.title}, ${track.kind}`));
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-label="Study soundscapes"/);
  assert.match(html, /Previous slide/);
  assert.match(html, /Next slide/);
  assert.match(html, /aria-label="12 of 12"/);
  assert.equal((html.match(/Description for /g) || []).length, 12);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /motion-reduce:transition-none/);
  assert.doesNotMatch(html, /Information about|lucide-info/);
  assert.doesNotMatch(html, /line-clamp-2/);

});

test('category subsets do not invent tracks or replace the current playback state', () => {
  const html = library({ tracks: SOUNDSCAPES.filter(t => t.category === 'nature'), category: 'nature', selected: 'rain', playing: true });
  assert.equal((html.match(/data-slot="carousel-item"/g) || []).length, 3);
  assert.match(html, /Pause After the Rain, Soft rainfall/);
  assert.doesNotMatch(html, /Play Midnight Drift/);
  assert.match(html, /aria-pressed="true"/);
});

test('paused selected sound exposes Play while a playing selected sound exposes Pause', () => {
  assert.match(library({ selected: 'dream', playing: false }), /aria-label="Play Midnight Drift, Ambient pads"/);
  assert.match(library({ selected: 'dream', playing: true }), /aria-label="Pause Midnight Drift, Ambient pads"/);
});

test('compact recorded totals retain confirmed/unknown/error/pending semantics', () => {
  const html = render(h(RecordedSummary, { compact: true, minutes: 5, sessions: 1, pending: 2, onRefresh() {} }));
  assert.match(html, />5</);
  assert.match(html, />1</);
  assert.match(html, /2 pending on this device · excluded from totals/);
  assert.match(html, /aria-label="Refresh recorded goal totals"/);
  const unknown = render(h(RecordedSummary, { compact: true, error: true }));
  assert.match(unknown, /Totals unavailable/);
  assert.doesNotMatch(unknown, />0</);
  assert.match(render(h(RecordedSummary, { compact: true, minutes: 0, sessions: 0 })), />0</);
});

const { spawn, spawnSync } = await import('node:child_process');
const { mkdtempSync } = await import('node:fs');
const { rm } = await import('node:fs/promises');
const { tmpdir } = await import('node:os');
const { join } = await import('node:path');
const chrome = [process.env.STUDYSTREAK_CHROME_BIN, 'google-chrome', 'chromium', 'chromium-browser']
  .filter(Boolean).find(binary => spawnSync(binary, ['--version'], { timeout: 2000 }).status === 0);

// The real UI runs in an ephemeral Vite server. Goal responses below are UI
// fixtures; all other external requests are blocked. No backend data is accessed.
test('Chrome: duration modal, keyboard focus, responsive timer and circular sounds', {
  timeout: 60000, skip: chrome ? false : 'Chrome unavailable; set STUDYSTREAK_CHROME_BIN',
}, async () => {
  const virtualId = '\0virtual:focus-refinement';
  const live = await createServer({
    appType: 'custom', server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    plugins: [{ name: 'focus-refinement-test',
      resolveId(id) { if (id === virtualId) return virtualId; },
      load(id) { if (id === virtualId) return `
        import React from 'react'; import { createRoot } from 'react-dom/client';
        import { MemoryRouter } from 'react-router-dom';
        import FocusStudio from '/src/components/dashboard/FocusStudio.tsx';
        createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter, {}, React.createElement(FocusStudio, { userId: 999999 })));
      `; },
    }],
  });
  live.middlewares.use(async (req, res, next) => {
    if (req.url !== '/probe') return next();
    res.setHeader('Content-Type', 'text/html');
    res.end(await live.transformIndexHtml('/probe', '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/index.css"></head><body><main id="root" class="mx-auto max-w-6xl p-4"></main><script type="module" src="/@id/__x00__virtual:focus-refinement"></script></body></html>'));
  });
  await live.listen();
  const origin = `http://127.0.0.1:${live.httpServer.address().port}`;
  const profile = mkdtempSync(join(tmpdir(), 'studystreak-focus-refinement-'));
  const browser = spawn(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
    '--disable-background-networking', '--disable-sync', '--no-first-run', `--user-data-dir=${profile}`,
    '--remote-debugging-pipe', 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let nextId = 0, buffer = '';
  const pending = new Map();
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Chrome timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve, reject, timer });
    browser.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
  browser.stdio[4].setEncoding('utf8');
  browser.stdio[4].on('data', chunk => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\0')) !== -1) {
      const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      if (message.method === 'Fetch.requestPaused') {
        const local = message.params.request.url.startsWith(origin + '/');
        const goalFixture = !local && new URL(message.params.request.url).pathname.endsWith('/users/999999/goals');
        if (goalFixture) {
          const body = { content: [{ id: 1, topic: 'UI fixture goal', frequency: 1, duration: 30, completed: false }], last: true, totalPages: 1 };
          void send('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 200,
            responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }],
            body: Buffer.from(JSON.stringify(body)).toString('base64'),
          }, message.sessionId).catch(() => {});
        } else {
          void send(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', {
            requestId: message.params.requestId, ...(local ? {} : { errorReason: 'BlockedByClient' }),
          }, message.sessionId).catch(() => {});
        }
      }
      const request = pending.get(message.id);
      if (request) { pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result); }
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
      for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await new Promise(r => setTimeout(r, 50)); }
      throw new Error(`Condition timed out: ${expression}`);
    };
    const key = async (key, code = key, modifiers = 0) => {
      const windowsVirtualKeyCode = { Tab: 9, Escape: 27, ArrowLeft: 37, ArrowRight: 39, Enter: 13 }[key];
      await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode, ...(key === 'Enter' ? { text: '\r' } : {}) });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode });
    };
    const gear = '[aria-label="Pomodoro settings"]';
    const open = async () => {
      await evaluate(`document.querySelector('${gear}').focus(); document.querySelector('${gear}').click()`);
      await wait('document.querySelector("dialog").open');
      assert.equal(await evaluate('document.querySelector("dialog").contains(document.activeElement)'), true);
    };
    await command('Page.enable');
    await command('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
    await command('Page.addScriptToEvaluateOnNewDocument', { source: `if (!localStorage.getItem('studystreak:focus-studio:v1:999999')) localStorage.setItem('studystreak:focus-studio:v1:999999', ${JSON.stringify(JSON.stringify({ ...newPomodoro(), preferences: { ...newPomodoro().preferences, theme: 'sunset', soundEffects: false } }))})` });
    await command('Page.navigate', { url: origin + '/probe' });
    await command('Page.bringToFront');
    await wait('!!document.querySelector("[data-slot=carousel-next]") && !document.querySelector("#focus-goal-select").disabled');
    const changeFocus = value => evaluate(`(() => { const input = document.querySelector('[aria-label="Focus minutes"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '${value}'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    const dialogButton = label => evaluate(`[...document.querySelectorAll('dialog button')].find(e => e.textContent === '${label}').click()`);
    assert.equal(await evaluate(`document.body.textContent.includes('Make it yours')`), false);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('[aria-label="Reset current session"]').previousElementSibling).backgroundColor`), 'rgb(148, 232, 195)');
    await open();
    for (let i = 0; i < 9; i++) {
      await key('Tab', 'Tab', i % 2 ? 8 : 0);
      assert.equal(await evaluate('document.querySelector("dialog").contains(document.activeElement)'), true);
      assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineWidth'), '2px');
    }
    await evaluate('document.querySelector("dialog input[type=checkbox]").click()');
    await changeFocus(10);
    assert.equal(await evaluate('document.querySelector("[role=timer]").textContent'), '25:00', 'Draft must not change timer');
    await dialogButton('Cancel');
    await wait('!document.querySelector("dialog")');
    assert.equal(await evaluate(`document.activeElement.matches('${gear}')`), true);
    await open();
    assert.equal(await evaluate(`document.querySelector('[aria-label="Focus minutes"]').value`), '25');
    await changeFocus(4);
    await dialogButton('Save');
    assert.equal(await evaluate('document.querySelector("dialog").open'), true, 'Invalid duration must not save');
    await dialogButton('Restore defaults');
    assert.deepEqual(await evaluate('[...document.querySelectorAll("dialog input[type=number]")].map(e => e.value)'), ['25', '5', '15']);
    assert.equal(await evaluate('document.querySelector("dialog input[type=checkbox]").checked'), false, 'Cancel discards sound preference edits');
    await evaluate('document.querySelector("dialog input[type=checkbox]").click()');
    await changeFocus(10);
    await dialogButton('Save');
    await wait('!document.querySelector("dialog") && document.querySelector("[role=timer]").textContent === "10:00"');
    await open();
    await changeFocus(15);
    await key('Escape');
    await wait('!document.querySelector("dialog")');
    assert.equal(await evaluate('document.querySelector("[role=timer]").textContent'), '10:00');
    assert.equal(await evaluate(`document.activeElement.matches('${gear}')`), true);
    await command('Page.navigate', { url: origin + '/probe' });
    await wait('document.querySelector("[role=timer]")?.textContent === "10:00" && !document.querySelector("#focus-goal-select").disabled');
    await open();
    assert.equal(await evaluate('document.querySelector("dialog input[type=checkbox]").checked'), true, 'Saved event sounds survive reload');
    await dialogButton('Cancel');
    await wait('!document.querySelector("dialog")');
    await evaluate(`[...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Start focusing').click()`);
    await wait(`[...document.querySelectorAll('button')].some(e => e.textContent.trim() === 'Pause timer')`);
    await open();
    assert.equal(await evaluate('document.querySelectorAll("dialog input:disabled").length'), 3);
    const deadline = await evaluate(`JSON.parse(localStorage.getItem('studystreak:focus-studio:v1:999999')).endsAt`);
    await evaluate('document.querySelector("dialog input[type=checkbox]").click()');
    await dialogButton('Save');
    await wait('!document.querySelector("dialog")');
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('studystreak:focus-studio:v1:999999')).endsAt`), deadline, 'Changing event sounds must not restart a running timer');
    await evaluate(`[...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Pause timer').click()`);
    for (const width of [1440, 768, 390, 320]) {
      await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Overflow at ${width}`);
      const layout = await evaluate(`(() => {
        const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, bottom:r.bottom }; };
        return { timer:box('[aria-label="Pomodoro session timer"]'), tools:box('[aria-label="Session tools"]'), player:box('[aria-label="Now playing"]'), goal:box('[aria-label="Study goal"]'), ring:box('[aria-label="Pomodoro session timer"] svg[viewBox="0 0 250 250"]') };
      })()`);
      assert.ok(Math.abs(layout.timer.x - layout.tools.x) < 1 && Math.abs(layout.timer.width - layout.tools.width) < 1, 'Timer must span the full content width');
      assert.ok(layout.tools.y >= layout.timer.bottom, 'Both tools belong below the timer');
      assert.ok(Math.abs(layout.ring.x + layout.ring.width / 2 - layout.timer.x - layout.timer.width / 2) < 1, 'Ring stays centered');
      if (width >= 768) {
        assert.equal(layout.player.y, layout.goal.y);
        assert.ok(Math.abs(layout.player.width - layout.goal.width) < 1 && Math.abs(layout.player.height - layout.goal.height) < 1, 'Balanced tool cards');
      } else assert.ok(layout.goal.y >= layout.player.bottom, 'Tool cards stack on mobile');
      await open();
      assert.ok(await evaluate('(() => { const r = document.querySelector("dialog").getBoundingClientRect(); return r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight; })()'), `Dialog at ${width}`);
      await dialogButton('Cancel');
      await wait('!document.querySelector("dialog")');
    }
    await wait('!document.querySelector("[data-slot=carousel-previous]").disabled');
    const firstLeft = await evaluate('document.querySelector("[data-slot=carousel-item]").getBoundingClientRect().left');
    await evaluate('document.querySelector("[data-slot=carousel-previous]").click()');
    await wait(`Math.abs([...document.querySelectorAll('[data-slot=carousel-item]')].at(-1).getBoundingClientRect().left - ${firstLeft}) < 1`);
    await evaluate('document.querySelector("[data-slot=carousel-next]").click()');
    await wait(`Math.abs(document.querySelector('[data-slot=carousel-item]').getBoundingClientRect().left - ${firstLeft}) < 1`);
    await evaluate('[...document.querySelectorAll("button")].find(e => e.textContent === "Nature").click()');
    await wait('document.querySelectorAll("[data-slot=carousel-item]").length === 3 && !document.querySelector("[data-slot=carousel-previous]").disabled');
    await evaluate('document.querySelector("[data-slot=carousel-previous]").focus()');
    await key('ArrowLeft');
    await wait('!document.querySelector("[data-slot=carousel-next]").disabled');
    // All three nature cards fit at desktop: Embla falls back safely without clones.
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await wait('document.querySelector("[data-slot=carousel-previous]").disabled && document.querySelector("[data-slot=carousel-next]").disabled');
    assert.equal(await evaluate('document.querySelectorAll("[data-slot=carousel-item]").length'), 3);

    await evaluate('[...document.querySelectorAll("button")].find(e => e.textContent === "All sounds").click()');
    await wait('document.querySelectorAll("[data-slot=carousel-item]").length === 12');
    await wait('!document.querySelector("[data-slot=carousel-next]").disabled');
    await evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
    // Artwork remains the dominant surface; hover never changes card dimensions.
    await evaluate('document.querySelector("[data-slot=carousel-item]").scrollIntoView({ block: "center" })');
    const card = await evaluate(`(() => { const e = document.querySelector('[data-slot=carousel-item]'); const r = e.getBoundingClientRect(); const art = e.querySelector('article > div').getBoundingClientRect(); return { width: r.width, height: r.height, x: art.x + art.width / 2, y: art.y + art.height / 2, artworkHeight: art.height }; })()`);
    assert.ok(card.artworkHeight > card.height * .65);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: card.x, y: card.y, pointerType: 'mouse' });
    assert.equal(await evaluate("matchMedia('(hover:hover)').matches"), true, 'Desktop profile must support hover');
    await wait('getComputedStyle(document.querySelector("[data-slot=carousel-item] [aria-controls]").previousElementSibling).opacity === "1"');
    assert.equal(await evaluate('document.querySelector("[data-slot=carousel-item]").getBoundingClientRect().height'), card.height);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
    await evaluate('document.querySelector("[data-slot=carousel-item] [aria-controls]").focus()');
    assert.match(await evaluate('document.activeElement.getAttribute("aria-label")'), /Description for/);
    await wait('getComputedStyle(document.querySelector("[data-slot=carousel-item] [aria-controls]").previousElementSibling).opacity === "1"');
    await key('Enter');
    await wait('document.querySelector("[data-slot=carousel-item] [aria-controls]").getAttribute("aria-expanded") === "true"');
    assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineWidth'), '2px');
    await evaluate(`document.querySelector('[aria-label="Play Midnight Drift, Ambient pads"]').click()`);
    await wait(`!!document.querySelector('[aria-label="Pause soundscape"]')`);
    const nowPlaying = await evaluate(`document.querySelector('[aria-label="Now playing"]').textContent`);
    await evaluate('document.querySelector("[data-slot=carousel-next]").click()');
    await evaluate('[...document.querySelectorAll("button")].find(e => e.textContent === "Nature").click()');
    assert.equal(await evaluate(`document.querySelector('[aria-label="Now playing"]').textContent`), nowPlaying, 'Scrolling and filters must preserve playback');
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: false });
    await command('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await evaluate('document.querySelector("[data-slot=carousel-content]").scrollIntoView({ block: "center" })');
    const swipe = await evaluate('(() => { const e = document.querySelector("[data-slot=carousel-content]"); const r = e.getBoundingClientRect(); return { x: r.x + r.width * .8, y: r.y + 100, transform: getComputedStyle(e.firstElementChild).transform }; })()');
    await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: swipe.x, y: swipe.y }] });
    for (const offset of [40, 90, 140, 190]) {
      await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: swipe.x - offset, y: swipe.y }] });
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(`getComputedStyle(document.querySelector('[data-slot=carousel-content]').firstElementChild).transform !== ${JSON.stringify(swipe.transform)}`);
    // Let Embla snap into place, then tap the visible artwork, not playback.
    await wait(`!![...document.querySelectorAll('[data-slot=carousel-item] [aria-controls]')].find(e => { const r = e.getBoundingClientRect(); return r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight; })`);
    const tap = await evaluate(`(() => {
      const button = [...document.querySelectorAll('[data-slot=carousel-item] [aria-controls]')].find(e => { const r = e.getBoundingClientRect(); return r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight; });
      const r = button.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, name: button.getAttribute('aria-label') };
    })()`);
    await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tap.x, y: tap.y }] });
    await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(`[...document.querySelectorAll('[data-slot=carousel-item] [aria-controls]')].find(e => e.getAttribute('aria-label') === ${JSON.stringify(tap.name)}).getAttribute('aria-expanded') === 'true'`);
    await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tap.x, y: tap.y }] });
    await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(`[...document.querySelectorAll('[data-slot=carousel-item] [aria-controls]')].find(e => e.getAttribute('aria-label') === ${JSON.stringify(tap.name)}).getAttribute('aria-expanded') === 'false'`);
    await wait(`getComputedStyle([...document.querySelectorAll('[data-slot=carousel-item] [aria-controls]')].find(e => e.getAttribute('aria-label') === ${JSON.stringify(tap.name)}).previousElementSibling).opacity === '0'`);
    assert.equal(await evaluate(`document.querySelector('[aria-label="Now playing"]').textContent`), nowPlaying);
    await evaluate(`document.querySelector('[aria-label="Pause soundscape"]').click()`);
    await wait(`!!document.querySelector('[aria-label="Play soundscape"]')`);
    await evaluate(`(() => { const select = document.querySelector('#focus-goal-select'); select.value = '1'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await wait(`!!document.querySelector('[aria-label="Study goal"] a[href="/goals/1"]')`);
    assert.equal(await evaluate(`document.querySelector('#focus-goal-select').selectedOptions[0].textContent`), 'UI fixture goal');
    assert.equal(await evaluate(`document.querySelector('[aria-label="Study goal"]').textContent.includes('Recorded for this Goal')`), false);
    // A paused linked session is also immutable; this fixture stays browser-only.
    await evaluate(`(() => {
      const key = 'studystreak:focus-studio:v1:999999';
      const saved = JSON.parse(localStorage.getItem(key));
      saved.endsAt = null;
      saved.remainingMs = 590000;
      saved.activeFocusSession = { sessionId: '11111111-1111-4111-8111-111111111111', goalId: 1, durationMinutes: 10 };
      localStorage.setItem(key, JSON.stringify(saved));
    })()`);
    await command('Page.navigate', { url: origin + '/probe' });
    await wait('!!document.querySelector("[role=timer]") && document.querySelector("#focus-goal-select")?.value === "1"');
    assert.equal(await evaluate('document.querySelector("#focus-goal-select").disabled'), true);
    await open();
    assert.equal(await evaluate('document.querySelectorAll("dialog input:disabled").length'), 3);
    await evaluate('document.querySelector("dialog input[type=checkbox]").click()');
    await dialogButton('Save');
    await wait('!document.querySelector("dialog")');
    const paused = await evaluate(`JSON.parse(localStorage.getItem('studystreak:focus-studio:v1:999999'))`);
    assert.equal(paused.remainingMs, 590000);
    assert.equal(paused.activeFocusSession.sessionId, '11111111-1111-4111-8111-111111111111');
    assert.equal(paused.preferences.focusMinutes, 10);
    assert.equal(paused.preferences.soundEffects, true);
  } finally {
    if (browser.exitCode === null && browser.signalCode === null) {
      const stopped = new Promise(resolve => browser.once('exit', resolve));
      await send('Browser.close');
      await stopped;
    }
    for (const request of pending.values()) clearTimeout(request.timer);
    await live.close();
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
