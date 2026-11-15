import './mobileSessionHarness.mjs';
import assert from 'node:assert/strict';
import axios, { AxiosError } from 'axios';

const scenario = new URL(import.meta.url).search;
const { apiClient } = await import(`../../src/services/apiClient.ts${scenario}`);
const { authService } = await import(`../../src/services/authService.ts${scenario}`);
const { tokenStorage } = await import(`../../src/services/tokenStorage.ts${scenario}`);
const { getApiErrorMessage } = await import(`../../src/utils/apiError.ts${scenario}`);
const { ApiConfigurationError } = await import(`../../src/config/apiRuntime.ts${scenario}`);
const { credentials } = await import('./mobileSessionHarness.mjs');
let calls = 0;
const adapter = async config => {
  calls++;
  throw new AxiosError('Network unavailable', 'ERR_NETWORK', config);
};
apiClient.defaults.adapter = adapter;
axios.defaults.adapter = adapter;
const tokens = credentials(1, true);
await tokenStorage.setTokens(tokens);
for (const operation of [() => apiClient.get('/api/profile'), () => authService.restoreSession(),
  () => authService.login({ username: 'test', password: 'test-only' }),
  () => authService.register({ username: 'test', email: 'test@example.invalid', password: 'test-only', timeZone: 'UTC' })]) {
  await assert.rejects(operation, error => {
    assert.ok(error instanceof ApiConfigurationError);
    assert.match(getApiErrorMessage(error), /EXPO_PUBLIC_API_URL/);
    assert.doesNotMatch(getApiErrorMessage(error), /Cannot connect|password|signature|secret-value/);
    return true;
  });
}
assert.equal(await tokenStorage.getAccessToken(), tokens.token);
await authService.logout();
assert.equal(await tokenStorage.getAccessToken(), null);
assert.equal(calls, 0);
