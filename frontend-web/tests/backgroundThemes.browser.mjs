import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
const before=process.env.F1_PHASE==='before';
const output=new URL('../../docs/images/final-ui-f1/',import.meta.url);mkdirSync(output,{recursive:true});
const page=content=>({content,number:0,size:10,totalElements:content.length,totalPages:content.length?1:0,first:true,last:true,empty:!content.length});
let owner=42;
const token=id=>'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:id,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
const goal={id:7,topic:'A focused study goal',frequency:3,duration:25,completed:false,difficulty:'EASY'};
const writes=[];
const browser=await profileBrowser({intercept:async req=>{
 const p=new URL(req.url).pathname;
 if(req.method!=='GET'){writes.push(p);if(p==='/logout')return {status:204};if(p==='/login')return {body:{token:token(owner),refreshToken:'fixture-only-refresh'}};return {status:403};}
 if(p==='/api/profile')return {body:{id:owner,username:'Scholar',displayName:'Study Scholar',presentationName:'Study Scholar',bio:'Learning a little every day.',statistics:{verifiedMinutes:25,verifiedSessions:1}}};
 if(/\/(avatar|banner)$/.test(p))return {status:404};
 if(p==='/api/profile/privacy')return {body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
 if(p==='/api/study/active')return {body:null};
 if(p.endsWith('/goals/7'))return {body:goal};
 if(p.endsWith('/goals'))return {body:page([goal])};
 if(p.endsWith('/tags'))return {body:page([])};
 if(p.endsWith('/streak'))return {body:{currentStreak:2,bestStreak:4,lastUpdateDate:'2026-11-13'}};
 if(p.endsWith('/summary'))return {body:{goalId:7,totalMinutes:25,completedSessions:1}};
 if(p.endsWith('/daily-records'))return {body:page([{id:11,date:'2026-11-13',note:'Notes from a focused session.'}])};
 if(p.includes('/notifications'))return {body:p.includes('unread')?0:page([{id:1,type:'GOAL_COMPLETED',message:'Your study goal is ready to review.',read:false,createdAt:'2026-11-13T12:00:00Z',relatedGoalId:7}])};
 if(p==='/api/resources/books')return {body:[{id:'algebra',title:'Algebra companion',authors:['Study Author'],thumbnailUrl:null,description:'A useful resource for your next study session.',infoLink:'https://books.google.com/books?id=algebra',categories:['Mathematics']}]};
 return {status:404};
}});
const apply=async(background,mode,accent='mint')=>{await browser.evaluate(`window.studyStreakAppearance.save({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true},42);window.dispatchEvent(new StorageEvent('storage',{key:window.studyStreakAppearance.accountKey(42)}))`);await browser.wait(`document.documentElement.dataset.background==='${background}'&&document.documentElement.dataset.theme==='${mode}'&&document.documentElement.dataset.accent==='${accent}'`);await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');};
async function capture(name){if(process.env.F1_SKIP_CAPTURES==='1')return;await browser.evaluate('document.activeElement?.blur()');const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(`${before?'before':'after'}-${name}.png`,output),Buffer.from(shot.data,'base64'));}
async function open(route,text){await browser.navigate(route);await browser.wait(`document.body.textContent.includes(${JSON.stringify(text)})`);}
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('accessToken'))sessionStorage.setItem('accessToken',${JSON.stringify(token(42))});if(!localStorage.getItem('studystreak:appearance:v1'))localStorage.setItem('studystreak:appearance:v1',JSON.stringify({mode:'dark',accent:'mint',reduceMotion:true}));`});
 for(const [route,name,text]of [['/goals/7','goal','Server-confirmed snapshot'],['/focus-studio','focus','DEEP WORK'],['/resources?topic=Algebra','resources','Algebra companion'],['/notifications','notifications','Your study goal is ready'],['/profile','profile','Study Scholar'],['/settings','settings','Appearance preview']]){
  await open(route,text);
  for(const [background,mode]of before?[['lavender','dark']]:[['lavender','dark'],['neutral','light'],['sage','dark']]){
   await apply(background,mode);
   for(const width of [390,768,1440]){
    await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await browser.wait('document.documentElement.scrollWidth<=innerWidth');
    if(width!==768)await capture(`${name}-${background}-${mode}-${width}`);
   }
   if(name==='profile'){await browser.click('Edit profile');await browser.wait('document.querySelector("dialog")?.open');await capture(`editor-${background}-${mode}`);await browser.key('Escape');}
   if(name==='goal'){await browser.click('Update Goal');await browser.wait('document.querySelector("dialog")?.open');await capture(`form-${background}-${mode}`);await browser.key('Escape');}
   if(name==='focus'){await browser.evaluate(`document.querySelector('[aria-label="Pomodoro settings"]').click()`);await browser.wait('document.querySelector("dialog")?.open');await capture(`pomodoro-${background}-${mode}`);await browser.key('Escape');}
  }
 }
 if(!before){
  await open('/settings','Appearance preview');
  const choose=async(name,value)=>{await browser.wait(`!!document.querySelector('input[name="${name}"][value="${value}"]')`);await browser.evaluate(`document.querySelector('input[name="${name}"][value="${value}"]').click()`);await browser.wait(`document.querySelector('input[name="${name}"][value="${value}"]').checked`);};
  const contrastReport=[];
  for(const background of ['neutral','lavender','sage','amber','sky']){
   await choose('background-theme',background);
   for(const mode of ['dark','light','system'])for(const scheme of mode==='system'?['dark','light']:[mode]){
    await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme}]});
    for(const accent of ['mint','blue','purple','orange']){
     await apply(background,mode,accent);
     const result=await browser.evaluate(`(()=>{const probe=document.createElement('span');document.body.append(probe);const rgb=name=>{probe.style.color='var('+name+')';return getComputedStyle(probe).color.match(/[\\d.]+/g).slice(0,3).map(Number)};const lum=v=>v.map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);const contrast=(a,b)=>{const x=lum(rgb(a)),y=lum(rgb(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};const ratios=[['--ss-text','--ss-background'],['--ss-text','--ss-surface-raised'],['--ss-text-muted','--ss-surface-hover'],['--ss-accent','--ss-surface'],['--ss-on-accent','--ss-accent'],['--ss-on-accent','--ss-accent-hover']].map(([a,b])=>({a,b,value:contrast(a,b)}));const bg=rgb('--ss-background'),border=contrast('--ss-border-strong','--ss-surface');probe.remove();return{ratios,border,bg}})()`);
     for(const ratio of result.ratios)assert.ok(ratio.value>=4.5,`${background}/${mode}/${scheme}/${accent} ${JSON.stringify(ratio)}`);
     assert.ok(result.border>=3,`${background}/${scheme} control border ${result.border}`);contrastReport.push({background,mode,scheme,accent,...result});
    }
   }
  }
  writeFileSync(new URL('../../.local/f1/contrast.json',import.meta.url),JSON.stringify(contrastReport,null,2));
  await browser.reload();await browser.wait('!!document.querySelector("input[name=background-theme]")');
  await browser.evaluate(`localStorage.setItem('studystreak:study-environment:v1:42',JSON.stringify({selection:'library',motion:false}));localStorage.setItem('studystreak-dashboard-v1-42','fixture-widgets-untouched')`);
  await choose('background-theme','sage');await choose('accent-palette','orange');
  await browser.reload();await browser.wait(`document.documentElement.dataset.background==='sage'&&document.documentElement.dataset.accent==='orange'`);
  owner=77;await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(token(77))})`);await browser.reload();await browser.wait(`document.documentElement.dataset.background==='neutral'&&document.documentElement.dataset.theme==='system'`);
  await choose('background-theme','sky');
  owner=42;await browser.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(token(42))})`);await browser.reload();await browser.wait(`document.documentElement.dataset.background==='sage'`);
  await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Restore default appearance')`);await browser.click('Restore default appearance');await browser.wait(`document.documentElement.dataset.background==='neutral'&&document.documentElement.dataset.theme==='system'&&document.documentElement.dataset.accent==='mint'`);
  assert.equal(await browser.evaluate(`JSON.parse(localStorage.getItem('studystreak:study-environment:v1:42')).selection`),'library');
  assert.equal(await browser.evaluate(`localStorage.getItem('studystreak-dashboard-v1-42')`),'fixture-widgets-untouched');
  await browser.key('Tab');await browser.evaluate(`document.querySelector('input[name=background-theme][value=lavender]').focus()`);assert.notEqual(await browser.evaluate('getComputedStyle(document.activeElement).outlineStyle'),'none');
  await browser.command('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await browser.command('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await browser.wait(`document.querySelector('input[name=background-theme][value=sage]').checked`);
  for(const family of ['neutral','lavender','sage','amber','sky'])for(const scheme of ['light','dark']){
   const rows=contrastReport.filter(r=>r.background===family&&r.scheme===scheme);
   assert.equal(new Set(rows.map(r=>JSON.stringify(r.bg))).size,1,'accent and System must not change the family');
  }
  assert.equal(new Set(contrastReport.filter(r=>r.mode==='light'&&r.accent==='mint').map(r=>JSON.stringify(r.bg))).size,5);
  // Exercise live AuthContext changes: no router remount or stale account appearance.
  await browser.evaluate(`sessionStorage.setItem('refreshToken','fixture-only-refresh');Array.from(document.querySelectorAll('aside button')).find(b=>b.textContent.trim()==='Sign out').click()`);
  await browser.wait(`location.pathname==='/login'&&!!document.querySelector('#username')&&document.documentElement.dataset.background==='neutral'`);
  owner=77;await browser.fill('#username','fixture');await browser.fill('#password','fixture-only');await browser.click('Login');
  await browser.wait(`location.pathname==='/dashboard'&&!!document.querySelector('.cozy-dashboard')&&document.documentElement.dataset.background==='sky'`);
 }
 assert.deepEqual(writes,before?[]:['/logout','/login']);assert.deepEqual(browser.errors,[]);
 console.log(before?'Baseline captures saved.':'Five families, modes/system, four accents, contrast, focus, account isolation, restore independence and target routes passed.');
}catch(error){writeFileSync(new URL('../../.local/f1/failure.json',import.meta.url),JSON.stringify({path:await browser.evaluate('location.pathname'),text:await browser.evaluate('document.body.innerText'),errors:browser.errors}));throw error;}finally{await browser.close();}
