import { credentials, deferred } from './helpers/mobileSessionHarness.mjs';
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import axios, { AxiosError } from 'axios';
import { blockNextWrite, persisted } from './helpers/secureStoreMock.mjs';

process.env.EXPO_PUBLIC_API_URL = ' http://127.0.0.1:8080/// ';
const { apiClient } = await import('../src/services/apiClient.ts');
const { authService } = await import('../src/services/authService.ts');
const { tokenStorage } = await import('../src/services/tokenStorage.ts');
const { getApiErrorMessage } = await import('../src/utils/apiError.ts');
const { subscribeToSessionExpiration } = await import('../src/services/authSession.ts');
const { readApiConfiguration } = await import('../src/config/api.ts');

function response(config, data = {}, status = 200) {
  return { config, data, status, statusText: String(status), headers: {} };
}
function reject(config, status) {
  throw new AxiosError('Fixture HTTP failure', 'ERR_BAD_RESPONSE', config, undefined, response(config, {}, status));
}
function useAdapter(adapter) {
  apiClient.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;
}
beforeEach(async () => {
  await tokenStorage.clear();
  useAdapter(async () => { throw new Error('Unexpected fixture request'); });
});

test('the existing validator accepts LAN/HTTPS bases and preserves an explicit deployment prefix', () => {
  for (const [input, expected] of [
    [' http://192.168.1.100:8080/// ', 'http://192.168.1.100:8080'],
    ['https://api.example.invalid/', 'https://api.example.invalid'],
    ['https://api.example.invalid/study/', 'https://api.example.invalid/study'],
  ]) assert.equal(readApiConfiguration(input).baseUrl, expected);
});

test('uses the normalized base URL, preserves REST routes and authenticates with SecureStore', async () => {
  const tokens = credentials();
  await tokenStorage.setTokens(tokens);
  const paths = ['/api/profile', '/users/1/goals'];
  useAdapter(async config => {
    assert.equal(config.baseURL, 'http://127.0.0.1:8080');
    assert.equal(config.headers.get('Authorization'), `Bearer ${tokens.token}`);
    assert.ok(paths.includes(config.url));
    return response(config);
  });
  for (const path of paths) await apiClient.get(path);
});

test('login and register retain methods, payloads and endpoints', async () => {
  const tokens = credentials(2);
  const registration = { username: 'student', email: 'student@example.invalid', password: 'fixture-only', timeZone: 'UTC' };
  useAdapter(async config => {
    assert.equal(config.method, 'post');
    const data = JSON.parse(config.data);
    if (config.url === '/register') {
      assert.deepEqual(data, registration);
      return response(config, { id: 2, active: true });
    }
    assert.equal(config.url, '/login');
    assert.deepEqual(data, { username: 'student', password: 'fixture-only' });
    return response(config, tokens);
  });
  assert.equal((await authService.register(registration)).id, 2);
  assert.equal((await authService.login({ username: 'student', password: 'fixture-only' })).id, 2);
  assert.equal(await tokenStorage.getRefreshToken(), tokens.refreshToken);
});

test('a rejected login does not trigger refresh', async () => {
  let calls = 0;
  useAdapter(async config => { calls++; assert.equal(config.url, '/login'); return reject(config, 401); });
  await assert.rejects(authService.login({ username: 'test', password: 'fixture-only' }));
  assert.equal(calls, 1);
});

test('simultaneous 401s share one refresh and retry each request once', async () => {
  const old = credentials();
  const rotated = credentials(1, false, 'rotated-fixture');
  rotated.token = rotated.token.replace('test.', 'rotated.');
  await tokenStorage.setTokens(old);
  const barrier = deferred();
  const started = deferred();
  let refreshes = 0;
  let originals = 0;
  useAdapter(async config => {
    if (config.url === '/refresh') {
      refreshes++;
      started.resolve();
      await barrier.promise;
      assert.deepEqual(JSON.parse(config.data), { refreshToken: old.refreshToken });
      return response(config, rotated);
    }
    if (!config._retry) { originals++; return reject(config, 401); }
    assert.equal(config.headers.get('Authorization'), `Bearer ${rotated.token}`);
    return response(config, { ok: true });
  });
  const requests = [apiClient.get('/api/profile'), apiClient.get('/users/1/goals')];
  await started.promise;
  await new Promise(resolve => setImmediate(resolve));
  barrier.resolve();
  await Promise.all(requests);
  assert.equal(refreshes, 1);
  assert.equal(originals, 2);
});

test('restoration and an API 401 share refresh; concurrent restores share one result', async () => {
  await tokenStorage.setTokens(credentials(1, true));
  const barrier = deferred();
  const started = deferred();
  let refreshes = 0;
  useAdapter(async config => {
    if (config.url === '/refresh') {
      refreshes++; started.resolve(); await barrier.promise;
      return response(config, credentials());
    }
    return config._retry ? response(config) : reject(config, 401);
  });
  const first = authService.restoreSession();
  assert.equal(first, authService.restoreSession());
  const request = apiClient.get('/api/profile');
  await started.promise;
  await new Promise(resolve => setImmediate(resolve));
  barrier.resolve();
  const [user] = await Promise.all([first, request]);
  assert.equal(user.id, 1);
  assert.equal(refreshes, 1);
});

test('a second 401 is terminal and emits one expiration event', async () => {
  await tokenStorage.setTokens(credentials());
  let refreshes = 0;
  let apiCalls = 0;
  let expired = 0;
  const unsubscribe = subscribeToSessionExpiration(() => { expired++; });
  useAdapter(async config => {
    if (config.url === '/refresh') { refreshes++; return response(config, credentials()); }
    apiCalls++; return reject(config, 401);
  });
  try {
    await assert.rejects(apiClient.get('/api/profile'));
    assert.equal(refreshes, 1);
    assert.equal(apiCalls, 2);
    assert.equal(expired, 1);
    assert.equal(await tokenStorage.getAccessToken(), null);
  } finally { unsubscribe(); }
});

test('explicit refresh rejection clears tokens; transient failures preserve them', async () => {
  for (const status of [400, 401, 403, 429, 500, 503, undefined]) {
    const tokens = credentials(1, true);
    await tokenStorage.setTokens(tokens);
    useAdapter(async config => {
      if (config.url !== '/refresh') return reject(config, 401);
      if (status) return reject(config, status);
      throw new AxiosError('Fixture offline', 'ERR_NETWORK', config);
    });
    const operation = authService.restoreSession();
    if ([400, 401, 403].includes(status)) assert.equal(await operation, null);
    else await assert.rejects(operation);
    assert.equal(await tokenStorage.getRefreshToken(), [400, 401, 403].includes(status) ? null : tokens.refreshToken);
    await tokenStorage.clear();
  }
});

test('invalid refresh credentials cannot replace the stored session', async () => {
  await tokenStorage.setTokens(credentials(1, true));
  useAdapter(async config => response(config, { token: 'invalid', refreshToken: 'fixture' }));
  await assert.rejects(authService.restoreSession(), /Invalid credentials/);
  assert.equal(await tokenStorage.getAccessToken(), null);
});

test('API connectivity failures are distinct from configuration errors and retain credentials', async () => {
  const tokens = credentials();
  await tokenStorage.setTokens(tokens);
  for (const code of ['ERR_NETWORK', 'ECONNABORTED']) {
    useAdapter(async config => { throw new AxiosError('Fixture network error', code, config); });
    await assert.rejects(apiClient.get('/api/profile'), error => {
      assert.match(getApiErrorMessage(error), code === 'ERR_NETWORK' ? /Cannot connect/ : /timed out/);
      return true;
    });
    assert.equal(await tokenStorage.getAccessToken(), tokens.token);
  }
});

test('a fresh service instance restores persisted credentials without a login', async () => {
  const tokens = credentials(3);
  await tokenStorage.setTokens(tokens);
  assert.equal(persisted.get('studystreak.accessToken'), tokens.token);
  const restarted = await import('../src/services/authService.ts?restart');
  assert.equal((await restarted.authService.restoreSession()).id, 3);
});

test('logout clears local tokens even while its network request fails', async () => {
  const tokens = credentials();
  await tokenStorage.setTokens(tokens);
  useAdapter(async config => {
    assert.equal(config.url, '/logout');
    assert.equal(await tokenStorage.getAccessToken(), null);
    assert.deepEqual(JSON.parse(config.data), { refreshToken: tokens.refreshToken });
    throw new AxiosError('Fixture offline', 'ERR_NETWORK', config);
  });
  await authService.logout();
  assert.equal(await tokenStorage.getRefreshToken(), null);
});

test('an old 401 or successful response cannot retry or return data under a new account', async () => {
  for (const status of [200, 401]) {
    await tokenStorage.setTokens(credentials(1));
    const started = deferred();
    const finish = deferred();
    let requests = 0;
    useAdapter(async config => {
      requests++; started.resolve(); await finish.promise;
      return status === 200 ? response(config, { private: 'old-account-fixture' }) : reject(config, status);
    });
    const pending = assert.rejects(apiClient.get('/api/profile'), /session changed/);
    await started.promise;
    await tokenStorage.clear();
    await tokenStorage.setTokens(credentials(2));
    finish.resolve();
    await pending;
    assert.equal(requests, 1);
    assert.equal(await tokenStorage.getRefreshToken(), credentials(2).refreshToken);
  }
});

test('a pending refresh from another account cannot overwrite or clear the new login', async () => {
  for (const status of [200, 401]) {
    await tokenStorage.setTokens(credentials(1, true));
    const started = deferred();
    const finish = deferred();
    useAdapter(async config => {
      if (config.url === '/login') return response(config, credentials(2));
      assert.equal(config.url, '/refresh');
      started.resolve(); await finish.promise;
      return status === 200 ? response(config, credentials(1)) : reject(config, status);
    });
    const restoration = authService.restoreSession().catch(() => null);
    await started.promise;
    assert.equal((await authService.login({ username: 'second', password: 'fixture-only' })).id, 2);
    finish.resolve();
    assert.equal(await restoration, null);
    assert.equal(await tokenStorage.getRefreshToken(), credentials(2).refreshToken);
  }
});

test('requests issued during login cannot return the previous account after login succeeds', async () => {
  await tokenStorage.setTokens(credentials(1));
  const loginStarted = deferred();
  const loginFinish = deferred();
  const requestStarted = deferred();
  const requestFinish = deferred();
  useAdapter(async config => {
    if (config.url === '/login') {
      loginStarted.resolve(); await loginFinish.promise;
      return response(config, credentials(2));
    }
    requestStarted.resolve(); await requestFinish.promise;
    return response(config, { private: 'old-account-fixture' });
  });
  const login = authService.login({ username: 'second', password: 'fixture-only' });
  await loginStarted.promise;
  const pending = assert.rejects(apiClient.get('/api/profile'), /session changed/);
  await requestStarted.promise;
  loginFinish.resolve();
  assert.equal((await login).id, 2);
  requestFinish.resolve();
  await pending;
  assert.equal(await tokenStorage.getRefreshToken(), credentials(2).refreshToken);
});

test('logout wins over a refresh already writing a SecureStore token pair', async () => {
  await tokenStorage.setTokens(credentials(1, true));
  const started = deferred();
  const finish = deferred();
  useAdapter(async config => response(config, credentials()));
  blockNextWrite({ started, finish });
  const restoration = assert.rejects(authService.restoreSession(), /session changed/);
  await started.promise;
  const logout = authService.logout();
  finish.resolve();
  await Promise.all([restoration, logout]);
  assert.equal(await tokenStorage.getAccessToken(), null);
  assert.equal(await tokenStorage.getRefreshToken(), null);
});

test('invalid configuration blocks every transport, preserves session until logout and never echoes secrets', async () => {
  const original = process.env.EXPO_PUBLIC_API_URL;
  try {
    const values = [undefined, '', '   ', '/api', 'ftp://example.invalid', 'http://user:secret-value@example.invalid',
      'https://example.invalid?token=secret-value', 'https://example.invalid#secret-value'];
    for (const [index, value] of values.entries()) {
      if (value === undefined) delete process.env.EXPO_PUBLIC_API_URL;
      else process.env.EXPO_PUBLIC_API_URL = value;
      await import(`./helpers/apiConfigurationScenario.mjs?configuration=${index}`);
    }
  } finally { process.env.EXPO_PUBLIC_API_URL = original; }
});

test('session/configuration paths contain no diagnostic logging of credentials', async () => {
  const messages = [];
  const methods = ['log', 'info', 'warn', 'error', 'debug'];
  const originals = methods.map(method => console[method]);
  for (const method of methods) console[method] = (...args) => messages.push(args);
  try {
    useAdapter(async config => response(config, credentials()));
    await authService.login({ username: 'test', password: 'fixture-only' });
    await authService.restoreSession();
    await authService.logout();
  } finally { methods.forEach((method, index) => { console[method] = originals[index]; }); }
  assert.deepEqual(messages, []);
  for (const file of ['apiClient', 'authService', 'tokenStorage', 'sessionRefresh']) {
    assert.doesNotMatch(readFileSync(new URL(`../src/services/${file}.ts`, import.meta.url), 'utf8'), /console\./);
  }
});
