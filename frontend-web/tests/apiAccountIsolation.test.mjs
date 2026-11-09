import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const token=id=>`fixture.${Buffer.from(JSON.stringify({type:'access',userId:id,sub:`fixture${id}`,email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.signature`;
for(const status of [401,200]) test(`Chrome: delayed ${status} from account A cannot retry or publish after account B signs in`,{timeout:60000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const page=await profileBrowser({intercept:async()=>({status:404,body:{}})});
 try{
  await page.navigate('/login');await page.wait('!!document.querySelector("#username")');
  await page.evaluate(`(async()=>{
   sessionStorage.setItem('accessToken',${JSON.stringify(token(1))});sessionStorage.setItem('refreshToken','fixture-refresh-A');
   const {default:client}=await import('/src/services/apiClient.ts');window.__sends=0;window.__refreshes=0;
   client.defaults.adapter=config=>{
    window.__sends++;
    if(window.__sends>1)return Promise.resolve({config,status:200,statusText:'OK',headers:{},data:{fixture:true}});
    return new Promise((resolve,reject)=>{window.__release=()=>{
     if(${status}===401)reject(Object.assign(new Error('Fixture expired response'),{config,response:{config,status:401,data:{}}}));
     else resolve({config,status:200,statusText:'OK',headers:{},data:{privateAccountA:true}});
    };});
   };
   client.post('/audit/isolated-action',{fixture:true}).then(()=>{window.__outcome='fulfilled'},()=>{window.__outcome='rejected'});
  })()`);
  await page.wait('typeof window.__release==="function"');
  await page.evaluate(`sessionStorage.removeItem('accessToken');sessionStorage.removeItem('refreshToken');sessionStorage.setItem('accessToken',${JSON.stringify(token(2))});sessionStorage.setItem('refreshToken','fixture-refresh-B');window.__release()`);
  await page.wait('!!window.__outcome');
  assert.equal(await page.evaluate('window.__outcome'),'rejected');
  assert.equal(await page.evaluate('window.__sends'),1,'An old mutation must not replay with new account credentials');
  assert.equal(await page.evaluate(`sessionStorage.getItem('refreshToken')==='fixture-refresh-B'`),true);
  assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});

test('Chrome: an old refresh cannot clear or block the next account refresh',{timeout:60000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const accessA=token(1),accessB=token(2),renewedB=accessB+'-renewed';
 const pending=new Map(),refreshes=[];
 const page=await profileBrowser({intercept:async request=>{
  if(new URL(request.url).pathname!=='/refresh')return {status:404,body:{}};
  const value=JSON.parse(request.postData).refreshToken;refreshes.push(value);
  return new Promise(resolve=>pending.set(value,resolve));
 }});
 try{
  await page.navigate('/login');await page.wait('!!document.querySelector("#username")');
  await page.evaluate(`(async()=>{
   sessionStorage.setItem('accessToken',${JSON.stringify(accessA)});sessionStorage.setItem('refreshToken','fixture-refresh-A');
   const {default:client}=await import('/src/services/apiClient.ts');window.__client=client;
   client.defaults.adapter=config=>{
    if(config.headers.get('Authorization')===${JSON.stringify('Bearer '+renewedB)})return Promise.resolve({config,status:200,statusText:'OK',headers:{},data:{fixture:true}});
    return Promise.reject(Object.assign(new Error('Fixture expired response'),{config,response:{config,status:401,data:{}}}));
   };
   client.get('/audit/refresh-scope').then(()=>{window.__A='fulfilled'},()=>{window.__A='rejected'});
  })()`);
  for(let i=0;i<150&&!pending.has('fixture-refresh-A');i++)await new Promise(resolve=>setTimeout(resolve,30));
  assert.ok(pending.has('fixture-refresh-A'));
  await page.evaluate(`sessionStorage.setItem('accessToken',${JSON.stringify(accessB)});sessionStorage.setItem('refreshToken','fixture-refresh-B');void window.__client.get('/audit/refresh-scope').then(()=>{window.__B='fulfilled'},error=>{window.__B='rejected';window.__BReason=error.message})`);
  for(let i=0;i<150&&!pending.has('fixture-refresh-B');i++)await new Promise(resolve=>setTimeout(resolve,30));
  assert.ok(pending.has('fixture-refresh-B'),'The next account must start its own refresh');
  pending.get('fixture-refresh-A')({status:401,body:{message:'Fixture revoked'}});await page.wait('window.__A==="rejected"');
  assert.equal(await page.evaluate(`sessionStorage.getItem('refreshToken')==='fixture-refresh-B'`),true);
  pending.get('fixture-refresh-B')({body:{token:renewedB,refreshToken:'fixture-refresh-B-renewed'}});
  await page.wait('!!window.__B');assert.equal(await page.evaluate('window.__B'),'fulfilled',await page.evaluate('window.__BReason'));assert.equal(refreshes.length,2);assert.deepEqual(page.errors,[]);
 }finally{for(const finish of pending.values())finish({status:401});await page.close();}
});
