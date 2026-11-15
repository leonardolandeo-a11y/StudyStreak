import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
export async function reviewRoom(browser,platform,fixture){
 const mobile=platform==='mobile',before=process.env.ROOM_REVIEW_BASELINE==='1';
 const root=resolve(process.env.ROOM_REVIEW_CAPTURES||'../docs/images/retro-pixel-academia-7-4c');mkdirSync(root,{recursive:true});
 const capture=async name=>{const r=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(root,`${before?'before':'after'}-${platform}-${name}.png`),Buffer.from(r.data,'base64'));};
 if(mobile){await browser.navigate('/');await browser.wait(`!!document.querySelector('[aria-label="Username"]')`);await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');await browser.wait(`!!document.querySelector('[aria-label="Open menu"]')`);await browser.click('Open menu');await browser.click('Menu');await browser.waitForDrawerClosed();await browser.click('Study Rooms');await browser.wait(`!!document.querySelector('[aria-label="Open study room Campus study circle"]')`);await browser.click('Open study room Campus study circle');}
 else{await browser.navigate('/study-rooms');await browser.wait(`document.body.innerText.includes('Campus study circle')`);await browser.evaluate(`Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Campus study circle'))?.click()`);}
 await browser.wait(`document.body.innerText.includes('Study note')`);
 for(const width of mobile?[390,768]:[390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await capture(`room-${width}`);
 }
 if(before){console.log(platform+' baseline captured');return;}
 const press=async label=>{await browser.evaluate(`(()=>{const e=Array.from(document.querySelectorAll('button,a,[role="button"],[role="tab"],[role="radio"]')).find(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')&&(e.getAttribute('aria-label')===${JSON.stringify(label)}||e.textContent.trim()===${JSON.stringify(label)}));if(!e)throw Error('Missing '+${JSON.stringify(label)});e.scrollIntoView({block:'center'});e.focus();e.click();})()`);};
 const area=mobile?'[aria-label="Room message"]':'#room-message';
 const viewport=mobile?'[data-testid="room-chat-scroll"]':'.room-chat-scroll';
 const rows=mobile?'[data-testid^="room-message-"]':'[data-message]';
 const messages=()=>browser.evaluate(`Array.from(document.querySelectorAll('${rows}')).map(e=>${mobile?"e.dataset.testid.slice(13)":"e.dataset.message"})`);
 const sends=()=>fixture.requests.filter(r=>r.path.endsWith('/collaboration/messages')&&r.method==='POST');
 await browser.fill(area,'Draft kept across tabs');await press('Participants (3)');
 await browser.wait(`!!document.querySelector('[aria-label="View profile of LunaStudy"]')`);
 assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="View profile of A very long academic companion name"]')`),false,'Room membership never grants profile access');
 await capture('participants');
 if(!mobile){
  await browser.evaluate(`document.querySelector('.room-participants summary').click()`);
  assert.equal(await browser.evaluate(`!!document.querySelector('.room-participants details button')`),true,'Existing media moderation is presented in Participants');
  await browser.evaluate('window.__confirmParticipant=false;window.confirm=()=>window.__confirmParticipant');await press('Remove');
 }else{await press('Remove from room');await press('Keep participant');}
 assert.equal(fixture.requests.filter(r=>r.method==='DELETE'&&r.path.includes('/media/members/')).length,0);
 await press('Allow screen sharing');await browser.wait(`Array.from(document.querySelectorAll('button,[role="button"]')).some(e=>e.textContent==='Revoke screen permission')`);
 await press('Chat');assert.equal(await browser.evaluate(`document.querySelector('${area}').value`),'Draft kept across tabs');
 await browser.fill(area,'');await press('Send message');assert.equal(sends().length,0);
 // Scroll into history without replacing the live page, keeping the first visible row anchored.
 await browser.evaluate(`(()=>{const e=document.querySelector('${viewport}');e.scrollTop=1;e.dispatchEvent(new Event('scroll'));})()`);
 const anchor=await browser.evaluate(`(()=>{const box=document.querySelector('${viewport}'),row=Array.from(document.querySelectorAll('${rows}')).find(e=>e.getBoundingClientRect().bottom>box.getBoundingClientRect().top+14);return{id:${mobile?"row.dataset.testid.slice(13)":"row.dataset.message"},y:row.getBoundingClientRect().top-box.getBoundingClientRect().top};})()`);
 if(mobile)await press('Load earlier messages');else await browser.evaluate(`document.querySelector('${viewport}').dispatchEvent(new WheelEvent('wheel',{deltaY:-150,bubbles:true}))`);
 await browser.wait(`document.querySelectorAll('${rows}').length===50`);
 const anchorPosition=`(()=>{const box=document.querySelector('${viewport}'),row=Array.from(document.querySelectorAll('${rows}')).find(e=>${mobile?"e.dataset.testid.slice(13)":"e.dataset.message"}===${JSON.stringify(anchor.id)});return row.getBoundingClientRect().top-box.getBoundingClientRect().top;})()`;
 await browser.wait(`Math.abs((${anchorPosition})-${anchor.y})<5`);
 const anchored=await browser.evaluate(anchorPosition);
 assert.ok(Math.abs(anchored-anchor.y)<5,`Prepending must keep reading position: ${anchor.y} -> ${anchored}`);
 assert.deepEqual(fixture.requests.filter(r=>r.path.endsWith('/collaboration')&&r.page>0).map(r=>r.page),[1]);
 fixture.addMessage();await browser.wait(`document.querySelectorAll('${rows}').length===51`);
 assert.equal(await browser.evaluate(`(()=>{const e=document.querySelector('${viewport}');return e.scrollHeight-e.scrollTop-e.clientHeight>150;})()`),true,'A new message never drags a history reader to the bottom');
 const ids=await messages();assert.equal(new Set(ids).size,ids.length);await capture('history');
 await browser.evaluate(`(()=>{const e=document.querySelector('${viewport}');e.scrollTop=1;e.dispatchEvent(new Event('scroll'));})()`);await new Promise(resolve=>setTimeout(resolve,80));
 const oldestAnchor=await browser.evaluate(`(()=>{const box=document.querySelector('${viewport}'),row=Array.from(document.querySelectorAll('${rows}')).find(e=>e.getBoundingClientRect().bottom>box.getBoundingClientRect().top+14);return{id:${mobile?"row.dataset.testid.slice(13)":"row.dataset.message"},y:row.getBoundingClientRect().top-box.getBoundingClientRect().top};})()`);
 if(mobile)await press('Load earlier messages');else await browser.evaluate(`document.querySelector('${viewport}').dispatchEvent(new WheelEvent('wheel',{deltaY:-150,bubbles:true}))`);
 await browser.wait(`document.querySelectorAll('${rows}').length===${fixture.messages.length}`);
 await browser.wait(`(()=>{const box=document.querySelector('${viewport}'),row=Array.from(document.querySelectorAll('${rows}')).find(e=>${mobile?"e.dataset.testid.slice(13)":"e.dataset.message"}===${JSON.stringify(oldestAnchor.id)});return Math.abs(row.getBoundingClientRect().top-box.getBoundingClientRect().top-${oldestAnchor.y})<5;})()`);
 const allIds=await messages();assert.equal(new Set(allIds).size,allIds.length);assert.deepEqual(fixture.requests.filter(r=>r.path.endsWith('/collaboration')&&r.page>0).map(r=>r.page),[1,2]);
 await browser.evaluate(`(()=>{const e=document.querySelector('${viewport}');e.scrollTop=e.scrollHeight;e.dispatchEvent(new Event('scroll'));})()`);
 // Let Native's throttled scroll callback finish before the next typing gesture.
 if(mobile)await new Promise(resolve=>setTimeout(resolve,120));
 const prior=sends().length;
 if(!mobile){
  await browser.fill(area,'Keyboard submission');await browser.command('Page.bringToFront');await browser.evaluate(`document.querySelector('${area}').focus()`);
  await browser.command('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8,text:'\r'});await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8});
  assert.equal(sends().length,prior);assert.ok(await browser.evaluate(`document.querySelector('${area}').value.includes(String.fromCharCode(10))`),'Shift+Enter inserts a line break');
  await browser.key('Enter');await browser.wait(`document.querySelector('${area}').value===''`);assert.equal(sends().length,prior+1);
 }
 fixture.failSend();await browser.fill(area,'Retry confirmed message');await press('Send message');await browser.wait(`document.body.innerText.includes('Message not confirmed')`);
 const failed=sends().at(-1);await press('Send message');await browser.wait(`document.querySelector('${area}').value===''`);assert.equal(sends().at(-1).body.id,failed.body.id);
 await browser.wait(`document.querySelectorAll('${rows}').length>${ids.length}`);
 await browser.wait(`(()=>{const e=document.querySelector('${viewport}');return e.scrollHeight-e.scrollTop-e.clientHeight<80})()`);
 // Confirm or cancel host-only deletion using the real UI controls.
 const deletes=()=>fixture.requests.filter(r=>r.method==='DELETE'&&r.path.includes('/collaboration/messages/'));
 if(!mobile)await browser.evaluate('window.__confirmRemoval=false;window.confirm=()=>window.__confirmRemoval');
 await press('Delete message by LunaStudy');
 if(mobile)await press('Keep message');assert.equal(deletes().length,0);
 if(!mobile)await browser.evaluate('window.__confirmRemoval=true');await press('Delete message by LunaStudy');if(mobile)await press('Confirm delete message');
 await browser.wait(`document.body.innerText.includes('Message removed by host')`);assert.equal(deletes().length,1);
 await press('☺ Reactions');await press('React 👏');await browser.wait(`document.body.innerText.includes('Scholar')&&document.body.innerText.includes('👏')&&${mobile?"document.querySelector('[aria-label=\"React 👏\"]').getAttribute('aria-checked')==='true'":"document.querySelector('[aria-label=\"React 👏\"]').getAttribute('aria-pressed')==='true'"}`);
 await press('Raise hand');await browser.wait(`document.body.innerText.includes('Lower hand')`);
 const reaction=fixture.requests.find(r=>r.path.endsWith('/reaction'));assert.deepEqual(reaction.body,{reaction:'👏'});assert.equal(reaction.method,'POST');
 assert.equal(await browser.evaluate(mobile?`document.querySelector('[aria-label="React 👏"]').getAttribute('aria-checked')==='true'`:`document.querySelector('[aria-label="React 👏"]').getAttribute('aria-pressed')==='true'`),true,'Own reaction is visually selected');
 fixture.setFeedFailure(true);await browser.wait(`document.body.innerText.includes('Chat unavailable')`);fixture.setFeedFailure(false);await press('Retry chat');await browser.wait(`!document.body.innerText.includes('Chat unavailable')`);
 await press(mobile?'Start timer':'Start');await browser.wait(`document.body.innerText.includes('Timer running')`);await press(mobile?'Pause timer':'Pause');await browser.wait(`document.body.innerText.includes('Timer paused')`);
 // Destructive timer commands keep their existing confirmations and server versions.
 const beforeReset=fixture.requests.filter(r=>r.path.endsWith('/timer')).length;
 if(!mobile)await browser.evaluate('window.__confirmRemoval=false');
 await press(mobile?'↻ Reset':'Reset timer');if(mobile){await press('Keep room unchanged');await browser.wait(`!document.querySelector('[aria-label="Cancel room action"]')`);}
 assert.equal(fixture.requests.filter(r=>r.path.endsWith('/timer')).length,beforeReset);
 if(!mobile)await browser.evaluate('window.__confirmRemoval=true');
 await press(mobile?'↻ Reset':'Reset timer');if(mobile)await press('Reset');await browser.wait(`document.body.innerText.includes('25:00')`);
 await press('5-min break');if(mobile)await press('Change phase');await browser.wait(`document.body.innerText.includes('GROUP BREAK')`);
 await press('25-min focus');if(mobile)await press('Change phase');await browser.wait(`document.body.innerText.includes('SHARED FOCUS')`);
 const timerCalls=fixture.requests.filter(r=>r.path.endsWith('/timer'));assert.ok(timerCalls.every(r=>Number.isInteger(r.body.expectedVersion)),'Timer controls keep the expected server version');
 assert.equal(await browser.evaluate(`document.body.innerText.includes('Synced · server confirmed')`),false);
 await browser.evaluate(`window.__roomReviewHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__roomReviewHidden});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__roomReviewHidden?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'));`);
 await new Promise(resolve=>setTimeout(resolve,150));
 const paused=fixture.requests.filter(r=>r.path.endsWith('/collaboration')).length;await new Promise(resolve=>setTimeout(resolve,2650));assert.equal(fixture.requests.filter(r=>r.path.endsWith('/collaboration')).length,paused,'Chat polling pauses in background');
 await browser.evaluate(`window.__roomReviewHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await browser.wait(`document.body.innerText.includes('SHARED FOCUS')`);
 await press('Participants (3)');await press('View profile of LunaStudy');await browser.wait(`location.pathname.includes('/users/3/profile')`);await browser.evaluate('history.back()');
 if(!mobile){await browser.wait(`document.body.innerText.includes('Campus study circle')`);await browser.evaluate(`Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Campus study circle'))?.click()`);}
 await browser.wait(`!!document.querySelector('${viewport}')`);
 fixture.setHost(false);await browser.wait(`!Array.from(document.querySelectorAll('button,[role="button"]')).some(e=>e.getClientRects().length&&['Start','Start timer','Pause','Pause timer'].includes(e.textContent.trim()))`);
 await press('Chat');assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('[aria-label^="Delete message by"]')).some(e=>e.getClientRects().length)`),false);
 for(const width of [320,390,768,1440]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
 await capture('member');
 if(mobile){
  for(const mode of ['Dark','Light','System'])for(const accent of ['Mint','Blue','Purple','Orange']){
   await browser.click('Open menu');await browser.click('Settings');await browser.click(mode);await browser.click(accent);await browser.evaluate('history.back()');await browser.waitForDrawerClosed();await browser.wait(`!!document.querySelector('${viewport}')`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  }
  await browser.click('Open menu');await browser.click('Settings');await browser.click('Light');await browser.click('Purple');await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);await browser.evaluate('history.back()');await browser.waitForDrawerClosed();await browser.wait(`!!document.querySelector('${viewport}')`);await capture('light-purple');
 }
 if(!mobile){for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');}await capture('light-orange');}
 const imageRequests=fixture.requests.filter(r=>r.path.endsWith('/avatar'));assert.ok(imageRequests.length>0&&imageRequests.every(r=>r.authorized),'Images use authenticated API requests');
 assert.equal(fixture.requests.some(r=>/ledger|focus-sessions/.test(r.path)&&r.method!=='GET'),false);
 assert.deepEqual(browser.errors,[]);
 console.log(platform+': responsive collaboration, tabs, profiles/permissions, history anchoring, live arrivals, send/retry UUID, host confirmation, reactions, timer versions and recovery passed.');
}
