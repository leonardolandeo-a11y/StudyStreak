import {mobileBrowser} from './helpers/mobileBrowser.mjs';
import {environmentFixture} from '../../scripts/tests/studyEnvironmentFixture.mjs';
import {reviewPersonalization} from '../../scripts/tests/personalizationReview.mjs';
let failure=false,requests=0;
const browser=await mobileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;if(path==='/api/focus-sessions/stats'){requests++;if(failure)return{status:500};}return environmentFixture(request);
}});
try{await reviewPersonalization(browser,'mobile',{setStatsFailure:v=>failure=v,statsRequests:()=>requests});}finally{await browser.close();}
