import {writeFileSync} from 'node:fs';
import {mobileBrowser} from './helpers/mobileBrowser.mjs';
import {roomPolishFixture} from '../../scripts/tests/roomPolishFixture.mjs';
import {roomPolishReview} from '../../scripts/tests/roomPolishReview.mjs';
const fixture=roomPolishFixture(),browser=await mobileBrowser({intercept:fixture.intercept});
try{await roomPolishReview(browser,'mobile',fixture);}catch(error){writeFileSync('../.local/stage74d/mobile-polish-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),requests:fixture.actorRequests,visibility:await browser.evaluate('document.visibilityState')}));throw error;}finally{await browser.close();}
