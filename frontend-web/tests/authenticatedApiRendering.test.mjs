import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';

const fixtureToken = signature => [Buffer.from('{}').toString('base64url'), Buffer.from(JSON.stringify({ sub:'auth_fixture',userId:42,email:'fixture@invalid.test',role:'USER',type:'access',exp:Math.floor(Date.now()/1000)+3600 })).toString('base64url'),signature].join('.');
const initial = fixtureToken('old-test-signature'), renewed = fixtureToken('new-test-signature');
const profile = { id:42,username:'auth_fixture',presentationName:'Auth fixture',displayName:null,bio:null,statistics:{studyStreak:0,bestStudyStreak:0,verifiedMinutes:0,verifiedSessions:0,activeGoals:0} };
const hidden = { status:'HIDDEN',lastSeenAt:null,serverNow:'2026-11-07T12:00:00Z' };
const browserTest = { timeout:60000,skip:!chrome&&'Chrome unavailable' };

for (const refreshStatus of [200,401]) test(`Chrome: authenticated API single-flight refresh ${refreshStatus} and social requests`, browserTest,async()=>{
  let refreshes=0,oldHeaders=0,newHeaders=0,missingHeaders=0,socialReads=0;
  const page=await profileBrowser({intercept:async request=>{
    const path=new URL(request.url).pathname;
    if(path==='/refresh'){
      refreshes++;
      assert.ok(JSON.parse(request.postData).refreshToken==='synthetic-refresh-only','Refresh must use the stored test credential');
      await new Promise(resolve=>setTimeout(resolve,80));
      return refreshStatus===200?{body:{token:renewed,refreshToken:'synthetic-rotated-only'}}:{status:401,body:{message:'Invalid refresh token'}};
    }
    const auth=request.headers.Authorization??request.headers.authorization;
    if(auth===`Bearer ${initial}`)oldHeaders++;
    else if(auth===`Bearer ${renewed}`)newHeaders++;
    else missingHeaders++;
    if(path.includes('unread'))return {body:0};
    if(auth!==`Bearer ${renewed}`)return {status:401,body:{message:'Authentication is required'}};
    if(path==='/api/profile')return {body:profile};
    if(path==='/api/profile/privacy')return {body:{showPresence:false,showLastSeen:false,shareVerifiedMinutes:false,shareVerifiedSessions:false}};
    if(path==='/api/users/42/profile')return {body:{...profile,registrationDate:null,statistics:{},presence:hidden}};
    if(path==='/api/users/77/profile'){socialReads++;return {status:404,body:{message:'Profile unavailable'}};}
    return {status:404,body:{}};
  }});
  try {
    await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('auth-test-seeded')){sessionStorage.setItem('auth-test-seeded','yes');sessionStorage.setItem('accessToken',${JSON.stringify(initial)});sessionStorage.setItem('refreshToken','synthetic-refresh-only');}`});
    await page.navigate('/login');
    await page.evaluate('void import("/src/services/apiClient.ts").then(({default:client})=>Promise.allSettled(Array.from({length:3},(_,diagnostic)=>client.get("/api/profile",{params:{diagnostic}})))).then(results=>{window.__authRequestsDone=results.length})');
    if(refreshStatus===200){
      await page.wait('window.__authRequestsDone===3');
      await page.evaluate('history.pushState({},"","/profile");window.dispatchEvent(new PopStateEvent("popstate"))');
      await page.wait('document.querySelector("[data-profile-page] h2")?.textContent==="Auth fixture"');
      assert.equal(refreshes,1);assert.ok(oldHeaders>=3,'Concurrent initial requests must carry Authorization');assert.ok(newHeaders>0,'Requests must retry with renewed access');
      assert.ok(await page.evaluate(`sessionStorage.getItem('accessToken')===${JSON.stringify(renewed)} && sessionStorage.getItem('refreshToken')==='synthetic-rotated-only'`));
      await page.evaluate('history.pushState({},"","/users/77/profile");window.dispatchEvent(new PopStateEvent("popstate"))');
      await page.wait('!!document.querySelector("[data-social-profile] [role=alert]")');
      assert.equal(socialReads,1);assert.equal(refreshes,1,'Authorization/resource 404 must not trigger refresh');
    }else{
      await page.wait('!sessionStorage.getItem("accessToken") && !sessionStorage.getItem("refreshToken")');
      await page.wait('location.pathname==="/login"');
      assert.ok(await page.evaluate('!sessionStorage.getItem("accessToken") && !sessionStorage.getItem("refreshToken")'));
      assert.equal(refreshes,1);
    }
    assert.equal(missingHeaders,0);assert.deepEqual(page.errors,[]);
  } finally { await page.close(); }
});
