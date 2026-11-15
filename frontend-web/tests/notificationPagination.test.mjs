import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
import { environmentFixture, token } from '../../scripts/tests/studyEnvironmentFixture.mjs';

test('notifications preserve page size and filters across shareable URLs', { timeout: 45000, skip: !chrome && 'Chrome unavailable' }, async () => {
  const requests = [];
  const page = await profileBrowser({ intercept: async request => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/users/101/notifications')) {
      const number = Number(url.searchParams.get('page') ?? 0), size = Number(url.searchParams.get('size') ?? 20), totalElements = 55;
      const totalPages = Math.ceil(totalElements / size);
      requests.push({ path: url.pathname, number, size });
      const content = Array.from({ length: Math.max(0, Math.min(size, totalElements - number * size)) }, (_, index) => ({
        id: number * size + index + 1, message: 'Study milestone', type: 'GOAL_COMPLETED', read: false, createdAt: '2026-11-09T12:00:00Z',
      }));
      return { body: { content, number, size, totalElements, totalPages, first: number === 0, last: number === totalPages - 1, empty: content.length === 0 } };
    }
    return environmentFixture(request);
  } });
  try {
    await page.command('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('accessToken',${JSON.stringify(token)})` });
    await page.navigate('/notifications?size=25&page=1');
    await page.wait(`document.body.textContent.includes('Showing 26–50 of 55')`);
    assert.equal(await page.evaluate(`document.querySelector('nav[aria-label="Pagination"] select').value`), '25');

    await page.click('Unread');
    await page.wait(`new URLSearchParams(location.search).get('filter')==='unread' && new URLSearchParams(location.search).get('size')==='25' && !new URLSearchParams(location.search).has('page')`);
    await page.wait(`document.body.textContent.includes('Showing 1–25 of 55')`);

    await page.evaluate(`(()=>{const select=document.querySelector('nav[aria-label="Pagination"] select');select.value='10';select.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await page.wait(`new URLSearchParams(location.search).get('size')==='10' && !new URLSearchParams(location.search).has('page')`);
    await page.wait(`document.body.textContent.includes('Showing 1–10 of 55')`);

    await page.click('Next');
    await page.wait(`new URLSearchParams(location.search).get('page')==='1'`);
    await page.wait(`document.body.textContent.includes('Showing 11–20 of 55')`);
    assert.ok(requests.some(r => r.path.endsWith('/unread') && r.number === 1 && r.size === 10));
    assert.deepEqual(page.errors, []);
  } finally { await page.close(); }
});
