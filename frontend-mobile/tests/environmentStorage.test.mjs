import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {files,File} from './helpers/appearanceFileSystemMock.mjs';
const {environmentStorage}=await import('../src/services/environmentStorage.ts');
const {dashboardWidgetStorage}=await import('../src/services/dashboardWidgetStorage.ts');
test('multiple mounted routes serialize writes and Back reads the newest completed account file',async()=>{
 files.clear();const dashboard=environmentStorage(101),settings=environmentStorage(101),other=environmentStorage(202);
 await dashboardWidgetStorage(101).write('keep-widgets');
 const first=settings.write('{"selection":"library","motion":false}');
 const last=environmentStorage(101).write('{"selection":"cafe","motion":true}');
 assert.equal(await dashboard.read(),'{"selection":"cafe","motion":true}');await Promise.all([first,last]);
 assert.equal(await other.read(),null);assert.equal(await environmentStorage(101).read(),'{"selection":"cafe","motion":true}');
 assert.equal(await dashboardWidgetStorage(101).read(),'keep-widgets');assert.ok([...files.keys()].some(k=>k.endsWith('study-environments/account-101.json')));assert.ok(![...files.keys()].some(k=>k.endsWith('.tmp')));
});
test('a failed atomic move keeps the previous file and retry cleans its temporary file',async()=>{
 files.clear();const storage=environmentStorage(303);await storage.write('previous');const move=File.prototype.move;
 File.prototype.move=async()=>{throw Error('disk full')};
 try{await assert.rejects(storage.write('next'));assert.equal(await storage.read(),'previous');}finally{File.prototype.move=move;}
 await storage.write('retry');assert.equal(await storage.read(),'retry');assert.ok(![...files.keys()].some(k=>k.endsWith('.tmp')));
});
