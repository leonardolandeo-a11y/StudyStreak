import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
export async function academicGallery(browser,module){
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 const surface=`(()=>{const panel=Array.from(document.querySelectorAll('[data-testid="academic-panel"]')).find(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]'));return panel?getComputedStyle(panel).backgroundColor:null;})()`;
 for(const mode of ['Dark','Light','System'])for(const accent of ['Mint','Blue','Purple','Orange']){
  await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]});
  await browser.click('Open menu');await browser.click('Settings');await browser.click(mode);await browser.click(accent);
  await browser.evaluate('history.back()');
  await browser.wait(`${surface}===${JSON.stringify(mode==='Light'?'rgb(255, 255, 255)':module==='dashboard'?'rgb(52, 42, 71)':'rgb(20, 28, 34)')}`);
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await browser.evaluate(`Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`);
  const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/73a-${module}-${mode}-${accent}.png`,Buffer.from(shot.data,'base64'));
 }
 await browser.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'reduce'}]});
 await browser.wait(`${surface}==='rgb(255, 255, 255)'`);
}
