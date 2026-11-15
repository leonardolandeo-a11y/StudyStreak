import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readApiConfiguration as webConfig } from '../../frontend-web/src/config/api.ts';
import { readApiConfiguration as mobileConfig } from '../../frontend-mobile/src/config/api.ts';

for (const [name, validate] of [['Web', webConfig], ['Mobile', mobileConfig]]) {
  test(`${name}: development allows local HTTP but production requires HTTPS`, () => {
    assert.equal(validate(' http://127.0.0.1:8080/// ').baseUrl, 'http://127.0.0.1:8080');
    assert.match(validate('http://api.example.test', undefined, true).error, /HTTPS in production/);
    assert.equal(validate('https://api.example.test/study/', undefined, true).baseUrl, 'https://api.example.test/study');
  });
  test(`${name}: invalid or missing addresses are rejected without exposing credentials`, () => {
    assert.ok(validate('', undefined, true).error);
    const invalid = validate('https://user:secret@api.example.test/?key=private', undefined, true);
    assert.ok(invalid.error);
    assert.doesNotMatch(invalid.error, /secret|private/);
  });
}
