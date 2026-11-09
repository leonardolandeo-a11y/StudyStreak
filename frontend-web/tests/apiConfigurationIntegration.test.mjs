import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chrome, profileBrowser } from './helpers/profileBrowser.mjs';
const options={timeout:60000,skip:!chrome&&'Chrome unavailable'};

for(const [index,api] of ['', '/api', 'http://fixture:password@api.invalid?key=fixture'].entries())test(`Chrome: invalid API configuration ${index} rejects before transport and reports configuration, not network`,options,async()=>{
 const page=await profileBrowser({api,intercept:async()=>({status:404})});
 try{
  await page.navigate('/login');await page.wait('!!document.querySelector("#username")');
  const result=await page.evaluate(`(async()=>{
   const {default:client}=await import('/src/services/apiClient.ts');
   const {getApiErrorMessage}=await import('/src/utils/apiError.ts');const {getBookSearchErrorMessage}=await import('/src/services/googleBooksService.ts');
   let sent=0;client.defaults.adapter=async()=>{sent++;throw new Error('Must not send');};
   try{await client.get('/api/profile');return {sent,unexpected:true};}catch(error){return {sent,name:error.name,message:getApiErrorMessage(error,'fallback'),books:getBookSearchErrorMessage(error)};}
  })()`);
  assert.equal(result.sent,0);assert.equal(result.name,'ApiConfigurationError');assert.match(result.message,/VITE_API_BASE_URL/);assert.equal(result.books,result.message);assert.doesNotMatch(result.message,/password|key=fixture|connect|api\.invalid/);assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});

test('Chrome: normalized deployment prefix and REST paths survive validation; real network failures stay distinct',options,async()=>{
 const page=await profileBrowser({api:' https://api.fixture.invalid/study/// ',intercept:async()=>({status:404})});
 try{
  await page.navigate('/login');await page.wait('!!document.querySelector("#username")');
  const result=await page.evaluate(`(async()=>{
   const {default:client}=await import('/src/services/apiClient.ts');const {getApiErrorMessage}=await import('/src/utils/apiError.ts');
   let uri;client.defaults.adapter=async config=>{uri=client.getUri(config);return {config,status:200,statusText:'OK',headers:{},data:{fixture:true}};};
   await client.get('/users/1/goals');const first=uri;
   client.defaults.adapter=async config=>Promise.reject(Object.assign(new Error('Fixture network failure'),{config,isAxiosError:true,code:'ERR_NETWORK'}));
   try{await client.get('/api/resources/books');}catch(error){return {normalized:client.defaults.baseURL==='https://api.fixture.invalid/study',path:first==='https://api.fixture.invalid/study/users/1/goals',message:getApiErrorMessage(error,'fallback')};}
  })()`);
  assert.equal(result.normalized,true);assert.equal(result.path,true);assert.match(result.message,/connect/);assert.doesNotMatch(result.message,/VITE_API_BASE_URL/);assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});

const credentials=expired=>({token:`fixture.${Buffer.from(JSON.stringify({type:'access',userId:1,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+(expired?-3600:3600)})).toString('base64url')}.signature`,refreshToken:'fixture-only-refresh'});
for(const restoring of [true,false])test(`Chrome: invalid configuration cannot send raw auth requests or prevent ${restoring?'restoration fallback':'local logout'}`,options,async()=>{
 const page=await profileBrowser({api:'',intercept:async()=>({status:404})});
 try{
  await page.command('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await page.command('Page.addScriptToEvaluateOnNewDocument',{source:`
   window.__rawHttpAttempts=0;const Original=window.XMLHttpRequest;
   window.XMLHttpRequest=class extends Original{open(){window.__rawHttpAttempts++;throw new Error('Fixture blocks transport');}};
   sessionStorage.setItem('accessToken',${JSON.stringify(credentials(restoring).token)});sessionStorage.setItem('refreshToken','fixture-only-refresh');
  `});
  await page.navigate(restoring?'/login':'/profile');
  if(restoring){await page.wait('!!document.querySelector("#username")');assert.equal(await page.evaluate(`sessionStorage.getItem('refreshToken')==='fixture-only-refresh'`),true);}
  else{await page.wait(`Array.from(document.querySelectorAll('button')).some(el=>el.textContent.trim()==='Sign out')`);await page.click('Sign out');await page.wait('!!document.querySelector("#username")');assert.equal(await page.evaluate(`!sessionStorage.getItem('accessToken')&&!sessionStorage.getItem('refreshToken')`),true);}
  assert.equal(await page.evaluate('window.__rawHttpAttempts'),0);assert.deepEqual(page.errors,[]);
 }finally{await page.close();}
});
