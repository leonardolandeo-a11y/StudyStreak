import assert from 'node:assert/strict';
import {test} from 'node:test';
import {writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
const paged=content=>({content,number:0,size:10,totalPages:content.length?1:0,totalElements:content.length,first:true,last:true,empty:!content.length});
test('Chrome: goal dialogs, truthful tags and one-step validation preserve drafts and authorization IDs',{timeout:120000},async()=>{
 let goal={id:7,topic:'Algebra study journal',frequency:3,duration:25,completed:false}, tags=[{id:2,name:'Mathematics'}], validation=null,failCreate=true;const writes=[];
 const browser=await profileBrowser({intercept:async request=>{
  const p=new URL(request.url).pathname,body=request.postData?JSON.parse(request.postData):{};
  if(request.method!=='GET'){
   writes.push({p,method:request.method,body});
   if(p==='/users/42/goals'){if(failCreate)return{status:400,body:{message:'Fixture rejected'}};goal={id:7,...body};return{body:goal};}
   if(p==='/users/42/goals/7'){goal={...goal,...body};return{body:goal};}
   if(p==='/users/42/goals/7/tags'){tags.push({id:3,name:body.name});return{body:tags.at(-1)};}
   if(p==='/users/42/goals/7/tags/3'){tags=tags.filter(t=>t.id!==3);return{status:204};}
   if(p.endsWith('/validation')){validation={id:5,...body};return{body:validation};}
   return{status:403};
  }
  if(p==='/api/profile')return{body:{id:42,username:'Scholar'}};
  if(p==='/api/study/active')return{body:null};
  if(p.includes('/tracking-links'))return{body:paged([{id:1,requesterId:42,receiverId:77,requesterUsername:'Scholar',receiverUsername:'Study partner',status:'ACCEPTED'}])};
  if(p==='/users/42/goals')return{body:paged([goal])};if(p==='/users/42/goals/7')return{body:goal};
  if(p==='/users/77/goals')return{body:paged([{...goal,id:8,topic:'Partner goal'}])};
  if(p==='/users/42/goals/7/tags')return{body:paged(tags)};
  if(p.endsWith('/streak'))return{body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-09'}};
  if(p.endsWith('/summary'))return{body:{goalId:7,totalMinutes:25,completedSessions:1}};
  if(p.endsWith('/validation'))return validation?{body:validation}:{status:404};
  if(p.endsWith('/daily-records'))return{body:paged([{id:12,date:'2026-11-09',note:'Evidence note',evidence:'Read chapter two',photoAvailable:false,voiceAvailable:false}])};
  if(p.includes('/notifications'))return{body:paged([])};
  return{status:404};
 }});
 const shot=async name=>{const r=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/74b-after-web-'+name+'.png',Buffer.from(r.data,'base64'))};
 const review=async(name,themes=false)=>{
  await browser.evaluate(`document.querySelectorAll('[aria-label="Dismiss notification"]').forEach(button=>button.click());document.activeElement?.blur()`);
  for(const width of [320,390,768,1440]){
   await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
   if(themes)for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
    await browser.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   }
   await browser.evaluate(`window.studyStreakAppearance.apply({mode:'dark',accent:'mint',reduceMotion:true})`);
   await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   await browser.wait(`(() => {const current=document.querySelector('[aria-current="step"]');if(!current)return true;const r=current.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()`);
   await shot(name+'-'+width);
  }
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 };
 const submitDialog=()=>browser.evaluate(`document.querySelector('dialog form button[type=submit]').click()`);
 const continueStep=()=>browser.evaluate(`Array.from(document.querySelectorAll('[aria-label="Wizard controls"] button')).find(b=>b.textContent==='Continue').click()`);
 const back=()=>browser.evaluate(`document.querySelector('[aria-label="Wizard controls"] button').click()`);
 try{
  const token='fixture.'+Buffer.from(JSON.stringify({type:'access',userId:42,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await browser.navigate('/goals');await browser.wait(`!!document.querySelector('.goal-card-main')`);assert.equal(await browser.evaluate('document.querySelectorAll("form").length'),0);
  assert.equal(await browser.evaluate(`document.body.innerText.includes('Goal #')||document.body.innerText.includes('View details')`),false);await review('goals',true);
  await browser.click('Create Goal');await browser.wait('!!document.querySelector("dialog[open]")');assert.equal(await browser.evaluate('!!document.querySelector("dialog input[type=checkbox]")'),false);
  await review('create-goal');await browser.key('Escape');await browser.wait('!document.querySelector("dialog")');assert.equal(await browser.evaluate('document.activeElement.textContent.includes("Create Goal")'),true);await browser.click('Create Goal');await browser.wait('!!document.querySelector("dialog[open]")');await browser.fill('#topic','A new study goal');await submitDialog();await browser.wait(`document.body.textContent.includes('Please check the information')`);assert.equal(await browser.evaluate('document.querySelector("#topic").value'),'A new study goal');
  failCreate=false;await submitDialog();await browser.wait('!document.querySelector("dialog")');assert.equal(writes[0].body.completed,false);assert.equal(writes[0].body.difficulty,undefined);
  await browser.evaluate('document.querySelector(".goal-card-main").click()');await browser.wait(`!!document.querySelector('.goal-detail-hero')`);assert.equal(await browser.evaluate('document.querySelectorAll("form").length'),0);
  await browser.click('Update Goal');await browser.wait('!!document.querySelector("dialog[open]")');await review('edit-goal');await browser.fill('#topic','Edited journal');await submitDialog();await browser.wait('!document.querySelector("dialog")');await browser.wait(`document.body.textContent.includes('Edited journal')`);
  await browser.click('View Tags');await browser.wait(`document.body.textContent.includes('Mathematics')`);await browser.evaluate(`document.querySelector('[aria-label="Add tag"]').click()`);await browser.wait('!!document.querySelector("dialog[open]")');await browser.fill('dialog input','Physics');await browser.click('Save tag');await browser.wait('!document.querySelector("dialog")');await browser.wait(`!!document.querySelector('[aria-label="Remove tag Physics"]')`);
  await browser.evaluate(`document.querySelector('[aria-label="Remove tag Physics"]').click()`);await browser.wait(`!!document.querySelector('[role="dialog"]')`);await browser.click('Cancel');assert.equal(tags.length,2);await browser.wait('!document.querySelector("[role=dialog]")');await review('goal-detail',true);
  await browser.navigate('/validations');await browser.wait(`!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='View goals')`);
  await review('validations-partner',true);
  const visible=()=>browser.evaluate(`Array.from(document.querySelectorAll('.validation-workflow > section')).filter(e=>e.getClientRects().length).length`);
  assert.equal(await visible(),1);await browser.click('View goals');await continueStep();await browser.wait(`document.querySelector('[aria-label="Select goal"]').getClientRects().length>0`);await browser.wait(`document.body.textContent.includes('Partner goal')`);
  await browser.click('View daily records');await continueStep();await browser.wait(`document.querySelector('[aria-label="Select daily record"]').getClientRects().length>0`);await browser.wait(`document.body.textContent.includes('Evidence note')`);
  await browser.click('Review validation');await continueStep();await browser.wait(`!!document.querySelector('[aria-label="Review evidence"]')`);await browser.wait(`!document.body.textContent.includes('Loading validation...')`);await review('validations-evidence');await continueStep();await browser.wait(`document.querySelector('[aria-label="Validate record"]').getClientRects().length>0`);
  await browser.evaluate(`document.querySelector('#approved').value='true';document.querySelector('#approved').dispatchEvent(new Event('change',{bubbles:true}))`);await browser.fill('#comment','A useful review');await back();await browser.wait(`!!document.querySelector('[aria-label="Review evidence"]')`);await continueStep();await browser.wait(`document.querySelector('#comment').getClientRects().length>0`);assert.equal(await browser.evaluate(`document.querySelector('#comment').value`),'A useful review');
  await browser.click('Review decision');await browser.wait(`!!document.querySelector('[aria-label="Confirm validation decision"]')`);assert.equal(writes.filter(w=>w.p.endsWith('/validation')).length,0);await review('validations-confirm');await browser.click('Create validation');await browser.wait(`document.body.textContent.includes('Validation created successfully')`);assert.equal(writes.at(-1).p,'/api/goals/8/daily-records/12/validation');assert.equal(writes.at(-1).body.comment,'A useful review');assert.equal(await visible(),1);
  await browser.click('Review decision');await browser.click('Update validation');await browser.wait(`document.body.textContent.includes('Validation updated successfully')`);assert.equal(writes.at(-1).method,'PUT');assert.equal(writes.at(-1).p,'/api/goals/8/daily-records/12/validation');
  assert.deepEqual(browser.errors,[]);
 }finally{await browser.close()}
});
