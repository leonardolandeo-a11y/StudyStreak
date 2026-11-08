import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { extname } from 'node:path';
import ts from 'typescript';

const root = new URL('../../src/', import.meta.url).href;
const mocks = new Map([
  ['react-native', './appearanceNativeMock.mjs'],
  ['react-native-safe-area-context', './appearanceNativeMock.mjs'],
  ['expo-router', './appearanceRouterMock.mjs'],
  ['expo-secure-store', './secureStoreMock.mjs'],
  ['expo-file-system', './appearanceFileSystemMock.mjs'],
  ['expo-audio', './focusAudioMock.mjs'],
]);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (mocks.has(specifier)) return { url: new URL(mocks.get(specifier), import.meta.url).href, shortCircuit: true };
    if (specifier.endsWith('/hooks/useAuth')) {
      return { url: new URL('./appearanceAuthMock.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith(root) && !extname(specifier)) {
      const suffix = existsSync(new URL(`${specifier}.tsx`, context.parentURL)) ? '.tsx' : '.ts';
      return nextResolve(`${specifier}${suffix}`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root) && url.endsWith('.tsx')) {
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      }).outputText };
    }
    return nextLoad(url, context);
  },
});
