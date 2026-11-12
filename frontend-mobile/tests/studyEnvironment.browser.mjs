import {mobileBrowser} from './helpers/mobileBrowser.mjs';
import {environmentFixture} from '../../scripts/tests/studyEnvironmentFixture.mjs';
import {reviewEnvironment} from '../../scripts/tests/studyEnvironmentReview.mjs';
const browser=await mobileBrowser({intercept:environmentFixture});
try{await reviewEnvironment(browser,'mobile');}finally{await browser.close();}
