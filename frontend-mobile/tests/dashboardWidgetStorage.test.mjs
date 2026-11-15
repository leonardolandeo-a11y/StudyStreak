import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { files } from './helpers/appearanceFileSystemMock.mjs';
const { dashboardWidgetStorage }=await import('../src/services/dashboardWidgetStorage.ts');
test('native files persist layout per account using isolated document files',async()=>{
 files.clear();const a=dashboardWidgetStorage(101),b=dashboardWidgetStorage(202);
 assert.equal(await a.read(),null);await a.write('[{"id":"quick","visible":false}]');assert.equal(await b.read(),null);
 assert.equal(await dashboardWidgetStorage(101).read(),'[{"id":"quick","visible":false}]');
 assert.equal(files.size,1);assert.ok([...files.keys()][0].includes('dashboard-layouts/studystreak-dashboard-v1-101.json'));
 assert.ok(![...files.keys()].some(k=>k.endsWith('.tmp')));
});
