import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

for (const mode of ['exit', 'protocol']) test(`Chrome startup ${mode}: preserves the error and releases process, port and profile`, async () => {
  const directory = mkdtempSync(join(tmpdir(), 'studystreak-browser-lifecycle-'));
  const binary = join(directory, 'browser-fixture.mjs'), record = join(directory, 'record.json');
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  writeFileSync(binary, `import { createReadStream, writeFileSync, writeSync } from 'node:fs';
if (process.argv.includes('--version')) { console.log('Chrome lifecycle fixture'); process.exit(0); }
writeFileSync(process.env.BROWSER_RECORD, JSON.stringify({pid:process.pid,folder:process.argv.find(arg=>arg.startsWith('--user-data-dir=')).split('=')[1]}));
if (process.env.BROWSER_FAILURE === 'exit') { console.error('fixture startup failure'); process.exit(23); }
let buffer='';
createReadStream(null,{fd:3}).on('data',chunk=>{
 buffer+=chunk;let end;
 while((end=buffer.indexOf('\\0'))>=0){
  const command=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);
  writeSync(4,JSON.stringify(command.method==='Browser.close'?{id:command.id,result:{}}:{id:command.id,error:{code:-32000,message:'Fixture target refused'}})+'\\0');
  if(command.method==='Browser.close')process.exit(0);
 }
});
`, { mode: 0o755 });
  try {
    const expected = mode === 'exit' ? 'Chrome exited.*code 23.*fixture startup failure' : 'Fixture target refused';
    const probe = `
      import assert from 'node:assert/strict';
      import { existsSync, readFileSync } from 'node:fs';
      import { createServer } from 'node:net';
      import { profileBrowser } from ${JSON.stringify(new URL('./helpers/profileBrowser.mjs', import.meta.url).href)};
      await assert.rejects(profileBrowser({port:${port},browserFixture:process.env.BROWSER_FIXTURE}), new RegExp(${JSON.stringify(expected)}, 's'));
      const {pid,folder}=JSON.parse(readFileSync(process.env.BROWSER_RECORD));
      assert.equal(existsSync(folder), false, 'Chrome profile must be removed after failed setup');
      assert.throws(()=>process.kill(pid,0), {code:'ESRCH'}, 'Chrome must have exited');
      const listener=createServer();
      await new Promise((resolve,reject)=>listener.once('error',reject).listen(${port},'127.0.0.1',resolve));
      await new Promise(resolve=>listener.close(resolve));
    `;
    execFileSync(process.execPath, ['--input-type=module', '-e', probe], {
      env: { ...process.env, BROWSER_FIXTURE: binary, BROWSER_RECORD: record, BROWSER_FAILURE: mode },
      timeout: 30000, stdio: 'pipe',
    });
  } finally {
    if (existsSync(record)) {
      const { pid, folder } = JSON.parse(readFileSync(record));
      try { process.kill(pid, 'SIGKILL'); } catch (error) { assert.equal(error.code, 'ESRCH'); }
      rmSync(folder, { recursive: true, force: true });
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
