import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { AxiosError } from 'axios';
process.env.EXPO_PUBLIC_API_URL='https://parity-fixture.invalid';
const {apiClient}=await import('../src/services/apiClient.ts');
const {tokenStorage}=await import('../src/services/tokenStorage.ts');
const {beginSessionChange}=await import('../src/services/authSession.ts');
const {studyRoomService}=await import('../src/services/studyRoomService.ts');
const {notificationService}=await import('../src/services/notificationService.ts');
const {googleBooksService,getBookSearchErrorMessage}=await import('../src/services/googleBooksService.ts');
const {createUnreadCounter}=await import('../src/features/notifications/unreadCounter.ts');
const ok=(config,data={})=>({config,data,status:200,statusText:'OK',headers:{}});
let adapter;apiClient.interceptors.request.use(config=>{config.adapter=adapter;return config;});
beforeEach(async()=>{await tokenStorage.clear();await tokenStorage.setTokens({token:'fixture-access',refreshToken:'fixture-refresh'});});
test('Rooms preserve JWT, server versions, heartbeat intent and membership contracts; no ledger writes',async()=>{
 const calls=[];adapter=async config=>{calls.push(config);assert.equal(config.headers.get('Authorization'),'Bearer fixture-access');return ok(config);};
 const signal=new AbortController().signal;
 await studyRoomService.list(signal);await studyRoomService.create('Fixture room');await studyRoomService.join('ABCDEFGHIJ');await studyRoomService.get('room',signal);
 await studyRoomService.heartbeat('room',null);await studyRoomService.heartbeat('room',true);await studyRoomService.timer('room','START',17);await studyRoomService.regenerateCode('room');await studyRoomService.transferHost('room',3);await studyRoomService.leave('room');
 assert.deepEqual(calls.filter(c=>c.url.endsWith('/heartbeat')).map(c=>JSON.parse(c.data)),[{studying:null},{studying:true}]);
 assert.deepEqual(JSON.parse(calls.find(c=>c.url.endsWith('/timer')).data),{action:'START',expectedVersion:17});
 assert.equal(calls.at(-1).method,'delete');assert.equal(calls.at(-1).url,'/api/study-rooms/room');assert.equal(calls[0].signal,signal);assert.equal(calls[3].signal,signal);
 assert.equal(calls.some(c=>/ledger|focus-sessions/.test(c.url)),false);
});
test('Room 403/404/version-conflict failures remain errors and queued actions cannot change account',async()=>{
 for(const status of [403,404,409]){adapter=async config=>{throw new AxiosError('Fixture failure','ERR_BAD_RESPONSE',config,undefined,{...ok(config),status});};await assert.rejects(studyRoomService.timer('room','PAUSE',17),e=>e.response.status===status);}
 let sent=0;adapter=async config=>{sent++;return ok(config);};const queued=[studyRoomService.create('Fixture'),notificationService.markRead(1,9),googleBooksService.search('Algebra')];beginSessionChange();for(const task of queued)await assert.rejects(task,/session changed/);assert.equal(sent,0);
});
test('Books search goes only through Spring Boot, validates query and normalizes optional metadata/official links',async()=>{
 let calls=0;const controller=new AbortController();adapter=async config=>{calls++;assert.equal(config.url,'/api/resources/books');assert.deepEqual(config.params,{q:'Algebra'});assert.equal(config.signal,controller.signal);assert.equal(config.headers.get('Authorization'),'Bearer fixture-access');return ok(config,[{id:'book',title:' Algebra ',thumbnailUrl:'http://books.google.com/cover',previewLink:'https://attacker.invalid',infoLink:'javascript:bad',authors:['Ada',null],pageCount:100},{id:'bad'}]);};
 const [book]=await googleBooksService.search(' Algebra ',controller.signal);assert.equal(book.title,'Algebra');assert.equal(book.previewLink,null);assert.equal(book.thumbnailUrl,'https://books.google.com/cover');assert.equal(book.infoLink,'https://books.google.com/books?id=book');assert.deepEqual(book.authors,['Ada']);
 await assert.rejects(googleBooksService.search('x'));await assert.rejects(googleBooksService.search('x'.repeat(81)));assert.equal(calls,1);
 controller.abort();await assert.rejects(googleBooksService.search('Algebra',controller.signal));assert.equal(calls,1);
 adapter=async config=>ok(config,[]);assert.deepEqual(await googleBooksService.search('Empty'),[]);
});
test('Books errors distinguish network, server configuration, limit and permission without leaking details',()=>{
 for(const [status,pattern]of [[401,/session/],[403,/permission/],[429,/limit/],[503,/configured/],[502,/unavailable/]]){
 const error=new AxiosError('PRIVATE_DETAIL','ERR_BAD_RESPONSE',{},undefined,{status});const message=getBookSearchErrorMessage(error);assert.match(message,pattern);assert.doesNotMatch(message,/PRIVATE_DETAIL/);
 }
 assert.match(getBookSearchErrorMessage(new AxiosError('private','ERR_NETWORK')),/connect/);assert.match(getBookSearchErrorMessage(new AxiosError('private','ETIMEDOUT')),/timed out/);
});
test('Notification filters/pagination/count and mutations use existing authenticated contracts',async()=>{
 const calls=[];adapter=async config=>{calls.push(config);assert.equal(config.headers.get('Authorization'),'Bearer fixture-access');return ok(config,{totalElements:4});};
 await notificationService.list(1,2);await notificationService.unread(1,1);await notificationService.byType(1,'DAILY_RECORD_CREATED',3);assert.equal(await notificationService.countUnread(1),4);await notificationService.markRead(1,9);await notificationService.remove(1,9);
 assert.deepEqual(calls.map(c=>[c.method,c.url]),[['get','/users/1/notifications'],['get','/users/1/notifications/unread'],['get','/users/1/notifications/type/DAILY_RECORD_CREATED'],['get','/users/1/notifications/unread'],['patch','/users/1/notifications/9/read'],['delete','/users/1/notifications/9']]);assert.deepEqual(calls[2].params,{page:3,size:10});assert.deepEqual(calls[3].params,{page:0,size:1});
});
test('Shared badge coalesces polls, supersedes stale counts after mutations, keeps last value on failure and stops on logout',async()=>{
 const requests=[],counts=[];const counter=createUnreadCounter(signal=>new Promise((resolve,reject)=>requests.push({signal,resolve,reject})),count=>counts.push(count));
 const first=counter.refresh();assert.equal(counter.refresh(),first);await new Promise(r=>setImmediate(r));assert.equal(requests.length,1);
 const fresh=counter.refresh(true);await new Promise(r=>setImmediate(r));assert.equal(requests[0].signal.aborted,true);requests[1].resolve(0);await fresh;requests[0].resolve(5);await first;assert.deepEqual(counts,[0]);
 const failed=counter.refresh();await new Promise(r=>setImmediate(r));requests[2].reject(new Error('offline'));await failed;assert.deepEqual(counts,[0]);
 const late=counter.refresh();await new Promise(r=>setImmediate(r));counter.dispose();requests[3].resolve(9);await late;assert.deepEqual(counts,[0]);await counter.refresh(true);assert.equal(requests.length,4);
});

// Themed primitives are rendered independently of networking and native SDKs.
test('compact notifications and cover fallback render across all eight themes with accessible actions',async()=>{
 const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
 const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
 const {NotificationCard}=await import('../src/components/notifications/NotificationCard.tsx');
 const {BookCover}=await import('../src/components/resources/BookCover.tsx');
 const {controls}=await import('./helpers/appearanceNativeMock.mjs');
 const store=createAppearanceStore({read:async()=>null,write:async()=>{}}),h=React.createElement;
 for(const mode of ['dark','light'])for(const accent of ['mint','blue','purple','orange']){
  await store.setPreferences({mode,accent});let opened=0;
  const snapshot=store.getSnapshot();
  const html=renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...snapshot,setPreferences:store.setPreferences,retryPersistence:store.retryPersistence}},h(React.Fragment,null,
   h(NotificationCard,{notification:{id:1,type:'DAILY_RECORD_CREATED',message:'Fixture record',read:false,createdAt:'2026-11-09T12:00:00Z',relatedGoalId:7,relatedDailyRecordId:11},busy:false,disabled:false,onOpen(){opened++;},onMarkRead(){},onDelete(){}}),h(BookCover,{title:'Fixture book',uri:null}))));
  assert.ok(html.includes(snapshot.theme.colors.text));assert.ok(html.includes(snapshot.theme.colors.primary));assert.match(html,/Cover unavailable for Fixture book/);assert.match(html,/Mark as read/);controls.get('Review new record').onPress();assert.equal(opened,1);assert.equal(controls.get('Review new record').disabled,false);
 }
});
