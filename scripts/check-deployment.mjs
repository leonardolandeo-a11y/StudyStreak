import { pathToFileURL } from 'node:url';

export function productionUrl(input, label) {
  if (typeof input !== 'string' || !input.trim()) throw new Error(`${label} is required.`);
  let url;
  try { url = new URL(input.trim()); } catch { throw new Error(`${label} must be a valid HTTPS URL.`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error(`${label} must be an HTTPS URL without credentials or query parameters.`);
  }
  return url.href.replace(/\/+$/, '');
}

export async function checkDeployment({ apiUrl, webUrl, fetchImpl = fetch }) {
  const api = productionUrl(apiUrl, 'Backend URL');
  const web = productionUrl(webUrl, 'Frontend URL');
  const origin = new URL(web).origin;
  const checks = [];

  async function probe(name, url, init, accepts, readBody = false) {
    try {
      const response = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(10000), ...init });
      const body = readBody ? await response.text() : '';
      const ok = accepts(response, body);
      checks.push({ name, ok, status: response.status });
      return { ok, body };
    } catch (error) {
      checks.push({ name, ok: false, error: error?.name === 'TimeoutError' ? 'Timeout' : 'Request failed' });
      return { ok: false, body: '' };
    }
  }

  const htmlPage = (response, body) => response.status === 200 &&
    response.headers.get('content-type')?.includes('text/html') && /id=["']root["']/.test(body);
  const home = await probe('Frontend home', `${web}/`, { method: 'GET' }, htmlPage, true);
  await probe('Frontend /login deep link', `${web}/login`, { method: 'GET' }, htmlPage, true);

  const script = [...home.body.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/gi)].at(-1)?.[1];
  if (script) await probe('Frontend JavaScript asset', new URL(script, `${web}/`).href, { method: 'GET' },
    response => response.status === 200 && /javascript|ecmascript/.test(response.headers.get('content-type') ?? ''));
  else checks.push({ name: 'Frontend JavaScript asset', ok: false, error: 'No script entry found' });

  await probe('Backend rejects unauthenticated profile access', `${api}/api/profile`, { method: 'GET' }, response => response.status === 401);
  await probe('Backend allows frontend CORS preflight', `${api}/login`, {
    method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' },
  }, response => {
    const originAllowed = response.headers.get('access-control-allow-origin') === origin;
    const methods = (response.headers.get('access-control-allow-methods') ?? '').toLowerCase();
    const headers = (response.headers.get('access-control-allow-headers') ?? '').toLowerCase();
    return response.status >= 200 && response.status < 300 && originAllowed && methods.includes('post') &&
      headers.includes('authorization') && headers.includes('content-type');
  });
  return checks;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [apiFlag, apiUrl, webFlag, webUrl] = process.argv.slice(2);
  if (apiFlag !== '--api' || webFlag !== '--web' || !apiUrl || !webUrl) {
    console.error('Usage: node scripts/check-deployment.mjs --api https://api.example.com --web https://app.example.com');
    process.exitCode = 2;
  } else {
    try {
      const results = await checkDeployment({ apiUrl, webUrl });
      for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}: HTTP ${result.status ?? 'n/a'}${result.error ? ` (${result.error})` : ''}`);
      if (results.some(result => !result.ok)) process.exitCode = 1;
    } catch (error) {
      console.error(error.message);
      process.exitCode = 2;
    }
  }
}
