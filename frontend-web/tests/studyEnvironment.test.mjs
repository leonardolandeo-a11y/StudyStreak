import {test} from 'node:test';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {environmentFixture} from '../../scripts/tests/studyEnvironmentFixture.mjs';
import {reviewPanorama} from './helpers/panoramicReview.mjs';
test('Chrome: pixel Dashboard composition and illustration-free Focus preserve data and controls', {timeout:120000}, async()=>{
 const requests=[];
 const browser=await profileBrowser({intercept:async request=>{
  const path=new URL(request.url).pathname;requests.push(path);
  const result=environmentFixture(request);
  if(path==='/users/101/goals')result.body={...result.body,content:[{id:7,topic:'Linear algebra',completed:false,frequency:3,duration:25},{id:8,topic:'Graph theory',completed:false,frequency:2,duration:30},{id:9,topic:'Practice calculus',completed:false,frequency:4,duration:20}],totalElements:3};
  if(path==='/api/study/history')result.body={...result.body,content:[{id:'visual-session',goal_name:'Linear algebra',source:'INDIVIDUAL',state:'COMPLETE',confirmed_seconds:1500,planned_seconds:1500,started_at:'2026-11-11T16:00:00Z',verified:true}],totalElements:1};
  return result;
 }});
 try{await reviewPanorama(browser,requests);}finally{await browser.close();}
});
