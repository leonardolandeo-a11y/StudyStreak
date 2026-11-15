import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'vite';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});after(()=>server.close());
const {default:Loading}=await server.ssrLoadModule('/src/components/ui/AppLoadingScreen.tsx');
const {default:ProtectedRoute}=await server.ssrLoadModule('/src/components/ProtectedRoute.tsx');
const {AuthContext}=await server.ssrLoadModule('/src/contexts/AuthContext.ts');

test('app loader announces only its message and protected restoration still hides private content',()=>{
 const html=render(h(Loading));assert.match(html,/Loading your study space\.\.\./);assert.match(html,/role="status"/);assert.match(html,/aria-live="polite"/);assert.match(html,/aria-hidden="true"/);assert.match(html,/data-study-mark/);
 assert.match(render(h(Loading,{message:'<script>unsafe</script>'})),/&lt;script&gt;unsafe&lt;\/script&gt;/);
 const context={isAuthenticated:false,isLoading:true,currentUser:null,login:async()=>{},logout:()=>{}};
 const guarded=render(h(AuthContext.Provider,{value:context},h(ProtectedRoute,null,'Private content')));
 assert.match(guarded,/Restoring your study session/);assert.doesNotMatch(guarded,/Private content/);
 assert.match(render(h(AuthContext.Provider,{value:{...context,isLoading:false,isAuthenticated:true}},h(ProtectedRoute,null,'Private content'))),/Private content/);
});

test('Chrome: real restoring loader follows themes, animates steam, respects reduced motion and exits after refresh',{timeout:30000},async()=>{
 const captures=mkdtempSync(join(tmpdir(),'studystreak-loading-'));
 let release,refreshes=0;
 const b=await profileBrowser({intercept:async req=>{
  if(new URL(req.url).pathname==='/refresh'){refreshes++;return new Promise(resolve=>{release=()=>resolve({body:{token,refreshToken:'fixture-only'}});});}
  return environmentFixture(req);
 }});
 try{
  await b.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('refreshToken','fixture-only');window.__loaderHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__loaderHidden});`});
  await b.command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await b.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await b.command('Page.navigate',{url:b.origin+'/goals'});await b.wait(`document.querySelector('.app-loading-screen')?.textContent.includes('Restoring your study session')`);
  await b.wait(`document.querySelector('.app-loading-screen').dataset.ambient==='running'`);
  const before=await b.evaluate(`getComputedStyle(document.querySelector('.app-loading-spiral')).transform`);
  await new Promise(r=>setTimeout(r,450));assert.notEqual(await b.evaluate(`getComputedStyle(document.querySelector('.app-loading-spiral')).transform`),before);
  for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark']){
   await b.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'mint',reduceMotion:false})`);
   const view=await b.evaluate(`(()=>{const root=document.documentElement,e=document.querySelector('.app-loading-screen'),r=e.getBoundingClientRect(),symbol=e.querySelector('.app-loading-symbol').getBoundingClientRect();return{background:getComputedStyle(e).backgroundColor,canvas:getComputedStyle(root).backgroundColor,width:r.width,height:r.height,center:symbol.x+symbol.width/2,live:document.querySelectorAll('[role=status]').length}})()`);
   assert.equal(view.background,view.canvas);assert.equal(view.width,1440);assert.equal(view.height,900);assert.equal(view.center,720);assert.equal(view.live,1);
   if(background==='lavender'){
    const image=await b.command('Page.captureScreenshot',{format:'png'});writeFileSync(join(captures,`loading-${mode}.png`),Buffer.from(image.data,'base64'));
   }
  }
  await b.evaluate(`window.__loaderHidden=true;document.dispatchEvent(new Event('visibilitychange'))`);await b.wait(`document.querySelector('.app-loading-screen').dataset.ambient==='paused'`);
  assert.equal(await b.evaluate(`getComputedStyle(document.querySelector('.app-loading-spiral')).animationPlayState`),'paused');
  await b.evaluate(`window.__loaderHidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await b.wait(`document.querySelector('.app-loading-screen').dataset.ambient==='running'`);
  for(const device of [false,true]){
   await b.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:device?'reduce':'no-preference'}]});
   await b.evaluate(`window.studyStreakAppearance.apply({reduceMotion:${!device}})`);
   assert.equal(await b.evaluate(`getComputedStyle(document.querySelector('.app-loading-spiral')).animationName`),'none');
  }
  await b.command('Emulation.setDeviceMetricsOverride',{width:320,height:640,deviceScaleFactor:1,mobile:true});assert.equal(await b.evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
  const image=await b.command('Page.captureScreenshot',{format:'png'});writeFileSync(join(captures,'loading-320.png'),Buffer.from(image.data,'base64'));
  assert.equal(refreshes,1);release();await b.wait(`document.body.textContent.includes('Linear algebra')`);assert.equal(await b.evaluate(`!!document.querySelector('.app-loading-screen')`),false);assert.deepEqual(b.errors,[]);
 }finally{release?.();await b.close();}
});
