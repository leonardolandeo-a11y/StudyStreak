// Opt-in: writes only to the disposable backend on 18087, never localhost:8080.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const exec=promisify(execFile), api='http://127.0.0.1:18087', repo=resolve('..');
async function ready() {
  for(let i=0;i<100;i++) { try {if((await fetch(api+'/api/profile')).status===401)return;}catch{} await new Promise(r=>setTimeout(r,250)); }
  throw Error('Disposable backend did not start');
}
test('real backend: profile edits, images, verified statistics, persistence and application recreation', {
  timeout:180000,skip:process.env.STUDYSTREAK_PROFILE_E2E!=='true'||!chrome?'Opt-in disposable PostgreSQL integration':false
},async()=>{
  await ready();
  const inspection=JSON.parse((await exec('docker',['inspect','studystreak-profile-browser-test'])).stdout)[0];
  assert.ok(inspection.Config.Env.includes('SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:55437/studystreak_schema_check'));
  const username='profile_e2e_'+Date.now(), password='DisposableProfile123!';
  const post=(path,data)=>fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const registered=await post('/register',{username,password,email:username+'@example.invalid',timeZone:'America/Lima'});assert.equal(registered.status,201);
  const user=await registered.json();assert.ok(Number.isSafeInteger(user.id)&&user.id>0);
  const login=await post('/login',{username,password});assert.equal(login.status,200);const credentials=await login.json();assert.ok(credentials.token&&credentials.refreshToken);
  const headers={Authorization:'Bearer '+credentials.token};
  const profile=async()=>{const r=await fetch(api+'/api/profile',{headers});assert.equal(r.status,200);return r.json()};
  assert.equal((await profile()).presentationName,username);
  for(const [source,seconds]of[['INDIVIDUAL',300],['GROUP',360]])await exec('docker',['exec','studystreak-profile-isolated-20261107','psql','-X','-v','ON_ERROR_STOP=1','-U','studystreak_profile_test','-d','studystreak_schema_check','-c',`insert into ss_audit_profile.study_ledger(id,user_id,goal_name,source,state,verified,planned_seconds,confirmed_seconds,started_at,last_seen_at,completed_at) values('${randomUUID()}',${user.id},'Profile browser fixture','${source}','COMPLETE',true,600,${seconds},clock_timestamp()-interval '10 minutes',clock_timestamp(),clock_timestamp())`]);
  assert.equal((await profile()).statistics.verifiedMinutes,11);assert.equal((await profile()).statistics.verifiedSessions,2);
  const page=await profileBrowser({api,port:15173});
  try {
    await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(credentials.token)});sessionStorage.setItem('refreshToken',${JSON.stringify(credentials.refreshToken)})`});
    await page.navigate('/profile');await page.wait('!!document.querySelector("[data-profile-page] h2")');
    const choose=async(slot,extension)=>{const {root}=await page.command('DOM.getDocument');const{nodeId}=await page.command('DOM.querySelector',{nodeId:root.nodeId,selector:`[data-image-slot="${slot}"]`});await page.command('DOM.setFileInputFiles',{nodeId,files:[resolve(repo,'src/test/resources/profile/image.'+extension)]});};
    await page.click('Edit profile');await page.fill('dialog input[autocomplete="nickname"]','  María 李 😀  ');await page.fill('dialog textarea','Compression\n<b>Plain text</b>');await choose('avatar','png');await choose('banner','png');await page.click('Save changes');
    await page.wait('!document.querySelector("dialog") && !!document.querySelector("aside [role=group] img")');
    assert.equal((await profile()).displayName,'María 李 😀');assert.equal((await profile()).bio,'Compression\n<b>Plain text</b>');
    for(const slot of['avatar','banner'])assert.deepEqual(Buffer.from(await(await fetch(api+'/api/profile/'+slot,{headers})).arrayBuffer()),readFileSync(resolve(repo,'src/test/resources/profile/image.png')));
    const running=(await exec('docker',['ps','--filter','name=^/studystreak-profile-browser-test','--format','{{.Names}}'])).stdout.trim().split('\n').filter(Boolean);
    assert.ok(running.length && running.every(n=>n.startsWith('studystreak-profile-browser-test')));
    await exec('docker',['stop',...running]);
    await exec('docker',['run','--detach','--name','studystreak-profile-browser-test-'+Date.now(),'--network','host','--user','1000:1000','--env-file',resolve(repo,'.local/profile-rollout/test-app.env'),'--mount',`type=bind,source=${resolve(repo,'.local/profile-rollout/test-images')},target=/var/lib/studystreak/profile-images`,'studystreak-local-backend:dev']);
    await ready();await page.reload();await page.wait('document.querySelector("[data-profile-page] h2")?.textContent==="María 李 😀" && !!document.querySelector("aside [role=group] img")');
    for(const slot of['avatar','banner'])assert.deepEqual(Buffer.from(await(await fetch(api+'/api/profile/'+slot,{headers})).arrayBuffer()),readFileSync(resolve(repo,'src/test/resources/profile/image.png')));
    await page.click('Edit profile');await choose('avatar','jpg');await choose('banner','webp');await page.click('Save changes');await page.wait('!document.querySelector("dialog")');
    assert.equal((await fetch(api+'/api/profile/avatar',{headers})).headers.get('Content-Type'),'image/jpeg');assert.equal((await fetch(api+'/api/profile/banner',{headers})).headers.get('Content-Type'),'image/webp');
    await page.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await page.wait('!!document.querySelector("img[alt^=Your]")');
    const screenshot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(repo,'.local/profile-rollout/profile-real-desktop.png'),Buffer.from(screenshot.data,'base64'));
    await page.click('Edit profile');await page.click('Remove avatar');await page.click('Remove banner');await page.click('Save changes');await page.wait('!document.querySelector("dialog") && !document.querySelector("aside [role=group] img")');
    for(const slot of['avatar','banner'])assert.equal((await fetch(api+'/api/profile/'+slot,{headers})).status,404);
    await page.reload();await page.wait('document.querySelector("[data-profile-page] h2")?.textContent==="María 李 😀"');
    const stats=await(await fetch(api+'/api/focus-sessions/stats?days=7',{headers})).json();assert.equal(stats.verifiedPeriod.minutes,11);assert.equal(stats.verifiedPeriod.sessions,2);assert.equal((await profile()).statistics.verifiedMinutes,stats.verifiedPeriod.minutes);
    assert.equal((await fetch(api+'/api/profile')).status,401);assert.deepEqual(page.errors,[]);
    const refresh=await post('/refresh',{refreshToken:credentials.refreshToken});assert.equal(refresh.status,200);const refreshed=await refresh.json();assert.equal((await post('/logout',{refreshToken:refreshed.refreshToken})).status,204);
  }finally{await page.close();}
});
