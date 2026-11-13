import { mobileBrowser } from './helpers/mobileBrowser.mjs';
import { environmentFixture } from '../../scripts/tests/studyEnvironmentFixture.mjs';
import { reviewDashboardWidgets } from '../../scripts/tests/dashboardWidgetsReview.mjs';
let owner=101,stats=0;
const tokenFor=id=>'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:id,sub:'Fixture Student',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature';
const browser=await mobileBrowser({intercept:request=>{
 const path=new URL(request.url).pathname;if(path==='/api/focus-sessions/stats')stats++;
 if(path==='/login')return {body:{token:tokenFor(owner),refreshToken:'fixture-only'}};
 if(path==='/api/tracking-links/active')return {body:{content:owner===101?[
 {id:1,requesterId:101,receiverId:3,requesterUsername:'Fixture Student',receiverUsername:'Authorized partner',status:'ACCEPTED'},
 {id:2,requesterId:101,receiverId:4,requesterUsername:'Fixture Student',receiverUsername:'Pending private member',status:'PENDING'},
 {id:3,requesterId:8,receiverId:9,requesterUsername:'Foreign private member',receiverUsername:'Foreign private member',status:'ACCEPTED'}]:[],totalPages:1,totalElements:1,last:true}};
 if(path==='/api/users/3/profile/avatar')return {status:403};
 if(path==='/api/profile')return {body:{id:owner,username:'Fixture Student',presentationName:'Fixture Student'}};
 if(path===`/users/${owner}/goals`&&owner!==101)return {body:{content:[],totalPages:0,totalElements:0,last:true}};
 return environmentFixture(request);
}});
try{await reviewDashboardWidgets(browser,'mobile',{account:id=>owner=id,statsRequests:()=>stats,tokenFor});}finally{await browser.close();}
