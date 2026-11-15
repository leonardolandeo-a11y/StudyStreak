import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});after(()=>server.close());
const {StudyMark,StudyBrand}=await server.ssrLoadModule('/src/components/branding/StudyBrand.tsx');
const render=element=>renderToStaticMarkup(element);
test('original geometry is shared, scalable, bounded and accessible without external resources',()=>{
 const canonical=JSON.parse(readFileSync(new URL('../../assets/branding/coffee-mark.json',import.meta.url),'utf8'));
 const mobile=readFileSync(new URL('../../frontend-mobile/src/components/branding/mark.ts',import.meta.url),'utf8');
 const web=readFileSync(new URL('../src/components/branding/mark.ts',import.meta.url),'utf8');assert.equal(mobile,web);assert.deepEqual(JSON.parse(web.match(/export default ([\s\S]+) as const;/)[1]),canonical);
 for(const [x,y,w,height,role]of canonical.rects){assert.ok(x>=0&&y>=0&&w>0&&height>0&&x+w<=32&&y+height<=32);assert.ok(['ink','accent','paper','muted','warm'].includes(role));}
 for(const size of [16,24,32,48,96]){const html=render(h(StudyMark,{size}));assert.match(html,/StudyStreak coffee mark/);assert.match(html,/crispEdges/);assert.match(html,new RegExp(`width="${size}"`));assert.doesNotMatch(html,/<image|https?:/);}
 assert.ok((render(h(StudyMark,{size:16})).match(/<rect/g)||[]).length<(render(h(StudyMark,{size:32})).match(/<rect/g)||[]).length);
 for(const variant of ['navigation','compact','signature']){const html=render(h(StudyBrand,{variant}));assert.equal((html.match(/aria-label="StudyStreak"/g)||[]).length,1);assert.match(html,/aria-hidden="true"/);assert.doesNotMatch(html,/button|tabindex/);}
 const favicon=readFileSync(new URL('../public/favicon.svg',import.meta.url),'utf8');assert.match(favicon,/prefers-color-scheme:dark/);assert.match(favicon,/viewBox="0 0 32 32"/);assert.doesNotMatch(favicon,/vite|data:image/);
});
const claims={type:'access',userId:42,sub:'brand-fixture',email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600};
const token=`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
test('Chrome: sidebar/topbar brand, contrast, themes, small marks and navigation remain usable',{timeout:90000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const page=await profileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;
  if(path==='/api/profile')return {body:{id:42,username:'brand-fixture',presentationName:'Brand Fixture',statistics:{studyStreak:0,bestStudyStreak:0,verifiedMinutes:0,verifiedSessions:0,activeGoals:0}}};
  if(path==='/api/profile/privacy')return {body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
  if(path==='/api/users/42/profile')return {body:{id:42,username:'brand-fixture',statistics:{},presence:{status:'HIDDEN'}}};
  if(path.includes('unread'))return {body:0};return {status:404};
 }});
 try{
  await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
  await page.navigate('/profile');await page.wait('!!document.querySelector(".study-brand-navigation")');
  const gallery=render(h('div',{id:'brand-review',style:{position:'fixed',top:80,left:16,right:16,zIndex:100,padding:24,background:'var(--ss-surface)',color:'var(--ss-text)',border:'1px solid var(--ss-border)',maxWidth:700}},h(StudyBrand,{variant:'signature'}),h('div',{style:{display:'flex',alignItems:'center',gap:18,marginTop:24,flexWrap:'wrap'}},...[16,24,32,48,96].map(size=>h(StudyMark,{size,key:size})))));
  for(const width of [320,375,768,1440]){
   await page.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
   for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
    await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'${accent}',reduceMotion:true})`);
    const result=await page.evaluate(`(()=>{
     const brands=Array.from(document.querySelectorAll('.study-brand')).filter(el=>el.getClientRects().length&&getComputedStyle(el).display!=='none');
     const visible=brands.find(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth});
     const color=getComputedStyle(visible.querySelector('.study-brand-name')).color,accent=getComputedStyle(visible.querySelector('.study-brand-name>span')).color;
     const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;
     const rgb=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3)};
     const lum=value=>rgb(value).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
     const bg=getComputedStyle(document.body).backgroundColor,b=lum(bg),ratio=c=>(Math.max(lum(c),b)+.05)/(Math.min(lum(c),b)+.05);
     return {fits:document.documentElement.scrollWidth<=innerWidth,visible:!!visible,contrast:ratio(color),accentContrast:ratio(accent),animations:visible.getAnimations({subtree:true}).length};
    })()`);
    assert.equal(result.fits,true,`${width}/${mode}/${accent}`);assert.equal(result.visible,true);assert.ok(result.contrast>=4.5);assert.ok(result.accentContrast>=4.5);assert.equal(result.animations,0);
   }
  }
  await page.evaluate(`document.querySelector('aside a[href="/goals"]').focus()`);assert.equal(await page.evaluate('document.activeElement.matches(":focus-visible")'),true);
  await page.evaluate(`document.body.insertAdjacentHTML('beforeend',${JSON.stringify(gallery)})`);
  for(const mode of ['dark','light']){
   await page.evaluate(`window.studyStreakAppearance.apply({mode:'${mode}',accent:'mint',reduceMotion:false})`);
   const shot=await page.command('Page.captureScreenshot',{format:'png'});writeFileSync(`/tmp/studystreak-brand-${mode}.png`,Buffer.from(shot.data,'base64'));
  }
  await page.evaluate(`document.querySelector('#brand-review').remove()`);
  const status=await page.evaluate(`fetch('/favicon.svg').then(r=>r.status)`);assert.equal(status,200);assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});
