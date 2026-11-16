import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const output=new URL('../../.local/captures/sidebar-header-hotfix/',import.meta.url);mkdirSync(output,{recursive:true});
const b=await profileBrowser({desktopPointer:true,intercept:environmentFixture});
const capture=async name=>{const r=await b.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(name+'.png',output),Buffer.from(r.data,'base64'));};
const move=async(x,y)=>b.command('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
const geometry=()=>b.evaluate(`(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return {header:box('.sidebar-brand'),name:box('.sidebar-brand .study-brand-name'),cup:box('.sidebar-brand [data-study-mark]'),tagline:box('.sidebar-brand .study-brand-tagline'),nav:box('.sidebar-destinations'),links:Array.from(document.querySelectorAll('.sidebar-destination'),e=>{const r=e.getBoundingClientRect();return{height:r.height,y:r.y}})}})()`);
try{
 await b.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
 await b.command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
 await b.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await b.navigate('/goals');await b.wait(`!!document.querySelector('.sidebar-brand .study-brand-tagline')`);
 const tag='.sidebar-brand .study-brand-tagline';
 await b.wait(`getComputedStyle(document.querySelector('${tag}')).opacity==='0'`);
 const hidden=await geometry();assert.ok(hidden.header.height>=108&&hidden.header.height<=116);
 assert.ok(Math.abs(hidden.cup.x+hidden.cup.width/2-hidden.name.x-hidden.name.width/2)<1,'Cup and title centered');
 assert.ok(hidden.nav.y-hidden.tagline.bottom>=8,'Reserved space separates tagline from navigation');
 assert.ok(hidden.links.every(link=>link.height===52),'Menu item heights unchanged');
 for(let i=1;i<hidden.links.length;i++)assert.equal(hidden.links[i].y-hidden.links[i-1].y,56,'Menu spacing unchanged');
 await capture('expanded-hidden');
 await move(hidden.cup.x+hidden.cup.width/2,hidden.cup.y+hidden.cup.height/2);
 await b.wait(`getComputedStyle(document.querySelector('${tag}')).opacity==='1'`);
 await b.evaluate(`Promise.all(document.querySelector('.sidebar-brand [data-study-mark]').getAnimations().map(a=>a.finished))`);
 const shown=await geometry();
 for(const key of ['header','nav','links','name','cup'])assert.deepEqual(shown[key],hidden[key],'Hover never moves navigation or reserved geometry');
 assert.ok(shown.nav.y-shown.tagline.bottom>=8,'Visible tagline remains inside the header');
 const style=await b.evaluate(`(()=>{const e=document.querySelector('${tag}'),s=getComputedStyle(e);return{position:s.position,background:s.backgroundColor,shadow:s.boxShadow,transition:s.transitionDuration,role:e.getAttribute('role'),tooltips:document.querySelectorAll('.sidebar-brand [role=tooltip]').length,count:document.querySelectorAll('.sidebar-brand .study-brand-tagline').length}})()`);
 assert.equal(style.position,'static');assert.equal(style.background,'rgba(0, 0, 0, 0)');assert.equal(style.shadow,'none');assert.equal(style.role,null);assert.equal(style.tooltips,0);assert.equal(style.count,1);assert.match(style.transition,/0\.18s/);
 await capture('expanded-hover');
 await move(300,40);await b.wait(`getComputedStyle(document.querySelector('${tag}')).opacity==='0'`);
 await b.evaluate(`document.querySelector('.sidebar-brand .study-brand-name').focus()`);await b.wait(`getComputedStyle(document.querySelector('${tag}')).opacity==='1'`);await capture('expanded-focus');
 await b.key('Escape');await b.wait(`getComputedStyle(document.querySelector('${tag}')).opacity==='0'`);assert.equal(await b.evaluate(`document.activeElement.classList.contains('study-brand-name')`),true);
 await b.evaluate(`document.querySelector('[aria-label="Collapse sidebar"]').focus()`);await b.key('Tab');
 assert.equal(await b.evaluate(`document.activeElement.dataset.navIcon`),'Dashboard');
 await b.evaluate(`document.querySelector('[aria-label="Collapse sidebar"]').click()`);await b.wait(`document.querySelector('.workspace-sidebar').getBoundingClientRect().width===84`);
 assert.equal(await b.evaluate(`document.querySelectorAll('.sidebar-brand .study-brand-tagline,.sidebar-brand .sidebar-collapse').length`),0);
 assert.equal(await b.evaluate(`document.querySelector('.sidebar-brand').getBoundingClientRect().height`),76);
 assert.equal(await b.evaluate(`document.activeElement.getAttribute('aria-label')`),'Expand sidebar');await capture('collapsed');
 await b.evaluate(`document.querySelector('.sidebar-cup-expand').click()`);await b.wait(`!!document.querySelector('.sidebar-brand .study-brand-name')`);
 for(const background of ['neutral','lavender','sage','amber','sky'])for(const mode of ['light','dark','system']){
  await b.evaluate(`window.studyStreakAppearance.apply({background:'${background}',mode:'${mode}',accent:'mint',reduceMotion:false});document.querySelector('.sidebar-brand .study-brand-name').focus()`);
  await b.wait(`getComputedStyle(document.querySelector('${tag}')).opacity==='1'`);
  assert.equal((await geometry()).nav.y,hidden.nav.y);
 }
 for(const device of [false,true]){
  await b.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:device?'reduce':'no-preference'}]});
  await b.evaluate(`window.studyStreakAppearance.apply({reduceMotion:${!device}})`);
  assert.equal(await b.evaluate(`getComputedStyle(document.querySelector('${tag}')).transitionDuration`),'0s');
 }
 for(const width of [390,768,1440,1920]){
  await b.command('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<768});
  await b.wait('document.documentElement.scrollWidth<=innerWidth');await capture('responsive-'+width);
 }
 await b.evaluate(`document.querySelector('[data-nav-icon="Resources"]').click()`);await b.wait(`location.pathname==='/resources'`);
 assert.deepEqual(b.errors,[]);
 console.log('Sidebar header: inline hover/focus/Escape, stable reserved geometry, centered brand, unchanged menu spacing, cup/chevron collapse, 15 appearances, both reduced-motion preferences, responsive and navigation passed.');
}finally{await b.close()}
