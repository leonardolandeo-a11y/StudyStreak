import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
export async function reviewNativeModule(browser,name){
 await browser.evaluate('document.activeElement?.blur()');
 for(const width of [320,390,768,1440]){
  await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
  await browser.wait(`innerWidth===${width}&&document.documentElement.scrollWidth<=innerWidth`);
  await browser.evaluate(`Array.from(document.querySelectorAll('div')).filter(e=>e.scrollHeight>e.clientHeight&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).forEach(e=>e.scrollTop=0)`);
  // Let native dimension/layout effects settle before inspecting the frame.
  await browser.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,name);
  const shot=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/73b-${name}-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
export async function reviewNativeSettings(browser){
 for(const [mode,accent]of [['Dark','Mint'],['Light','Blue'],['System','Purple'],['Light','Orange']]){
  await browser.click(mode);await browser.click(accent);
  await reviewNativeModule(browser,`settings-${mode}-${accent}`);
 }
}
