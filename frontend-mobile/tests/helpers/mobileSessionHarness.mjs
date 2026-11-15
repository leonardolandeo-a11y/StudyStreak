import { registerHooks } from 'node:module';
import { extname } from 'node:path';

const sourceRoot = new URL('../../src/', import.meta.url).href;
const secureStore = new URL('./secureStoreMock.mjs', import.meta.url).href;

// Exercise the actual TS services with real Axios interceptors, replacing only
// native storage/platform. No Expo runtime, external server or database is used.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'react-native') {
      return { url: 'data:text/javascript,export const Platform = { OS: "ios" };', shortCircuit: true };
    }
    if (specifier === 'expo-secure-store') return { url: secureStore, shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot)) {
      const resolved = nextResolve(extname(specifier) ? specifier : `${specifier}.ts`, context);
      // Isolate module-level API configuration between scenarios without child
      // processes, which may be unavailable in restricted test environments.
      const url = new URL(resolved.url);
      if (url.href.startsWith(sourceRoot) && !url.search) url.search = new URL(context.parentURL).search;
      return { ...resolved, url: url.href };
    }
    return nextResolve(specifier, context);
  },
});

export function credentials(userId = 1, expired = false, refreshToken = `test-refresh-${userId}`) {
  const payload = { type: 'access', userId, sub: `student-${userId}`, email: `student-${userId}@example.invalid`,
    role: 'USER', exp: Math.floor(Date.now() / 1000) + (expired ? -100 : 3600) };
  return { token: `test.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`, refreshToken };
}

export function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
