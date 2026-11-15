// Chrome + fixture APIs. Native Android/Expo Go, media decoding and TalkBack remain physical checks.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { collaborationFixture } from '../../scripts/tests/roomCollaborationFixture.mjs';
const fixture=collaborationFixture();let denied=false,logout=0;
const profile={id:101,username:'Scholar',presentationName:'Cozy Scholar',displayName:'Cozy Scholar',bio:'Graph theory is cozy',registrationDate:'2026-01-04',statistics:{verifiedMinutes:12.5,verifiedSessions:2,activeGoals:1,studyStreak:3,bestStudyStreak:9}};
const browser=await mobileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;
 if(path==='/logout'){logout++;return{status:204};}
 if(path==='/api/profile')return{body:profile};
 if(path==='/api/profile/avatar'||path==='/api/profile/banner')return{status:404};
 if(path==='/api/users/3/profile'&&denied)return{status:403};
 if(path.includes('notifications'))return{body:{content:[],totalElements:3,totalPages:1,empty:true,last:true}};
 return fixture.intercept(request);
}});
const visible=label=>`Array.from(document.querySelectorAll('[aria-label=${JSON.stringify(label)}]')).some(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`;
const element=id=>`Array.from(document.querySelectorAll('[data-testid="${id}"]')).find(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'))`;
async function back(){
 const target=`Array.from(document.querySelectorAll('[role=button],button,[role=link],a')).find(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')&&/\\bback$/i.test(e.getAttribute('aria-label')||''))`;
 await browser.wait(`!!(${target})`);await browser.evaluate(`(${target}).click()`);
}
async function openMenu(){await browser.click('Open menu');await browser.wait(visible('Open your profile, Cozy Scholar'));}
async function responsiveProfile(){
 for(const [width,height] of [[320,844],[390,844],[768,844],[768,390]]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  assert.equal(await browser.evaluate(`(()=>{const h=${element('profile-header')},b=h.querySelector('[data-testid="profile-banner"]').getBoundingClientRect(),a=h.querySelector('[data-testid="profile-avatar"]').getBoundingClientRect(),s=getComputedStyle(h);return b.width>=Math.min(innerWidth,760)-2&&a.top<b.bottom&&a.bottom>b.bottom&&s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.borderBottomWidth==='1px';})()`),true);
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
async function samePageSettings(){await openMenu();await browser.click('Settings');await browser.wait(visible('Light'));assert.equal(await browser.evaluate(visible('Home')),false);}
try{
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await browser.navigate('/');await browser.wait(visible('Username'));await browser.fill('[aria-label="Username"]','Scholar');await browser.fill('[aria-label="Password"]','Fixture-password-1');await browser.click('Sign in');await browser.wait(visible('Open menu'));
 await samePageSettings();await browser.click('Lavender background');await browser.click('Dark');await browser.click('Purple');await back();await browser.wait(visible('Open menu'));assert.equal(await browser.evaluate(`location.pathname.includes('settings')`),false);
 await openMenu();
 assert.equal(await browser.evaluate(`(()=>{const e=${element('drawer-identity')},a=e.querySelector('[aria-label*=avatar]').getBoundingClientRect(),r=e.getBoundingClientRect();return a.width===80&&Math.abs(a.left+a.width/2-r.left-r.width/2)<2&&e.textContent.includes('@Scholar');})()`),true);
 assert.equal(await browser.evaluate(`Array.from(document.querySelectorAll('[data-testid="drawer-selected-star"]')).filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).length`),1);
 assert.equal(await browser.evaluate(`(()=>{const a=${element('drawer-skyline')},b=${element('drawer-brand-actions')};return a.getBoundingClientRect().bottom<=b.getBoundingClientRect().top&&!!b.querySelector('[aria-label="Sign out"]')&&!!b.querySelector('[data-testid="study-mark"]');})()`),true);
 const transform=await browser.evaluate(`getComputedStyle(${element('drawer-cup-motion')}).transform`);await browser.click('Animate StudyStreak cup');await browser.wait(`getComputedStyle(${element('drawer-cup-motion')}).transform!==${JSON.stringify(transform)}`);
 await browser.command('Page.captureScreenshot',{format:'png'}).then(shot=>writeFileSync('/tmp/m4c-drawer.png',Buffer.from(shot.data,'base64')));
 await browser.click('Open your profile, Cozy Scholar');await browser.wait(visible('Edit Profile'));await browser.wait(`document.body.textContent.includes('Verified focus time')`);
 assert.equal(await browser.evaluate(visible('Sign out')),false);assert.equal(await browser.evaluate(`!!(${element('profile-header')}).querySelector('[data-testid="icon-pencil-motion"]')`),true);await responsiveProfile();
 await browser.command('Page.captureScreenshot',{format:'png'}).then(shot=>writeFileSync('/tmp/m4c-profile.png',Buffer.from(shot.data,'base64')));
 await browser.click('Edit Profile');await browser.wait(visible('Bio'));await browser.wait(`!!document.activeElement?.closest('[role="dialog"]')`);await browser.fill('[aria-label="Bio"]','Unsaved draft');await browser.key('Escape');await browser.wait(`!document.querySelector('[aria-modal="true"]')`);assert.equal(await browser.evaluate(`(${element('profile-header')}).textContent.includes('Graph theory is cozy')`),true);
 await back();await browser.wait(visible('Open menu'));
 // An authenticated URL navigation exercises the deep-link resolver without changing auth/storage policy.
 await browser.evaluate(`history.pushState({},'', '/users/3/profile');window.dispatchEvent(new PopStateEvent('popstate'));`);await browser.wait(`!!(${element('profile-header')})&&(${element('profile-header')}).textContent.includes('LunaStudy')`);
 assert.equal(await browser.evaluate(visible('Edit Profile')),false);await responsiveProfile();denied=true;await browser.click('Refresh member profile');await browser.wait(`document.body.textContent.includes('An accepted Tracking connection is required')`);assert.equal(await browser.evaluate(`!!(${element('profile-header')})`),false);denied=false;
 await back();await browser.wait(visible('Open menu'));await openMenu();await browser.click('Focus Studio');await browser.waitForDrawerClosed();await browser.wait(visible('Focus settings'));
 await samePageSettings();await back();await browser.wait(visible('Focus settings'));assert.equal(await browser.evaluate(`location.pathname.endsWith('/focus-studio')`),true);
 await browser.evaluate(`history.pushState({},'', '/settings');window.dispatchEvent(new PopStateEvent('popstate'));`);await browser.wait(visible('Light'));assert.equal(await browser.evaluate(visible('Home')),false);await back();await browser.wait(visible('Open menu'));
 await samePageSettings();await browser.click('Sky background');await browser.click('Light');await browser.click('Orange');await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);await back();await browser.wait(visible('Open menu'));
 await openMenu();await browser.wait(`!!document.querySelector('[role="dialog"]')`);const still=await browser.evaluate(`getComputedStyle(${element('drawer-cup-motion')}).transform`);await browser.click('Animate StudyStreak cup');await browser.evaluate('new Promise(resolve=>setTimeout(resolve,120))');assert.equal(await browser.evaluate(`getComputedStyle(${element('drawer-cup-motion')}).transform`),still);
 await browser.command('Emulation.setDeviceMetricsOverride',{width:768,height:390,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');
 await browser.click('Sign out');await browser.wait(visible('Username'));for(let i=0;i<50&&!logout;i++)await new Promise(resolve=>setTimeout(resolve,20));assert.equal(logout,1);assert.deepEqual(browser.errors,[]);
 console.log('M4c passed: first Settings/native Back and origin, authenticated URL routes, own/member headers and permissions, editor cancel, centered drawer identity/star/skyline, cup/Reduce Motion, logout, 320/390/768 and landscape. Chrome fixtures, not physical Android.');
}catch(error){writeFileSync('/tmp/m4c-navigation-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),errors:browser.errors}));throw error;}finally{await browser.close();}
