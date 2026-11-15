import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});after(()=>server.close());
const {AuthEntry}=await server.ssrLoadModule('/src/components/auth/AuthEntry.tsx');
const {AuthContext}=await server.ssrLoadModule('/src/contexts/AuthContext.ts');
const h=React.createElement;
test('public entry waits for restore and exposes forms only to guests',()=>{
 const render=value=>renderToStaticMarkup(h(MemoryRouter,null,h(AuthContext.Provider,{value},h(AuthEntry,null,h('form',{'aria-label':'Auth form'})))));
 assert.match(render({isAuthenticated:false,isLoading:true}),/Restoring your study session/);
 assert.doesNotMatch(render({isAuthenticated:false,isLoading:true}),/Auth form/);
 assert.match(render({isAuthenticated:false,isLoading:false}),/Auth form/);
 assert.doesNotMatch(render({isAuthenticated:true,isLoading:false}),/Auth form/);
});
test('Chrome: root/login/register, persistent session, restore, logout and protected URL routing', {timeout:60000,skip:!chrome&&'Chrome unavailable'},async()=>{
 let logins=0,refreshes=0,logouts=0;
 const token='fixture.'+Buffer.from(JSON.stringify({type:'access',userId:42,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
 const page=await profileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;
  if(path==='/login'){logins++;return{body:{token,refreshToken:'fixture-only'}};}
  if(path==='/refresh'){refreshes++;return{body:{token,refreshToken:'fixture-only'}};}
  if(path==='/logout'){logouts++;return{status:204};}
  if(path==='/api/profile')return{body:{id:42,username:'fixture',presentationName:'Fixture'}};
  if(path==='/users/42/goals/7')return{body:{id:7,topic:'Auth deep-link fixture',frequency:3,duration:25,completed:false}};
  if(path.includes('unread'))return{body:{content:[],totalElements:0,totalPages:0,last:true}};
  return{status:404};
 }});
 try{
  await page.navigate('/');await page.wait(`location.pathname==='/login'&&!!document.querySelector('#username')`);
  assert.equal(await page.evaluate(`document.body.textContent.includes('Build consistent study habits')`),false);
  await page.evaluate(`document.querySelector('a[href="/register"]').click()`);await page.wait(`location.pathname==='/register'&&!!document.querySelector('#email')`);
  for(const [width,height]of [[320,844],[390,844],[600,390],[844,390],[1440,900]]){
   await page.command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024});
   await page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
   await page.wait('document.documentElement.scrollWidth<=innerWidth');
   const layout=await page.evaluate(`(()=>{const e=document.querySelector('.auth-content'),r=e.getBoundingClientRect();return{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight,scrollWidth:document.documentElement.scrollWidth,left:r.left,cardWidth:r.width,justify:getComputedStyle(e.parentElement).justifyContent};})()`);
   // Mobile Chrome can paint a wider fixed layout viewport than its visual viewport.
   // Verify actual horizontal scrolling and visible control bounds instead of rejecting that gutter.
   await page.evaluate('window.scrollTo(100,scrollY)');assert.equal(await page.evaluate('scrollX'),0,JSON.stringify(layout));
   assert.ok(layout.width>layout.height?layout.left>=layout.width*.4:Math.abs(layout.left+layout.cardWidth/2-layout.width/2)<2,JSON.stringify(layout));
   await page.evaluate(`(async()=>{for(const e of document.querySelectorAll('form input,button[type=submit]')){e.scrollIntoView({block:'center'});await new Promise(requestAnimationFrame);const r=e.getBoundingClientRect(),w=document.documentElement.clientWidth,h=visualViewport?.height??document.documentElement.clientHeight;if(r.left<0||r.right>w+1||r.top<0||r.bottom>h+1)throw Error('Inaccessible auth control');}})()`);
  }
  await page.evaluate(`document.querySelector('a[href="/login"]').click()`);await page.wait(`location.pathname==='/login'&&document.querySelector('button[type=submit]')?.textContent.trim()==='Login'`);
  await page.fill('#username','fixture');await page.fill('#password','Fixture-pass-1');await page.click('Login');await page.wait(`location.pathname==='/dashboard'`);assert.equal(logins,1);
  for(const path of ['/','/login','/register']){await page.navigate(path);await page.wait(`location.pathname==='/dashboard'`);}
  await page.navigate('/goals/7');await page.wait(`location.pathname==='/goals/7'`);assert.equal(await page.evaluate(`!!sessionStorage.getItem('accessToken')`),true);
  await page.evaluate(`sessionStorage.removeItem('accessToken')`);await page.navigate('/');await page.wait(`location.pathname==='/dashboard'`);assert.equal(refreshes,1);
  await page.wait(`!!document.querySelector('[aria-label="Sign out"]')`);await page.evaluate(`document.querySelector('[aria-label="Sign out"]').click()`);await page.wait(`location.pathname==='/login'&&!!document.querySelector('#username')`);
  for(let i=0;i<50&&!logouts;i++)await new Promise(resolve=>setTimeout(resolve,20));assert.equal(logouts,1);
  assert.equal(await page.evaluate(`sessionStorage.getItem('accessToken')||sessionStorage.getItem('refreshToken')`),null);
  await page.navigate('/goals/7');await page.wait(`location.pathname==='/login'&&!!document.querySelector('#username')`);assert.equal(logins,1);assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});
