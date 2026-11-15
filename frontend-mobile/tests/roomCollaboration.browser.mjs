import {writeFileSync} from 'node:fs';
import {mobileBrowser} from './helpers/mobileBrowser.mjs';
import {collaborationFixture} from '../../scripts/tests/roomCollaborationFixture.mjs';
import {reviewRoom} from '../../scripts/tests/roomCollaborationReview.mjs';
const fixture=collaborationFixture(),browser=await mobileBrowser({intercept:fixture.intercept});
try{await reviewRoom(browser,'mobile',fixture);}catch(error){writeFileSync('../.local/stage74c/mobile-room-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),reactions:await browser.evaluate(`Array.from(document.querySelectorAll('[aria-label=\"👏\"]')).map(e=>e.outerHTML)`),requests:fixture.requests}));throw error;}finally{await browser.close();}
