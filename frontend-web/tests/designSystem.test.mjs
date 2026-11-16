import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
after(() => server.close());
const { createElement: h } = await import('react');
const { renderToStaticMarkup: render } = await import('react-dom/server');
const { default: LoadingState } = await server.ssrLoadModule('/src/components/ui/LoadingState.tsx');
const { default: EmptyState } = await server.ssrLoadModule('/src/components/ui/EmptyState.tsx');
const { default: ErrorMessage } = await server.ssrLoadModule('/src/components/ui/ErrorMessage.tsx');
const { default: PaginationControls } = await server.ssrLoadModule('/src/components/ui/PaginationControls.tsx');
const { default: TrackingLinkForm } = await server.ssrLoadModule('/src/components/trackingLinks/TrackingLinkForm.tsx');

test('loading announces the provided status without announcing a decorative spinner', () => {
    const html = render(h(LoadingState, { message: 'Loading your goals…' }));
    assert.match(html, /role="status"/);
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /Loading your goals…/);
    assert.match(render(h(LoadingState)), /Loading\.\.\./);
});

test('shared states preserve message escaping and the error announcement', () => {
    const message = '<script>Not markup</script>';
    for (const component of [LoadingState, EmptyState, ErrorMessage]) {
        const html = render(h(component, { message }));
        assert.match(html, /&lt;script&gt;Not markup&lt;\/script&gt;/);
        assert.doesNotMatch(html, /<script>/);
    }
    assert.match(render(h(ErrorMessage, { message: 'Could not load goals' })), /role="alert"/);
    assert.doesNotMatch(render(h(EmptyState, { message: 'No goals yet' })), /role="alert"/);
});

test('pagination preserves navigation semantics and native disabled controls', () => {
    const html = render(h(PaginationControls, {
        page: 0, totalPages: 3, first: true, last: false,
        onPrevious() {}, onNext() {}, onPageChange() {},
        size: 10, totalElements: 23, onPageSizeChange() {},
    }));
    assert.match(html, /<nav aria-label="Pagination"/);
    assert.match(html, /disabled=""[^>]*>Previous/);
    assert.match(html, /aria-label="Page 1" aria-current="page"/);
    assert.match(html, /Showing 1–10 of 23/);
    assert.match(html, /<label[^>]*>.*Per page.*<select/s);
    assert.match(html, /<option value="10" selected=""/);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
});

test('empty pagination still shows a stable page count and disabled boundaries', () => {
    const html = render(h(PaginationControls, {
        page: 0, totalPages: 0, first: true, last: true,
        onPrevious() {}, onNext() {},
    }));
    assert.match(html, /Page 1 of 1/);
    assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
});

const chrome = [process.env.STUDYSTREAK_CHROME_BIN, 'google-chrome', 'chromium', 'chromium-browser']
    .filter(Boolean).find(binary => spawnSync(binary, ['--version'], { timeout: 2000 }).status === 0);

test('keyboard focus survives legacy utilities without styling noninteractive content', {
    timeout: 30000,
    skip: chrome ? false : 'Chrome/Chromium unavailable; set STUDYSTREAK_CHROME_BIN to run computed-style checks',
}, async () => {
    // Compile the real CSS, including Tailwind layers; SSR assertions alone
    // cannot detect an outline-none utility overriding the focus rule.
    const stylesheet = await server.transformRequest('/src/index.css?direct');
    assert.ok(stylesheet?.code);
    const markup = render(h(TrackingLinkForm, { loading: false, onSubmit: async () => false }));
    const profile = mkdtempSync(join(tmpdir(), 'studystreak-focus-test-'));
    const browser = spawn(chrome, [
        '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
        '--disable-background-networking', '--disable-sync', '--no-first-run',
        `--user-data-dir=${profile}`, '--remote-debugging-pipe', 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
    let nextId = 0;
    let buffer = '';
    const pending = new Map();
    browser.stdio[4].setEncoding('utf8');
    browser.stdio[4].on('data', chunk => {
        buffer += chunk;
        let end;
        while ((end = buffer.indexOf('\0')) !== -1) {
            const message = JSON.parse(buffer.slice(0, end));
            buffer = buffer.slice(end + 1);
            const request = pending.get(message.id);
            if (request) {
                pending.delete(message.id);
                clearTimeout(request.timer);
                if (message.error) request.reject(new Error(JSON.stringify(message.error)));
                else request.resolve(message.result);
            }
        }
    });
    browser.on('exit', () => {
        for (const request of pending.values()) {
            clearTimeout(request.timer);
            request.reject(new Error('Chrome exited during the focus regression test'));
        }
        pending.clear();
    });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`Chrome timed out: ${method}`));
        }, 5000);
        pending.set(id, { resolve, reject, timer });
        browser.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
    try {
        const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
        const command = (method, params) => send(method, params, sessionId);
        const evaluate = async expression => {
            const value = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
            assert.equal(value.exceptionDetails, undefined);
            return value.result.value;
        };
        await command('Page.enable');
        const { frameTree } = await command('Page.getFrameTree');
        await command('Page.setDocumentContent', {
            frameId: frameTree.frame.id,
            html: `<!doctype html><html data-theme="light" data-background="neutral" data-accent="mint"><head><meta charset="utf-8"><style>${stylesheet.code}</style></head><body>
                ${markup}
                <button id="legacy-result" class="focus:bg-slate-800 focus:outline-none">Tracking result</button>
                <input id="legacy-resource" class="outline-none focus:border-sky-500" aria-label="Books">
                <a id="test-link" href="#content">Details</a>
                <select id="test-select" aria-label="Size"><option>10</option></select>
                <textarea id="test-textarea" aria-label="Note"></textarea>
                <details><summary id="test-summary">More</summary></details>
                <div id="test-custom" role="button" tabindex="0">Custom action</div>
                <div id="noninteractive" tabindex="-1">Programmatic focus target</div>
            </body></html>`,
        });
        await command('Page.bringToFront');
        const palette = await evaluate(`(() => {
            const names = ['slate-950', 'slate-900', 'slate-800', 'slate-700',
                'slate-500', 'sky-400', 'sky-500', 'emerald-400'];
            const probe = document.createElement('span');
            document.body.append(probe);
            const colors = names.map(name => {
                probe.style.color = 'var(--color-' + name + ')';
                return getComputedStyle(probe).color;
            });
            probe.remove();
            return colors;
        })()`);
        assert.deepEqual(palette, [
            'rgb(248, 250, 252)', 'rgb(255, 255, 255)', 'rgb(232, 235, 240)', 'rgb(100, 116, 139)',
            'rgb(71, 85, 105)', 'rgb(18, 100, 73)', 'rgb(14, 80, 59)', 'rgb(22, 101, 52)',
        ], 'Compatibility tokens must follow the explicit Neutral Light palette');
        const targets = ['partner-search', 'legacy-result', 'legacy-resource', 'test-link',
            'test-select', 'test-textarea', 'test-summary', 'test-custom'];
        for (const target of targets) {
            await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
            await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
            const focus = await evaluate(`(() => {
                const element = document.activeElement;
                const style = getComputedStyle(element);
                return { id: element.id, visible: element.matches(':focus-visible'),
                    outline: style.outlineStyle, width: style.outlineWidth,
                    offset: style.outlineOffset, color: style.outlineColor };
            })()`);
            assert.equal(focus.id, target, 'Tab order must skip the disabled Tracking submit button');
            assert.equal(focus.visible, true);
            assert.equal(focus.outline, 'solid', `Focus hidden on ${target}`);
            assert.equal(focus.width, '2px');
            assert.equal(focus.offset, '3px');
            assert.equal(focus.color, 'rgb(18, 100, 73)');
        }
        const excluded = await evaluate(`(() => {
            const element = document.getElementById('noninteractive');
            element.focus();
            return getComputedStyle(element).outlineStyle;
        })()`);
        assert.notEqual(excluded, 'solid', 'Do not force the control outline on programmatically focused content');
        // A real mouse click on a button must not force the keyboard-only ring.
        const point = await evaluate(`(() => {
            const rect = document.getElementById('legacy-result').getBoundingClientRect();
            return {x:rect.x + rect.width/2,y:rect.y + rect.height/2};
        })()`);
        await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
        await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
        assert.equal(await evaluate(`document.getElementById('legacy-result').matches(':focus-visible')`), false);
    } finally {
        const stopped = new Promise(resolve => browser.once('exit', resolve));
        browser.kill('SIGTERM');
        if (browser.exitCode === null && browser.signalCode === null) await stopped;
        try {
            await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
        } catch (error) {
            if (!['ENOTEMPTY', 'EBUSY', 'EPERM'].includes(error?.code)) throw error;
        }
    }
});
