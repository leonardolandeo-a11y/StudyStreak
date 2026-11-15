import assert from 'node:assert/strict';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { roomPolishFixture } from '../../scripts/tests/roomPolishFixture.mjs';
const fixture=roomPolishFixture(),writes=[];
const browser=await mobileBrowser({intercept:async request=>{
 const path=new URL(request.url).pathname;
 if(path.endsWith('/invitation')){writes.push('regenerate');return{body:fixture.room()};}
 if(path.includes('/media/members/')){writes.push('remove');return{status:204};}
 if(path.includes('/host/')){writes.push('host');return{body:fixture.room()};}
 return fixture.intercept(request);
}});
const shown=label=>`Array.from(document.querySelectorAll('[aria-label="${label}"]')).some(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`;
try{
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await browser.command('Browser.grantPermissions',{origin:browser.origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
 await browser.navigate('/');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);
 await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');await browser.wait(shown('Open menu'));
 await browser.click('Open menu');await browser.click('Menu');await browser.waitForDrawerClosed();await browser.click('Study Rooms');await browser.wait(shown('Open study room Campus study circle'));await browser.click('Open study room Campus study circle');
 await browser.wait(shown('Copy code'));await browser.click('Copy code');await browser.wait(shown('Copied'));assert.equal(await browser.evaluate('navigator.clipboard.readText()'),'ABCDEFGHIJ');
 assert.equal(await browser.evaluate(`(()=>{const e=document.querySelector('[data-testid="room-invite-actions"]');return !!e.querySelector('[aria-label="Copied"]')&&!!e.querySelector('[aria-label="Regenerate invitation code"]')})()`),true);
 await browser.click('Regenerate invitation code');await browser.wait(shown('Replace'));await browser.click('Cancel room action');assert.deepEqual(writes,[]);
 for(const width of [320,390,768]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});
  assert.equal(await browser.evaluate(`(()=>{const a=document.querySelector('[data-testid="shared-pomodoro-circle"]').getBoundingClientRect(),b=document.querySelector('[data-testid="shared-timer-controls"]').getBoundingClientRect();return Math.abs(a.width-a.height)<1&&b.top>=a.bottom})()`),true);
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 }
 await browser.click('Participants (12)');await browser.wait(shown('Make LunaStudy host'));await browser.wait(shown('View profile of LunaStudy'));
 assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('[aria-label="View profile of LunaStudy"]')).filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).some(e=>e.textContent.includes('View profile'))`),false);
 await browser.click('Make LunaStudy host');await browser.wait(shown('Transfer'));await browser.click('Cancel room action');assert.deepEqual(writes,[]);
 await browser.click('Remove LunaStudy from room');await browser.wait(shown('Confirm remove participant'));assert.deepEqual(writes,[]);await browser.click('Keep participant');assert.deepEqual(writes,[]);
 await browser.click('Remove LunaStudy from room');await browser.click('Confirm remove participant');await browser.wait(`!${shown('Confirm remove participant')}`);
 for(let i=0;i<100&&!writes.length;i++)await new Promise(resolve=>setTimeout(resolve,25));
 assert.deepEqual(writes,['remove']);
 fixture.setHost(false);await browser.wait(`document.body.textContent.includes('Only the host can control the shared timer.')`);
 await browser.wait('!'+shown('Regenerate invitation code'));assert.equal(await browser.evaluate(shown('Make LunaStudy host')),false);assert.equal(await browser.evaluate(shown('Remove LunaStudy from room')),false);
 fixture.setHost(true);await browser.wait(shown('Regenerate invitation code'));fixture.setConnectionFailure(true);await browser.wait(`document.body.textContent.includes('Connection or action needs attention')`);
 // Preserve the existing 15-second stale threshold; a single failed poll is insufficient.
 for(let i=0;i<400;i++){
  if(await browser.evaluate(`document.querySelector('[aria-label="Regenerate invitation code"]').getAttribute('aria-disabled')==='true'`))break;
  await new Promise(resolve=>setTimeout(resolve,50));
 }
 assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Regenerate invitation code"]').getAttribute('aria-disabled')==='true'`),true);
 fixture.setConnectionFailure(false);await browser.wait(`document.querySelector('[aria-label="Regenerate invitation code"]').getAttribute('aria-disabled')!=='true'`);
 assert.deepEqual(browser.errors,[]);console.log('M4 rooms passed: host/member, copy, confirmations, stacked circle/controls, roles/reconnect and 320/390/768.');
}finally{await browser.close();}
