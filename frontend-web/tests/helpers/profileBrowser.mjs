import { createServer } from 'vite';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

export const chrome = [process.env.STUDYSTREAK_CHROME_BIN, 'google-chrome', 'chromium', 'chromium-browser'].filter(Boolean).find(bin => spawnSync(bin, ['--version'], { timeout: 2000 }).status === 0);
export async function profileBrowser({ api = 'https://profile.invalid', port = 0, intercept, desktopPointer = false, aliases = {}, cacheDir } = {}) {
  const vite = await createServer({ cacheDir, resolve: { alias: aliases }, define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(api) }, server: { host: '127.0.0.1', port, strictPort: !!port, hmr: false, watch: null } });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const folder = mkdtempSync(join(tmpdir(), 'studystreak-profile-'));
  const browser = spawn(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', ...(desktopPointer ? ['--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'] : []), '--disable-background-networking', '--disable-sync', '--no-first-run', `--user-data-dir=${folder}`, '--remote-debugging-pipe', 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let closing = false;
  const pending = new Map(), errors = []; let nextId = 0, buffer = '', loaded;
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId, timer = setTimeout(() => { pending.delete(id); reject(Error(`Chrome timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer }); browser.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
  for (const pipe of [browser.stdio[3], browser.stdio[4]]) pipe.on('error', error => { if (!closing) errors.push(error.message); });
  browser.stdio[4].setEncoding('utf8');
  browser.stdio[4].on('data', chunk => {
    buffer += chunk; let end;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      if (message.method === 'Page.loadEventFired') loaded?.();
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      if (message.method === 'Fetch.requestPaused') {
        void (async () => {
          const { request, requestId } = message.params;
          const reply = request.method === 'OPTIONS' ? { status: 204 } : await intercept(request);
          if (reply.fail) return send('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' }, message.sessionId);
          const body = reply.body instanceof Buffer ? reply.body : Buffer.from(reply.body === undefined ? '' : JSON.stringify(reply.body));
          return send('Fetch.fulfillRequest', { requestId, responseCode: reply.status ?? 200,
            responseHeaders: [{ name: 'Content-Type', value: reply.type ?? 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Headers', value: 'authorization, content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,PATCH,PUT,DELETE,OPTIONS' }], body: body.toString('base64') }, message.sessionId);
        })().catch(error => {
          // AbortController can cancel a request while a delayed fixture is preparing
          // its response. Chrome has already discarded that interception ID.
          try {
            const protocol = JSON.parse(error.message);
            if (protocol.code === -32602 && protocol.message === 'Invalid InterceptionId.') return;
          } catch { /* Preserve non-protocol failures below. */ }
          errors.push(error.message);
        });
      }
      const held = pending.get(message.id);
      if (held) { pending.delete(message.id); clearTimeout(held.timer); message.error ? held.reject(Error(JSON.stringify(message.error))) : held.resolve(message.result); }
    }
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  await command('Page.enable'); await command('Runtime.enable');
  if (intercept) await command('Fetch.enable', { patterns: [{ urlPattern: api + '/*' }] });
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text); return result.result.value;
  };
  const wait = async expression => {
    for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 40)); }
    throw Error('Condition timed out: ' + expression);
  };
  const click = async text => {
    const found = await evaluate(`(() => { const el=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}); if(!el) return false; el.focus(); el.click(); return true; })()`);
    assert.ok(found, 'Button not found: ' + text);
  };
  const fill = async (selector, value) => evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});const p=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const key = async value => { const windowsVirtualKeyCode = { Tab: 9, Escape: 27, Enter: 13 }[value]; await command('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code: value, windowsVirtualKeyCode }); await command('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code: value, windowsVirtualKeyCode }); };
  return { origin, command, evaluate, wait, click, fill, key, errors,
    reload: async () => { const complete = new Promise(resolve => { loaded = resolve; }); await command('Page.reload'); await complete; },
    navigate: async path => { await command('Page.navigate', { url: origin + path }); await wait('!!document.querySelector("h1")'); },
    close: async () => { closing = true; browser.kill('SIGKILL'); for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('Browser closed')); } pending.clear(); await vite.close(); await rm(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); }
  };
}
