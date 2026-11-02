import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Contract checks complement ESLint and the TypeScript/Vite build.
const client = readFileSync(new URL("../src/services/apiClient.ts", import.meta.url), "utf8");
const errors = readFileSync(new URL("../src/utils/apiError.ts", import.meta.url), "utf8");

test("sets a finite 15-second limit on regular API calls", () => {
    assert.match(client, /const API_REQUEST_TIMEOUT_MS = 15000;/);
    const settings = client.match(/const apiClient = axios\.create\(\{([\s\S]*?)\n\}\);/)?.[1];
    assert.ok(settings, "Expected a configured Axios client");
    assert.match(settings, /timeout:\s*API_REQUEST_TIMEOUT_MS\s*,/);
});

test("also limits the standalone refresh request", () => {
    const refresh = client.match(/refreshTask = axios\.post<LoginResponse>\(([\s\S]*?)\)\.then/)?.[1];
    assert.ok(refresh, "Expected the single-flight refresh request");
    assert.match(refresh, /\{ refreshToken \},\s*\{ timeout: API_REQUEST_TIMEOUT_MS \}/);
});

test("keeps a friendly timeout-specific error message", () => {
    assert.match(errors, /ECONNABORTED/);
    assert.match(errors, /ETIMEDOUT/);
    assert.match(errors, /The request timed out\. Please try again\./);
});
