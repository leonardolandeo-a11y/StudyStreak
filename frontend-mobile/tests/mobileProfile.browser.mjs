import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
let id=101,failSave=false,denyBanner=false; const writes=[],reads={avatar:0,banner:0};
let profile={id,username:'fixture-student',presentationName:'Fixture Student',displayName:'Fixture Student',bio:'Fixture biography',registrationDate:'2026-01-04',statistics:{verifiedMinutes:12.5,verifiedSessions:2,studyStreak:3,bestStudyStreak:9,activeGoals:1}};
const page=content=>({content,totalElements:content.length,totalPages:1,last:true,number:0,size:10});
const tokens=()=>({token:`fixture.${Buffer.from(JSON.stringify({type:'access',userId:id,sub:profile.username,email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.signature`,refreshToken:'fixture-only'});
const browser=await mobileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;
  if(path==='/login')return {body:tokens()};
  if(request.method!=='GET'){
    if(path==='/logout')return {status:204};
    const body=request.postData?JSON.parse(request.postData):null;writes.push({path,method:request.method,body});
    if(path==='/api/profile'){
      if(failSave)return {status:403}; profile={...profile,...body,presentationName:body.displayName||profile.username};return {body:profile};
    }
    return {status:204};
  }
  if(path==='/api/profile')return {body:profile};
  if(path==='/api/profile/avatar'){reads.avatar++;return {status:404};}
  if(path==='/api/profile/banner'){reads.banner++;return {status:denyBanner?403:404};}
  if(path.includes('notifications'))return {body:page([])};
  if(path===`/users/${id}/goals`)return {body:page([])};
  return {status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
async function openProfile(){await browser.click('Open menu');await browser.click(`Open your profile, ${profile.presentationName}`);await browser.wait(has('Edit Profile'));}
try{
  await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture-student');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Open menu'));
  assert.equal(reads.banner,0);await openProfile();await browser.wait(`document.body.innerText.includes('Verified focus time')`);
  await browser.wait(`document.body.innerText.includes('Joined Jan 4, 2026')`);assert.equal(reads.banner,1);
  await browser.click('Edit Profile');await browser.wait(has('Display name'));await browser.fill('[aria-label="Display name"]','Unsaved name');await browser.click('Remove avatar');
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Remove avatar"]').getAttribute('aria-disabled')`),'true');
  await browser.click('Undo avatar change');await browser.click('Cancel');assert.equal(writes.length,0);
  await browser.click('Edit Profile');await browser.wait(has('Bio'));await browser.fill('[aria-label="Bio"]','x'.repeat(301));
  await browser.wait(`document.querySelector('[aria-label="Save changes"]').getAttribute('aria-disabled')==='true'`);
  await browser.fill('[aria-label="Display name"]','Updated Student');await browser.fill('[aria-label="Bio"]','Updated biography');await browser.click('Remove banner');await browser.click('Save changes');
  await browser.wait(`!document.querySelector('[aria-label="Close profile editor"]')`);await browser.wait(`document.body.innerText.includes('Profile saved.')`);
  assert.deepEqual(writes.map(item=>[item.method,item.path]),[['PATCH','/api/profile'],['DELETE','/api/profile/banner']]);
  assert.deepEqual(writes[0].body,{displayName:'Updated Student',bio:'Updated biography'});
  await browser.evaluate('history.back()');await browser.wait(has('Open menu'));await openProfile();
  await browser.wait(`document.body.innerText.includes('Updated biography')`);assert.equal(reads.avatar,2);assert.equal(reads.banner,2);
  failSave=true;await browser.click('Edit Profile');await browser.wait(has('Bio'));await browser.click('Save changes');
  await browser.wait(`document.querySelector('[aria-modal="true"]').innerText.includes('Some changes may already be saved')`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-modal="true"]').innerText.includes('permission')`),true);
  failSave=false;await browser.click('Save changes');await browser.wait(`!document.querySelector('[aria-label="Close profile editor"]')`);
  denyBanner=true;await browser.command('Page.reload');await browser.wait(has('Username'));
  await browser.fill('[aria-label="Username"]','fixture-student');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Open menu'));await openProfile();
  await browser.wait(has('Retry profile images'));denyBanner=false;await browser.click('Retry profile images');await browser.wait(`!document.querySelector('[aria-label="Retry profile images"]')`);
  for(const width of [320,390,768,1440]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
  await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await browser.evaluate(`document.querySelector('[aria-label="Edit Profile"]').scrollIntoView({block:'end'})`);
  let image=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/profile-mobile.png',Buffer.from(image.data,'base64'));
  await browser.click('Edit Profile');await browser.wait(has('Bio'));await browser.wait(`!!document.activeElement?.closest('[aria-modal="true"]')`);await browser.key('Tab');assert.equal(await browser.evaluate(`!!document.activeElement?.closest('[aria-modal="true"]')`),true);
  await browser.evaluate(`document.querySelector('[aria-label="Display name"]').focus()`);
  await browser.wait(`getComputedStyle(document.querySelector('[aria-label="Display name"]')).borderTopColor !== getComputedStyle(document.querySelector('[aria-label="Bio"]')).borderTopColor`);
  assert.equal(await browser.evaluate(`(() => {const field=document.querySelector('[aria-label="Display name"]');return getComputedStyle(field).borderTopWidth==='1px' && getComputedStyle(field).outlineWidth==='0px' && getComputedStyle(field.parentElement).backgroundColor==='rgba(0, 0, 0, 0)';})()`),true);
  const buttons=await browser.evaluate(`['Select avatar','Remove avatar','Select banner','Remove banner'].map(label=>{const el=document.querySelector('[aria-label="'+label+'"]');return {hit:el.getBoundingClientRect().height,visual:el.firstElementChild.getBoundingClientRect().height};})`);
  assert.ok(buttons.every(button=>button.hit>=48 && button.visual<=42));
  assert.equal(new Set(buttons.map(button=>button.visual)).size,1);
  image=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/profile-editor.png',Buffer.from(image.data,'base64'));
  for(const width of [320,390,768]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await browser.wait(`Array.from(document.querySelector('[aria-modal="true"]').querySelectorAll('input,textarea,[role="button"]')).every(el=>{const r=el.getBoundingClientRect();return r.left>=-1 && r.right<=innerWidth+1;})`);}
  await browser.click('Cancel');
  await browser.evaluate('history.back()');await browser.wait(has('Open menu'));await browser.click('Open menu');await browser.click('Settings');await browser.wait(has('Light'));await browser.click('Light');await browser.click('Purple');await browser.evaluate(`document.querySelector('[aria-label="Reduce motion"]').click()`);
  await browser.evaluate('history.back()');await browser.wait(has('Open menu'));await openProfile();await browser.click('Edit Profile');await browser.wait(has('Bio'));
  image=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('.expo/profile-editor-light.png',Buffer.from(image.data,'base64'));await browser.click('Cancel');
  await browser.click('Sign out');await browser.wait(has('Username'));
  id=102;profile={...profile,id,username:'second-fixture',displayName:null,presentationName:'second-fixture',bio:null,registrationDate:null};
  await browser.fill('[aria-label="Username"]','second-fixture');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');await browser.wait(has('Open menu'));await openProfile();
  assert.equal(await browser.evaluate(`document.body.innerText.includes('Updated biography') || document.body.innerText.includes('Joined Jan 4')`),false);
  assert.deepEqual(browser.errors,[]);process.stdout.write('Profile browser passed: load, cancel, validation, PATCH/DELETE, shared drawer identity, 403/retry, Back, logout/account isolation and 320–1440px.\n');
}catch(error){writeFileSync('.expo/profile-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),writes,reads,errors:browser.errors}));throw error;}
finally{await browser.close();}
