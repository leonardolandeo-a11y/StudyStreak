import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
import { environmentFixture, token } from '../../scripts/tests/studyEnvironmentFixture.mjs';

test('book searches keep a shareable topic and browser back restores the previous search', { timeout: 45000, skip: !chrome && 'Chrome unavailable' }, async () => {
  const terms = [];
  const page = await profileBrowser({ intercept: async request => {
    const url = new URL(request.url);
    if (url.pathname === '/api/resources/books') { terms.push(url.searchParams.get('q')); return { body: [] }; }
    return environmentFixture(request);
  } });
  try {
    await page.command('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('accessToken',${JSON.stringify(token)})` });
    await page.navigate('/resources?topic=Algebra');
    await page.wait(`document.body.textContent.includes('No books found')`);
    await page.fill('#book-search', 'Data structures');
    await page.click('Search books');
    await page.wait(`new URLSearchParams(location.search).get('topic')==='Data structures'`);
    await page.wait(`document.body.textContent.includes('No books found')`);
    assert.equal(await page.evaluate(`document.querySelector('#book-search').value`), 'Data structures');
    await page.evaluate('history.back()');
    await page.wait(`new URLSearchParams(location.search).get('topic')==='Algebra'`);
    await page.wait(`document.querySelector('#book-search')?.value==='Algebra'`);
    assert.deepEqual(terms.slice(0, 3), ['Algebra', 'Data structures', 'Algebra']);
    assert.deepEqual(page.errors, []);
  } finally { await page.close(); }
});
