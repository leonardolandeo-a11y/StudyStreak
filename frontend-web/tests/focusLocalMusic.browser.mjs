import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const before=process.env.F4_BEFORE==='1',part='focus';
const output=new URL('../../.local/captures/final-ui-f4/',import.meta.url);mkdirSync(output,{recursive:true});
let owner=101;
const notes=[{id:10,type:'WEEKLY_SUMMARY',message:'Existing weekly summary',read:false,createdAt:'2026-11-14T09:00:00'},{id:9,type:'GOAL_COMPLETED',message:'Existing goal update',relatedGoalId:7,read:true,createdAt:'2026-11-13T09:00:00'}];
const requests=[];
const tones=new URL('../../.local/f4/tones/',import.meta.url);mkdirSync(tones,{recursive:true});
for(const name of ['alpha.wav','beta.wav']){const samples=44100*8,buffer=Buffer.alloc(44+samples*2);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(44100,24);buffer.writeUInt32LE(88200,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)buffer.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*220/44100)*200),44+i*2);writeFileSync(new URL(name,tones),buffer);}
writeFileSync(new URL('invalid.txt',tones),'Not audio');
const press=async name=>{await browser.wait(`Array.from(document.querySelectorAll('button')).some(b=>!b.disabled&&(b.getAttribute('aria-label')===${JSON.stringify(name)}||b.textContent.trim()===${JSON.stringify(name)}))`);await browser.evaluate(`Array.from(document.querySelectorAll('button')).find(b=>!b.disabled&&(b.getAttribute('aria-label')===${JSON.stringify(name)}||b.textContent.trim()===${JSON.stringify(name)})).click()`);};
const importFiles=async names=>{const {root}=await browser.command('DOM.getDocument');const {nodeId}=await browser.command('DOM.querySelector',{nodeId:root.nodeId,selector:'input[type=file]'});await browser.command('DOM.setFileInputFiles',{nodeId,files:names.map(name=>fileURLToPath(new URL(name,tones)))});};
const page=content=>({content,number:0,size:20,totalElements:content.length,totalPages:1,first:true,last:true,empty:!content.length});
const browser=await profileBrowser({desktopPointer:true,cacheDir:fileURLToPath(new URL('../../.local/f4/vite-cache/',import.meta.url)),intercept:request=>{
 const path=new URL(request.url).pathname;requests.push({path,method:request.method});
 if(path==='/api/profile')return{body:{id:owner,username:'Fixture Student'}};
 if(path.includes('/notifications')){
  if(request.method==='DELETE'){notes.splice(notes.findIndex(n=>path.endsWith('/'+n.id)),1);return{status:204};}
  if(request.method==='PATCH'){const n=notes.find(n=>path.includes('/'+n.id+'/'));if(n)n.read=true;return{body:n};}
  return{body:page(path.endsWith('/unread')?notes.filter(n=>!n.read):notes)};
 }
 return environmentFixture(request);
}});
const capture=async name=>{const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL((before?'before-':'after-')+name+'.png',output),Buffer.from(shot.data,'base64'));};
try{
 await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',sessionStorage.getItem('accessToken')||${JSON.stringify(token)});`});
 await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 if(before){
  await browser.navigate('/focus-studio');await browser.wait('!!document.querySelector("[data-slot=carousel]")');await browser.evaluate('document.querySelector("[data-slot=carousel]").scrollIntoView({block:"center"})');await capture('focus');
  await browser.navigate('/notifications');await browser.wait(`document.body.textContent.includes('Existing weekly summary')`);await capture('notifications');
 }else{

  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`window.__urls={created:[],revoked:[]};const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=blob=>{const url=create.call(URL,blob);window.__urls.created.push(url);return url;};URL.revokeObjectURL=url=>{window.__urls.revoked.push(url);revoke.call(URL,url);};const RealAudio=Audio;window.__media=[];window.Audio=function(...args){const a=new RealAudio(...args);window.__media.push(a);return a;};window.Audio.prototype=RealAudio.prototype;`});
  if(part==='all'||part==='focus'){
   await browser.navigate('/focus-studio');await browser.wait('!!document.querySelector("[data-slot=carousel]")');assert.equal(await browser.evaluate(`document.querySelectorAll('[data-slot=carousel-item]').length`),12);
   await browser.evaluate(`document.querySelector('[data-slot=carousel-content]').scrollIntoView({block:'center'})`);await browser.command('Page.bringToFront');
   const origin=await browser.evaluate(`(()=>{const r=document.querySelector('[data-slot=carousel-content]').getBoundingClientRect();return{x:r.x+r.width*.7,y:r.y+70,transform:document.querySelector('[data-slot=carousel-content] > div').style.transform}})()`);
   await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:origin.x,y:origin.y});await browser.command('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:origin.x,y:origin.y});for(let i=1;i<=12;i++)await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:origin.x-i*28,y:origin.y});await browser.command('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:origin.x-336,y:origin.y});
   await browser.wait(`document.querySelector('[data-slot=carousel-content] > div').style.transform!==${JSON.stringify(origin.transform)}`);assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Pause soundscape"]')`),false,'Drag must not start audio');await press('Next slide');await press('Previous slide');
   await importFiles(['alpha.wav','beta.wav','invalid.txt']);await browser.wait(`document.body.textContent.includes('Unsupported or empty audio: invalid.txt')`);await browser.wait(`!!document.querySelector('[aria-label="Play imported alpha.wav"]')`);assert.equal(await browser.evaluate('window.__urls.created.length'),2);
   await press('Play imported alpha.wav');await browser.wait(`!!document.querySelector('[aria-label="Pause local music"]')`);assert.equal(await browser.evaluate('window.__media.filter(a=>!a.paused).length'),1);await press('Pause local music');await browser.wait('window.__media.every(a=>a.paused)');await press('Play imported beta.wav');await browser.wait(`document.querySelector('[aria-label="Now playing"]').textContent.includes('beta.wav')`);
   await browser.fill('[aria-label="Soundscape volume"]','35');await browser.wait('window.__media.some(a=>a.volume===.35)');
   await browser.evaluate(`Array.from(document.querySelectorAll('[data-slot=carousel-item] button')).find(b=>b.getAttribute('aria-label')?.startsWith('Play ')).click()`);await browser.wait(`!!document.querySelector('[aria-label="Pause soundscape"]')`);assert.equal(await browser.evaluate('window.__media.every(a=>a.paused)'),true);
   await press('Play imported alpha.wav');await browser.wait(`!!document.querySelector('[aria-label="Pause local music"]')`);assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Pause soundscape"]')`),false);await press('Remove imported alpha.wav');assert.equal(await browser.evaluate('window.__urls.revoked.length'),1);
   await browser.evaluate(`document.querySelector('[aria-label="Imported music"]').scrollIntoView({block:'center'})`);await capture('focus-imported');
   for(const width of [390,768,1440,1920]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});await browser.wait('document.documentElement.scrollWidth<=innerWidth');await browser.evaluate(`document.querySelector('[aria-label="Imported music"]').scrollIntoView({block:'end'})`);await capture('focus-'+width);}
   for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
    await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});await browser.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:true})`);await browser.wait('document.documentElement.scrollWidth<=innerWidth');
   }
   assert.equal(await browser.evaluate(`localStorage.getItem('studystreak:focus-studio:v1:101').includes('blob:')`),false);
   await browser.navigate('/dashboard');await browser.wait('!!document.querySelector(".cozy-dashboard")');assert.equal(await browser.evaluate('window.__urls.created.length===window.__urls.revoked.length'),true);assert.equal(await browser.evaluate('window.__media.every(a=>a.paused&&!a.getAttribute("src"))'),true);
  }
  await browser.navigate('/focus-studio');await browser.wait(`!!document.querySelector('[aria-label="Import local audio files"]')`);await importFiles(['beta.wav']);await press('Play imported beta.wav');await browser.wait(`!!document.querySelector('[aria-label="Pause local music"]')`);await press('Sign out');await browser.wait(`!document.querySelector('[aria-label="Now playing"]')`);assert.equal(await browser.evaluate('window.__urls.created.length===window.__urls.revoked.length'),true);assert.equal(await browser.evaluate('window.__media.every(a=>a.paused&&!a.getAttribute("src"))'),true);
  assert.equal(requests.some(r=>/focus-sessions|api\/study\//.test(r.path)&&r.method!=='GET'),false);assert.deepEqual(browser.errors,[]);console.log('F4 '+part+' passed. Real local WAV decoding and Chrome mouse gestures; API writes mocked.');

 }
}finally{await browser.close();}
