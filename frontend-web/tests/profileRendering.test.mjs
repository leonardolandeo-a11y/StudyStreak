import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';

const image = readFileSync(new URL('../../src/test/resources/profile/image.png', import.meta.url));
const token = [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub: 'profile_test', userId: 42, email: 'profile@example.invalid', role: 'USER', type: 'access', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'fixture'].join('.');

test('Chrome: protected profile, editing, images, sidebar, error states, themes and responsive', { timeout: 120000, skip: !chrome && 'Chrome unavailable' }, async () => {
  let profile = { id: 42, username: 'profile_test', displayName: null, presentationName: 'profile_test', bio: null, statistics: { studyStreak: 3, bestStudyStreak: 9, verifiedMinutes: 125.5, verifiedSessions: 7, activeGoals: 2 } };
  const assets = { avatar: null, banner: null }, writes = [], requests = []; let failure = null, failUpload = false;
  const page = await profileBrowser({ intercept: async request => {
    const path = new URL(request.url).pathname; requests.push({ path, method: request.method, authorized: !!request.headers.Authorization || !!request.headers.authorization });
    if (failure && path.startsWith('/api/profile')) return failure === 'network' ? { fail: true } : { status: failure, body: {} };
    if (path === '/api/profile') {
      if (request.method === 'PATCH') { const patch = JSON.parse(request.postData); writes.push('PATCH'); profile = { ...profile, ...patch, presentationName: patch.displayName || profile.username }; }
      return { body: profile };
    }
    const slot = path.split('/').at(-1);
    if (path.startsWith('/api/profile/') && slot in assets) {
      if (request.method === 'PUT' && failUpload) return { status: 400, body: {} };
      if (request.method === 'PUT') { assets[slot] = image; writes.push('PUT ' + slot); return { status: 204 }; }
      if (request.method === 'DELETE') { assets[slot] = null; writes.push('DELETE ' + slot); return { status: 204 }; }
      return assets[slot] ? { body: assets[slot], type: 'image/png' } : { status: 404, body: {} };
    }
    return { body: path.includes('unread') ? 0 : {} };
  } });
  try {
    await page.navigate('/profile'); await page.wait('location.pathname === "/login"');
    await page.command('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__profileUrls={created:[],revoked:[]};const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=create(b);window.__profileUrls.created.push(u);return u};URL.revokeObjectURL=u=>{window.__profileUrls.revoked.push(u);revoke(u)};` });
    await page.navigate('/profile'); await page.wait('!!document.querySelector("[data-profile-page] h2")');
    assert.equal(await page.evaluate('document.querySelector("[data-profile-page] h2").textContent'), 'profile_test');
    assert.ok(await page.evaluate('document.body.textContent.includes(new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(125.5)+" min") && document.body.textContent.includes("includes historical")'));
    await page.click('Edit profile'); await page.wait('!!document.querySelector("dialog[open]")');
    await page.fill('dialog input[autocomplete="nickname"]', '😀'.repeat(61));
    assert.ok(await page.evaluate('Array.from(document.querySelectorAll("dialog button")).find(b=>b.textContent==="Save changes").disabled'));
    await page.fill('dialog input[autocomplete="nickname"]', '  María 李 😀  ');
    await page.fill('dialog textarea', '<b>Not HTML</b>\nCompression');
    for (let i=0;i<12;i++) { await page.key('Tab'); assert.ok(await page.evaluate('!!document.activeElement.closest("dialog")')); }
    assert.notEqual(await page.evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'none');
    await page.click('Cancel'); assert.equal(writes.length, 0);
    await page.click('Edit profile'); await page.key('Escape'); await page.wait('!document.querySelector("dialog")');
    assert.equal(await page.evaluate('document.activeElement.textContent.trim()'), 'Edit profile');
    await page.click('Edit profile');
    await page.fill('dialog input[autocomplete="nickname"]', '  María 李 😀  ');
    await page.fill('dialog textarea', '<b>Not HTML</b>\nCompression');
    await page.click('Save changes'); await page.wait('!document.querySelector("dialog")');
    assert.equal(profile.displayName, 'María 李 😀');
    assert.ok(await page.evaluate('document.querySelector("[data-profile-page]").textContent.includes("<b>Not HTML</b>") && !document.querySelector("[data-profile-page] b")'));
    assert.ok(await page.evaluate('document.querySelector("aside [role=group]").textContent.includes("María 李 😀")'));
    await page.reload(); await page.wait('document.querySelector("[data-profile-page] h2")?.textContent === "María 李 😀"');
    await page.click('Edit profile');
    const encoded = image.toString('base64');
    const choose = slot => page.evaluate(`(() => { const bytes=Uint8Array.from(atob(${JSON.stringify(encoded)}),c=>c.charCodeAt(0));const file=new File([bytes],'synthetic.png',{type:'image/png'});const dt=new DataTransfer();dt.items.add(file);const el=document.querySelector('[data-image-slot="${slot}"]');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await choose('avatar'); await choose('banner');
    await page.wait('!!document.querySelector("dialog img")'); failUpload = true; await page.click('Save changes');
    await page.wait('!!document.querySelector("dialog [role=alert]")');
    assert.ok(await page.evaluate('document.querySelector("dialog [role=alert]").textContent.includes("Some changes")'));
    failUpload = false; await page.click('Save changes');
    await page.wait('!document.querySelector("dialog") && !!document.querySelector("aside [role=group] img")');
    assert.ok(writes.includes('PUT avatar') && writes.includes('PUT banner'));
    assert.ok(await page.evaluate('Array.from(document.querySelectorAll("[data-profile-page] img")).every(i=>i.src.startsWith("blob:"))'));
    await page.click('Edit profile'); await choose('avatar'); await page.click('Save changes'); await page.wait('!document.querySelector("dialog")');
    assert.equal(writes.filter(w=>w==='PUT avatar').length, 2);
    await page.click('Edit profile'); await page.click('Remove avatar'); await page.click('Remove banner'); await page.click('Save changes');
    await page.wait('!document.querySelector("dialog") && !document.querySelector("aside [role=group] img")');
    assert.equal(assets.avatar, null); assert.equal(assets.banner, null);
    for (const error of ['network', 403, 401, 500]) {
      failure=error; await page.evaluate('document.querySelector("button[title^=Refresh]").click()');
      await page.wait('!!document.querySelector("[data-profile-page] [role=alert]")');
      assert.ok(await page.evaluate('document.querySelector("[data-profile-page] [role=alert]").textContent.length > 10'));
      failure=null; await page.click('Try again'); await page.wait('!document.querySelector("[data-profile-page] [role=alert]")');
    }
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
      for (const mode of ['dark','light','system']) for (const accent of ['mint','blue','purple','orange']) {
        await page.evaluate(`window.studyStreakAppearance.apply({mode:${JSON.stringify(mode)},accent:${JSON.stringify(accent)},reduceMotion:true})`);
        assert.ok(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), `Overflow ${width}/${mode}/${accent}`);
      }
      await page.click('Edit profile');
      assert.ok(await page.evaluate('document.querySelector("dialog").scrollWidth <= document.querySelector("dialog").clientWidth'));
      await page.key('Escape');
    }
    assert.ok(requests.filter(r=>r.path.startsWith('/api/profile')).every(r=>r.authorized));
    assert.deepEqual(page.errors, []);
    await page.evaluate('document.querySelector("a[href$=settings]").click()');
    await page.wait('location.pathname === "/settings"');
    // Unmount the authenticated layout and verify all object URLs are released.
    await page.click('Sign out'); await page.wait('location.pathname === "/login"');
    assert.ok(await page.evaluate('window.__profileUrls.created.every(u=>window.__profileUrls.revoked.includes(u))'));
  } finally { await page.close(); }
});
