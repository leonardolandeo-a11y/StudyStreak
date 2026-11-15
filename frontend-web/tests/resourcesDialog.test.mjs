import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
const output=new URL('../../.local/f6/resources/',import.meta.url);mkdirSync(output,{recursive:true});
test('Resources retains error/retry/empty states and accessible book details',{timeout:45000},async()=>{
 let mode='error';const requests=[];
 const b=await profileBrowser({intercept:async request=>{
  if(new URL(request.url).pathname==='/api/resources/books'){
   requests.push(request);await new Promise(resolve=>setTimeout(resolve,120));
   if(mode==='error')return{status:503};
   return{body:mode==='empty'?[]:[{id:'fixture-algebra',title:'Algebra companion',authors:['Study Author'],description:'A detailed study resource. '.repeat(120),infoLink:'https://books.google.com/books?id=fixture-algebra',previewLink:'https://books.google.com/books?id=fixture-algebra&printsec=frontcover',categories:['Mathematics']}]};
  }
  return environmentFixture(request);
 }});
 const shot=async name=>{const r=await b.command('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(name+'.png',output),Buffer.from(r.data,'base64'));};
 try{
  await b.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});
  await b.command('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
  await b.navigate('/resources?topic=Algebra');await b.wait(`!!document.querySelector('[role=alert]')`);assert.ok(await b.evaluate(`document.querySelector('[role=alert]').textContent.includes('API key')`));
  mode='empty';await b.click('Search books');await b.wait(`document.body.textContent.includes('No books found')`);
  mode='success';await b.click('Search books');await b.wait(`document.body.textContent.includes('Algebra companion')`);
  await b.evaluate(`(()=>{const button=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Algebra companion'));button.id='resource-dialog-trigger';button.focus();button.click()})()`);
  await b.wait(`!!document.querySelector('[role=dialog]')`);
  const focusInside=await b.evaluate(`document.querySelector('[role=dialog]').contains(document.activeElement)`);
  await shot('details-390');
  await b.key('Escape');await new Promise(resolve=>setTimeout(resolve,150));
  const closed=await b.evaluate(`!document.querySelector('[role=dialog]')`);
  writeFileSync(new URL('keyboard-result.json',output),JSON.stringify({focusInside,closed},null,2));
  assert.equal(closed,true,'Escape must close book details');assert.equal(focusInside,true,'Opening details moves focus inside the modal');
  assert.equal(await b.evaluate(`document.activeElement.id`),'resource-dialog-trigger');assert.equal(await b.evaluate(`document.body.style.overflow`),'');
  for(const width of [390,768,1440,1920]){
   await b.command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
   await b.evaluate(`document.querySelector('#resource-dialog-trigger').click()`);await b.wait(`!!document.querySelector('dialog[open]')`);
   assert.equal(await b.evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);assert.equal(await b.evaluate(`document.body.style.overflow`),'hidden');
   await b.evaluate(`document.querySelector('#book-search').focus()`);assert.equal(await b.evaluate(`document.querySelector('dialog').contains(document.activeElement)`),true,'Background remains inert');
   assert.ok(await b.evaluate(`Array.from(document.querySelectorAll('dialog a')).every(a=>a.protocol==='https:'&&a.target==='_blank'&&a.rel.includes('noopener'))`));
   await shot('details-'+width);await b.evaluate(`document.querySelector('[aria-label="Close book details"]').click()`);await b.wait(`!document.querySelector('dialog')`);
  }
  await b.evaluate(`document.querySelector('#resource-dialog-trigger').click()`);await b.wait(`!!document.querySelector('dialog[open]')`);
  for(const type of ['mousePressed','mouseReleased'])await b.command('Input.dispatchMouseEvent',{type,button:'left',clickCount:1,x:5,y:5});
  await b.wait(`!document.querySelector('dialog')`);assert.equal(await b.evaluate(`document.body.style.overflow`),'');
  assert.ok(requests.every(r=>r.method==='GET'&&Boolean(r.headers.Authorization??r.headers.authorization)));assert.deepEqual(b.errors,[]);
 }finally{await b.close();}
});
