import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {roomLayoutFixture,token} from './helpers/roomLayoutFixture.mjs';
const before=process.env.F2_BEFORE==='1';
const output=new URL('../../docs/images/final-ui-f2/',import.meta.url);mkdirSync(output,{recursive:true});
test('room layout, identity and compact administration preserve server actions',{timeout:180000},async()=>{
 const fixture=roomLayoutFixture(),browser=await profileBrowser({desktopPointer:true,cacheDir:fileURLToPath(new URL('../../.local/f2/vite-cache/',import.meta.url)),aliases:{'livekit-client':fileURLToPath(new URL('./helpers/roomMediaViewMock.mjs',import.meta.url))},intercept:fixture.intercept});
 const press=async label=>{await browser.wait(`Array.from(document.querySelectorAll('button,a,[role=tab]')).some(e=>e.getClientRects().length&&!e.disabled&&(e.getAttribute('aria-label')===${JSON.stringify(label)}||e.textContent.trim()===${JSON.stringify(label)}))`);await browser.evaluate(`(()=>{const b=Array.from(document.querySelectorAll('button,a,[role=tab]')).find(e=>e.getClientRects().length&&(e.getAttribute('aria-label')===${JSON.stringify(label)}||e.textContent.trim()===${JSON.stringify(label)}));if(!b)throw Error('Missing '+${JSON.stringify(label)});b.scrollIntoView({block:'center'});b.focus();b.click()})()`);};
 const participants=()=>browser.evaluate('document.querySelector("#room-tab-participants").click()');
 const capture=async(name,full=false)=>{await browser.evaluate('document.activeElement?.blur();window.scrollTo(0,0)');const metrics=await browser.command('Page.getLayoutMetrics');const shot=await browser.command('Page.captureScreenshot',{format:'png',captureBeyondViewport:full,...(full?{clip:{x:0,y:0,width:metrics.cssContentSize.width,height:Math.min(3600,metrics.cssContentSize.height),scale:1}}:{})});writeFileSync(new URL(`${before?'before':'after'}-${name}.png`,output),Buffer.from(shot.data,'base64'));};
 const open=async()=>{await browser.wait(`!!document.querySelector('.room-layout')||Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Campus study circle'))`);if(await browser.evaluate(`!!document.querySelector('.room-layout')`))return;await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('Campus study circle'))`);await browser.evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Campus study circle')).click()`);await browser.wait('!!document.querySelector("#room-message")');};
 const measure=()=>browser.evaluate(`(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,right:r.right}};return{layout:rect('.room-layout'),screen:rect('[aria-label="Shared screens"]'),chat:rect('.room-collaboration'),timer:rect('[aria-label="Shared Pomodoro"]'),dial:rect('.room-dial'),scroll:rect('.room-chat-scroll')}})()`);
 const confirm=async value=>browser.evaluate(`window.__allowConfirm=${value}`);
 try{
  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)});window.__allowConfirm=false;window.__confirmations=[];window.confirm=message=>{window.__confirmations.push(message);return window.__allowConfirm};Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedCode=text}}});`});
  await browser.navigate('/study-rooms');await open();
  await browser.evaluate(`window.studyStreakAppearance.save({background:'sage',mode:'dark',accent:'mint',reduceMotion:true},101);window.dispatchEvent(new StorageEvent('storage',{key:window.studyStreakAppearance.accountKey(101)}))`);
  const measurements=[];
  for(const width of [390,768,1440,1920]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   const r=await measure();measurements.push({width,...r});
   if(!before){assert.ok(Math.abs(r.dial.w-r.dial.h)<1,'timer is circular');assert.ok(r.timer.y>=Math.max(r.screen.b,r.chat.b)-1);assert.ok(Math.abs(r.timer.w-r.layout.w)<2,'Pomodoro spans the layout');assert.ok(r.scroll.h>150&&r.scroll.h<r.chat.h);
    if(width>=1440){assert.ok(Math.abs(r.screen.y-r.chat.y)<2);assert.ok(Math.abs(r.screen.h-r.chat.h)<2);assert.ok(r.screen.right<=r.chat.x);assert.ok(r.dial.w>=300);}else assert.ok(r.screen.b<=r.chat.y+1);
   }
   await capture(`room-${width}`,!before);
  }
  await participants();await browser.wait('document.querySelectorAll("[data-room-participant]").length===12');await capture('participants-1920',!before);
  if(before)return;
  assert.equal(await browser.evaluate('document.querySelector(".room-participants").scrollHeight>document.querySelector(".room-participants").clientHeight'),true);
  assert.equal(await browser.evaluate(`!!document.querySelector('.room-header [aria-label="Regenerate invitation code"]')`),true);
  assert.equal(await browser.evaluate(`!!document.querySelector('.room-participants [aria-label="Regenerate invitation code"]')`),false);
  await browser.wait(`!!document.querySelector('[aria-label="View profile of LunaStudy"] img')`);
  assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="View profile of A very long academic companion name"]')`),false);
  assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('.room-participants a')).some(a=>a.textContent.trim()==='View profile')`),false);
  assert.equal(await browser.evaluate(`(()=>{const card=document.querySelector('[aria-label="Make LunaStudy host"]').closest('[data-room-participant]'),b=card.querySelector('button'),a=card.querySelector('a');return !b.closest('a')&&b.getBoundingClientRect().x>=a.getBoundingClientRect().right-1})()`),true);
  // Focus/keyboard tooltip naming and tab semantics remain available.
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await browser.key('Escape');await browser.wait(`!!document.querySelector('.room-layout')`);assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('.room-message-delete')).transitionDuration`),'0s');await browser.key('Tab');await browser.evaluate(`document.querySelector('[aria-label="Make LunaStudy host"]').focus()`);assert.notEqual(await browser.evaluate('getComputedStyle(document.activeElement).outlineStyle'),'none');
  await press('Copy invitation code');assert.equal(await browser.evaluate('window.__copiedCode'),'ABCDEFGHIJ');
  await press('Regenerate invitation code');assert.equal(fixture.administrative.length,0);await confirm(true);await press('Regenerate invitation code');await browser.wait(`document.querySelector('.room-invite').textContent.includes('KLMNOPQRST')`);await press('Copy invitation code');assert.equal(await browser.evaluate('window.__copiedCode'),'KLMNOPQRST');
  // Media rendering exercises the real view with a transport fixture, never LiveKit networking.
  await press('Connect to screens');await browser.wait(`document.body.textContent.includes('No screens shared yet.')`);const empty=(await measure()).screen.h;
  await browser.evaluate('window.__roomMediaView.setScreen(true)');await browser.wait('!!document.querySelector("video[data-fixture-screen]")');assert.equal((await measure()).screen.h,empty);await capture('shared-screen-1920',true);
  await browser.evaluate('window.__roomMediaView.setScreen(false)');await browser.wait('!document.querySelector("video")');
  await browser.wait(`!!document.querySelector('[aria-label="Recorded for this Goal"]')`);assert.equal(await browser.evaluate(`(()=>{const e=document.querySelector('[aria-label="Recorded for this Goal"]'),p=document.createElement('span');p.style.background='var(--ss-surface-raised)';e.append(p);const match=getComputedStyle(e).backgroundColor===getComputedStyle(p).backgroundColor;p.remove();return match})()`),true);
  // Moderation actions retain their existing contracts and confirmations.
  const permissions=async()=>{await participants();await browser.wait(`!!document.querySelector('.room-participants details')`);await browser.evaluate(`(()=>{const details=document.querySelector('.room-participants details');details.open=true;details.scrollIntoView({block:'end'})})()`);};
  await permissions();
  await press('Allow screen sharing');await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Revoke screen permission')`);
  const allowed=fixture.administrative.length;await permissions();await confirm(false);await press('Revoke screen permission');assert.equal(fixture.administrative.length,allowed);await confirm(true);await press('Revoke screen permission');await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Allow screen sharing')`);await permissions();
  await confirm(false);await press('Remove Academic companion 0 from room');assert.equal(fixture.administrative.filter(r=>r.method==='DELETE').length,0);await confirm(true);await press('Remove Academic companion 0 from room');await browser.wait('document.querySelectorAll("[data-room-participant]").length===11');assert.equal(fixture.administrative.filter(r=>r.method==='DELETE').length,1); // Confirmation is enabled here; only fixture member 200 is removed.
  await browser.wait('document.querySelectorAll("[data-room-participant]").length===11');
  await capture('permissions-1920',true);
  // Navigation comes only from identity, never from administrative actions.
  await press('View profile of LunaStudy');await browser.wait(`location.pathname==='/users/3/profile'`);await browser.evaluate('history.back()');await open();await participants();
  const beforeHost=fixture.administrative.filter(r=>r.path.endsWith('/host')).length;await confirm(false);await press('Make LunaStudy host');assert.equal(fixture.administrative.filter(r=>r.path.endsWith('/host')).length,beforeHost);
  // Server timer actions keep versioned writes; nothing credits time locally.
  await press('Chat');await confirm(true);await press('Start');await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Pause')`);await press('Pause');await press('Reset timer');await press('5-min break');await browser.wait(`document.querySelector('.room-dial .room-eyebrow').textContent==='GROUP BREAK'`);await press('25-min focus');
  const actions=fixture.requests.filter(r=>r.path.endsWith('/timer'));assert.deepEqual(actions.map(r=>r.body.action),['START','PAUSE','RESET','BREAK','FOCUS']);assert.ok(actions.every(r=>Number.isSafeInteger(r.body.expectedVersion)));
  await participants();await press('Make LunaStudy host');await browser.wait(`!document.querySelector('[aria-label="Host controls"]')`);assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Regenerate invitation code"]')`),false);assert.equal(await browser.evaluate('document.querySelectorAll(".room-make-host,.room-screen-permissions").length'),0);await capture('member-1920',true);
  fixture.setConnectionFailure(true);await browser.wait(`document.body.textContent.includes('Connection or action needs attention')||document.body.textContent.includes('Connection interrupted')`);fixture.setConnectionFailure(false);await browser.wait('!document.querySelector(".room-connection")');
  fixture.setHost(true);await browser.wait(`!!document.querySelector('[aria-label="Host controls"]')`);
  // Theme families and accent controls remain independent, including OS-driven mode.
  const contrast=[];
  for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
   await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   assert.ok(Math.abs((await measure()).screen.h-(await measure()).chat.h)<2);const ratios=await browser.evaluate(`(()=>{const p=document.createElement('span');document.body.append(p);const lum=name=>{p.style.color='var('+name+')';return getComputedStyle(p).color.match(/[0-9.]+/g).slice(0,3).map(Number).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0)};const pairs=[['--ss-text','--ss-surface-raised'],['--ss-text-muted','--ss-surface-raised'],['--ss-accent','--ss-surface'],['--ss-on-accent','--ss-accent']];const ratios=pairs.map(([a,b])=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)});p.remove();return ratios})()`);assert.ok(ratios.every(r=>r>=4.5),JSON.stringify({background,mode,scheme,accent,ratios}));contrast.push({background,mode,scheme,accent,ratios});
  }
  await browser.evaluate(`window.studyStreakAppearance.apply({background:'amber',mode:'dark',accent:'orange',reduceMotion:true})`);await capture('amber-dark-orange-1920',true);
  assert.equal(fixture.requests.some(r=>/ledger|focus-sessions/.test(r.path)&&r.method!=='GET'),false);
  assert.deepEqual(browser.errors,[]);writeFileSync(new URL('../../.local/f2/measurements.json',import.meta.url),JSON.stringify({measurements,contrast,administrative:fixture.administrative},null,2));
 }catch(error){writeFileSync(new URL('../../.local/f2/failure.json',import.meta.url),JSON.stringify({path:await browser.evaluate('location.pathname'),text:await browser.evaluate('document.body.innerText'),errors:browser.errors,administrative:fixture.administrative}));throw error;}finally{await browser.close();}
});
