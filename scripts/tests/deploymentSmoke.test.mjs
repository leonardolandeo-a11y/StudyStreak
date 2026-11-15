import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkDeployment, productionUrl } from '../check-deployment.mjs';

const api = 'https://api.example.test', web = 'https://app.example.test';
const html = '<!doctype html><html><body><div id="root"></div><script type="module" src="/assets/main-123.js"></script></body></html>';

function fixture(url, request) {
  const path = new URL(url).pathname;
  if (path === '/' || path === '/login' && request.method === 'GET') return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
  if (path === '/assets/main-123.js') return new Response('console.log(1)', { status: 200, headers: { 'content-type': 'application/javascript' } });
  if (path === '/api/profile') return new Response('{}', { status: 401 });
  if (path === '/login' && request.method === 'OPTIONS') return new Response(null, { status: 200, headers: {
    'access-control-allow-origin': web, 'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
  } });
  return new Response('Not found', { status: 404 });
}

test('deployment smoke checks web, deep links, assets, auth and CORS without credentials', async () => {
  const results = await checkDeployment({ apiUrl: api, webUrl: web, fetchImpl: fixture });
  assert.equal(results.length, 5);
  assert.ok(results.every(result => result.ok), JSON.stringify(results));
});

test('deployment smoke catches missing CORS and accidental HTML returned for assets', async () => {
  const broken = (url, request) => {
    if (new URL(url).pathname === '/assets/main-123.js') return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 200 });
    return fixture(url, request);
  };
  const results = await checkDeployment({ apiUrl: api, webUrl: web, fetchImpl: broken });
  assert.deepEqual(results.filter(result => !result.ok).map(result => result.name), ['Frontend JavaScript asset', 'Backend allows frontend CORS preflight']);
});

test('deployment refuses HTTP and URLs with embedded credentials before sending requests', async () => {
  assert.throws(() => productionUrl('http://api.example.test', 'API'), /HTTPS/);
  assert.throws(() => productionUrl('https://user:secret@api.example.test', 'API'), /without credentials/);
  let requests = 0;
  await assert.rejects(() => checkDeployment({ apiUrl: 'http://api.example.test', webUrl: web, fetchImpl: () => { requests++; } }), /HTTPS/);
  assert.equal(requests, 0);
});
