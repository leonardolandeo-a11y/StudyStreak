export * from './appearanceNativeMock.mjs';
export const NativeModules = {};
let expoGo = true;
export function setExpoGo(value) { expoGo = value; }
export function isRunningInExpoGo() { if (expoGo instanceof Error) throw expoGo; return expoGo; }
