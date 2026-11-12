import {test} from 'node:test';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture} from '../../scripts/tests/studyEnvironmentFixture.mjs';
import {reviewEnvironment} from '../../scripts/tests/studyEnvironmentReview.mjs';
test('Chrome: cozy environments preserve the dashboard and timer across periods and lifecycle', {timeout:120000}, async()=>{
 const browser=await profileBrowser({intercept:environmentFixture});
 try{await reviewEnvironment(browser,'web');}finally{await browser.close();}
});
