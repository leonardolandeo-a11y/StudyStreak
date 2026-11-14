import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
const before=process.env.F1_SIDEBAR_BEFORE==='1';
const output=new URL(process.env.SIDEBAR_CAPTURES||'../../docs/images/final-ui-f1-sidebar/',import.meta.url);mkdirSync(output,{recursive:true});
const token='fixture.'+Buffer.from(JSON.stringify({type:'access',userId:42,sub:'Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
test('sidebar and pixel skyline follow all background families independently of accents',{timeout:120000},async()=>{
 const browser=await profileBrowser({intercept:async req=>{
  const p=new URL(req.url).pathname;assert.equal(req.method,'GET','No API writes permitted');
  if(p==='/api/profile')return{body:{id:42,username:'Scholar',presentationName:'Study Scholar'}};
  if(p==='/api/profile/privacy')return{body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
  if(p.endsWith('/goals'))return{body:{content:[],number:0,size:10,totalElements:0,totalPages:0,empty:true,first:true,last:true}};
  if(p.endsWith('/unread'))return{body:0};return{status:404};
 }});
 const apply=async(background,mode,accent)=>{await browser.evaluate(`window.studyStreakAppearance.save({background:'${background}',mode:'${mode}',accent:'${accent}',reduceMotion:false},42);window.dispatchEvent(new StorageEvent('storage',{key:window.studyStreakAppearance.accountKey(42)}))`);await browser.wait(`document.documentElement.dataset.background==='${background}'&&document.documentElement.dataset.theme==='${mode}'&&document.documentElement.dataset.accent==='${accent}'`);await browser.evaluate('new Promise(r=>setTimeout(r,240))');};
 const capture=async name=>{await browser.evaluate('document.activeElement?.blur()');const image=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(name+'.png',output),Buffer.from(image.data,'base64'));};
 try{
  await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await browser.navigate('/settings');await browser.wait('!!document.querySelector("input[name=background-theme]")');
  if(before){await apply('sage','dark','mint');await capture('before-sage-dark-mint');return;}
  await browser.navigate('/goals');await browser.wait(`!!document.querySelector('.academic-module h1')&&!!document.querySelector('.sidebar-destination[aria-current=page]')`);
  const reports=[];
  for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system'])for(const scheme of mode==='system'?['light','dark']:[mode])for(const accent of ['mint','blue','purple','orange']){
   await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme}]});await apply(background,mode,accent);
   const report=await browser.evaluate(`(()=>{const aside=document.querySelector('.workspace-sidebar'),nav=aside.querySelector('[data-nav-icon]'),svg=aside.querySelector('.sidebar-landscape svg'),account=aside.querySelector('.sidebar-account');const s=getComputedStyle(aside),root=getComputedStyle(document.documentElement);const probe=document.createElement('span');aside.append(probe);const color=value=>{probe.style.color=value;const canvas=document.createElement('canvas'),c=canvas.getContext('2d');c.fillStyle=getComputedStyle(probe).color;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3)};const lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const ratio=(a,b)=>{const x=lum(color(a)),y=lum(color(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};const bg=s.backgroundColor,active=aside.querySelector('[aria-current=page]'),a=getComputedStyle(active),collapse=getComputedStyle(aside.querySelector('.sidebar-collapse'));const result={bg,root:root.backgroundColor,hover:s.getPropertyValue('--ss-surface-hover'),building:svg?getComputedStyle(svg.querySelector('[data-city-tone=building]')).fill:null,text:ratio(getComputedStyle(nav).color,bg),muted:ratio(getComputedStyle(account.querySelector('p:last-child')).color,getComputedStyle(account).backgroundColor),active:ratio(a.color,a.backgroundColor),control:ratio(collapse.borderTopColor,collapse.backgroundColor),icon:ratio(getComputedStyle(nav.querySelector('svg')).color,bg),star:svg?getComputedStyle(svg.querySelector('[data-city-tone=star]')).fill:null};probe.remove();return result})()`);
   assert.equal(report.bg,report.root,`${background}/${mode}/${accent}: sidebar must match the selected canvas`);
   for(const property of ['text','muted','active'])assert.ok(report[property]>=4.5,`${background}/${scheme}/${accent}: ${property}=${report[property]}`);
   assert.ok(report.control>=3);assert.ok(report.icon>=3);assert.ok(report.building);reports.push({background,mode,scheme,accent,...report});
  }
  for(const family of ['neutral','lavender','sage','amber','sky'])for(const scheme of ['light','dark']){
   const rows=reports.filter(r=>r.background===family&&r.scheme===scheme);assert.equal(new Set(rows.map(r=>r.bg)).size,1);assert.equal(new Set(rows.map(r=>r.building)).size,1,'accent must not recolor buildings');
  }
  for(const scheme of ['light','dark'])assert.equal(new Set(reports.filter(r=>r.mode===scheme&&r.accent==='mint').map(r=>r.building)).size,5);
  // F5 intentionally replaces the generic skyline, preserving its size and theme roles.
  assert.equal(await browser.evaluate(`document.querySelector('.sidebar-landscape svg').getAttribute('viewBox')`),'0 0 128 46');
  assert.equal(await browser.evaluate(`document.querySelectorAll('.sidebar-landscape [data-barranco-part]').length`),3);
  assert.equal(await browser.evaluate(`(()=>{const r=document.querySelector('.sidebar-landscape [data-barranco-silhouette]').getBBox();return r.x>=0&&r.y>=0&&r.x+r.width<=128&&r.y+r.height<=46})()`),true);
  await browser.navigate('/settings');await browser.wait('!!document.querySelector("input[name=background-theme]")');
  for(const [background,mode,accent]of [['sage','dark','mint'],['lavender','dark','purple'],['neutral','light','blue'],['amber','light','orange']]){await apply(background,mode,accent);
   const point=await browser.evaluate(`(()=>{const r=document.querySelector('[data-nav-icon=Resources]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await browser.evaluate('new Promise(r=>setTimeout(r,240))');
   assert.equal(await browser.evaluate(`(()=>{const link=document.querySelector('[data-nav-icon=Resources]'),probe=document.createElement('span');probe.style.background='var(--ss-surface-hover)';probe.style.color='var(--ss-text)';link.append(probe);const correct=getComputedStyle(link).backgroundColor===getComputedStyle(probe).backgroundColor&&getComputedStyle(link).color===getComputedStyle(probe).color;probe.remove();return correct})()`),true,'hover inherits family surfaces and readable text');
   await browser.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await browser.wait('!document.querySelector("[role=tooltip]")');await capture(`${background}-${mode}-${accent}`);
  }
  await browser.evaluate(`document.querySelector('[aria-label="Collapse sidebar"]').click()`);await browser.wait('document.querySelector(".workspace-sidebar").getBoundingClientRect().width===84');
  await browser.key('Tab');await browser.evaluate(`document.querySelector('[data-nav-icon="Resources"]').focus()`);await browser.wait(`document.querySelector('[role=tooltip]')?.textContent.includes('Find books')`);
  assert.equal(await browser.evaluate(`document.activeElement.getAttribute('aria-describedby')===document.querySelector('[role=tooltip]').id`),true);
  assert.notEqual(await browser.evaluate('getComputedStyle(document.activeElement).outlineStyle'),'none');
  await browser.key('Escape');await browser.wait('!document.querySelector("[role=tooltip]")');
  await browser.evaluate(`document.querySelector('[aria-label="Expand sidebar"]').click()`);await browser.wait('document.querySelector(".workspace-sidebar").getBoundingClientRect().width===264');
  await browser.evaluate(`document.querySelector('[data-nav-icon="Resources"]').focus()`);assert.ok(await browser.evaluate(`document.querySelector('.sidebar-resource-page').getAnimations().length>0`));
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await browser.wait(`getComputedStyle(document.querySelector('.sidebar-resource-page')).animationName==='none'`);
  assert.equal(await browser.evaluate('document.querySelectorAll(".workspace-sidebar nav a").length'),8);
  assert.deepEqual(browser.errors,[]);writeFileSync(new URL('../../.local/f1-sidebar/contrast.json',import.meta.url),JSON.stringify(reports,null,2));
 }finally{await browser.close();}
});
