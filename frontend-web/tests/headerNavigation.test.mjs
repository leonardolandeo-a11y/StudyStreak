import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});after(()=>server.close());
const {headerNavigation}=await server.ssrLoadModule('/src/components/navigation/headerNavigation.ts');
test('root routes keep titles without redundant navigation shortcuts',()=>{
 for(const path of ['/dashboard','/focus-studio','/goals','/tracking-links','/validations','/study-rooms','/resources','/notifications','/settings','/profile']){const header=headerNavigation(path);assert.equal(header.detail,false);assert.equal(header.crumbs.length,1);assert.ok(header.crumbs[0].label);assert.equal(header.crumbs[0].to,undefined);}
});
test('detail deep links have real parents and never generate broken users/ID links',()=>{
 assert.equal(headerNavigation('/goals/7').fallback,'/goals');assert.equal(headerNavigation('/goals/7/tags').fallback,'/goals/7');assert.equal(headerNavigation('/goals/7/daily-records/12').fallback,'/goals/7/daily-records');
 const member=headerNavigation('/users/77/profile');assert.equal(member.detail,true);assert.equal(member.fallback,'/tracking-links');assert.deepEqual(member.crumbs,[{label:'Member Profile'}]);
 assert.equal(headerNavigation('/goals/').crumbs[0].label,'Goals');
});
