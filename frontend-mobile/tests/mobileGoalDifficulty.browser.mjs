import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mobileBrowser } from './helpers/mobileBrowser.mjs';
const levels=['TRIVIAL','EASY','INTERMEDIATE','HARD'];
const labels=['Intrascendente · Neutral','Fácil · Alegre','Intermedio · Seria','Difícil · Enojada'];
let goals=[...levels,null].map((difficulty,i)=>({id:i+7,topic:i===4?'Historical goal':'Study goal '+(i+1),frequency:3,duration:25,completed:false,difficulty}));
const claims={type:'access',userId:101,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:4102444800};
const tokens={token:`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`,refreshToken:'fixture-only'};
const page=content=>({content,totalElements:content.length,totalPages:content.length?1:0,empty:!content.length,last:true,number:0,size:10});
let legacy=false;const writes=[];
const browser=await mobileBrowser({intercept:async request=>{
 const p=new URL(request.url).pathname;
 if(p==='/login')return{body:tokens};
 if(request.method!=='GET'){
  const body=JSON.parse(request.postData||'{}');writes.push({p,body});
  if(p==='/users/101/goals'){const goal={id:100+goals.length,...body,...(legacy?{difficulty:undefined}:{})};goals.push(goal);return{body:goal};}
  if(/^\/users\/101\/goals\/\d+$/.test(p)){const goal=goals.find(g=>g.id===Number(p.split('/').at(-1)));Object.assign(goal,body);return{body:goal};}
  return{status:403};
 }
 if(p==='/api/profile')return{body:{id:101,username:'fixture'}};
 if(p==='/users/101/goals')return{body:page(goals)};
 if(/^\/users\/101\/goals\/\d+$/.test(p))return{body:goals.find(g=>g.id===Number(p.split('/').at(-1)))};
 if(p.endsWith('/summary'))return{body:{goalId:Number(p.split('/')[3]),totalMinutes:25,completedSessions:1}};
 if(p.endsWith('/streak'))return{body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-12'}};
 if(p.endsWith('/daily-records'))return{body:page([{id:12,date:'2026-11-12',note:'Study record',evidence:'Notes',photoAvailable:false,voiceAvailable:false}])};
 if(p.includes('/notifications')||p.endsWith('/tags'))return{body:page([])};
 return{status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const modalGone=()=>browser.wait(`!document.querySelector('[aria-modal="true"]')`);
async function capture(name){
 for(const width of [320,390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
  await browser.wait('document.documentElement.scrollWidth<=innerWidth');
  await browser.evaluate(`Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0);document.activeElement?.blur()`);
  const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/741-${name}-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
try{
 await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','fixture-only');await browser.click('Sign in');
 await browser.wait(has('Open Historical goal'));await capture('goals');
 for(let index=0;index<4;index++){
  await browser.click('Create a goal');await browser.wait(has('Topic'));await browser.fill('[aria-label="Topic"]','Created '+levels[index]);await browser.click(labels[index]);
  if(index===3)await capture('selector');
  await browser.click('Create goal');await modalGone();assert.equal(writes.at(-1).body.difficulty,levels[index]);
 }
 legacy=true;const before=writes.length;await browser.click('Create a goal');await browser.wait(has('Topic'));await browser.fill('[aria-label="Topic"]','Unconfirmed legacy goal');await browser.click('Fácil · Alegre');await browser.click('Create goal');await browser.wait(`document.body.innerText.includes('Difficulty was not confirmed')`);
 assert.equal(writes.length,before+1);assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Create goal"]').getAttribute('aria-disabled')`),'true');await browser.click('Cancel');await modalGone();legacy=false;
 await browser.click('Open Historical goal');await browser.wait(has('Update Goal'));await browser.click('Update Goal');await browser.wait(has('Topic'));
 await browser.click('Difícil · Enojada');await browser.click('Save changes');await modalGone();assert.equal(goals.find(g=>g.id===11).difficulty,'HARD');
 await browser.wait(`document.body.innerText.includes('Difícil')`);await capture('details');
 await browser.evaluate('history.back()');await browser.wait(has('Open Historical goal'));
 await browser.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await browser.wait(has('Focus on Study goal 1'));
 await browser.click('Focus on Study goal 1');await browser.wait('location.pathname.includes("focus-studio")');assert.equal(await browser.evaluate('location.search.includes("goalId=7")'),true);
 assert.deepEqual(browser.errors,[]);
 process.stdout.write('Native difficulty browser passed: four levels, historical fallback, create/edit payloads, independent Focus and responsive capture.\n');
}catch(error){writeFileSync('.expo/741-difficulty-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),errors:browser.errors}));throw error;}finally{await browser.close();}
