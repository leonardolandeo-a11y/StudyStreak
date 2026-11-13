import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture,token} from '../../scripts/tests/studyEnvironmentFixture.mjs';
import {reviewPersonalization} from '../../scripts/tests/personalizationReview.mjs';
let failure=false,requests=0;
const browser=await profileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;if(path==='/api/focus-sessions/stats'){requests++;if(failure)return{status:500};}return environmentFixture(request);
}});
try{await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});await reviewPersonalization(browser,'web',{setStatsFailure:v=>failure=v,statsRequests:()=>requests});}finally{await browser.close();}
