import { reviewNativeModule } from './helpers/academicModuleReview.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {mobileBrowser} from './helpers/mobileBrowser.mjs';
const page=content=>({content,empty:!content.length,totalElements:content.length,totalPages:content.length?1:0,last:true,number:0,size:10});
const claims={type:'access',userId:101,sub:'fixture',email:'fixture@example.invalid',role:'USER',exp:Math.floor(Date.now()/1000)+3600};
const tokens={token:`fixture.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`,refreshToken:'fixture-only'};
let room=null,failChat=false,failMessage=true,allow=false,hand=false,reaction=null,messages=[],selection=null,failNotification=false,failModeration=true;
let pendingBook,bookFailures=1;const writes=[],reads=[];
let notifications=[{id:1,type:'GOAL_COMPLETED',message:'Fixture goal completed',read:false,createdAt:'2026-11-09T12:00:00Z',relatedGoalId:7},{id:2,type:'DAILY_RECORD_CREATED',message:'Fixture review',read:false,createdAt:'2026-11-09T12:00:00Z',relatedGoalId:8,relatedDailyRecordId:11}];
const book={id:'fixture-book',title:'Algebra fixture',authors:['Ada Fixture'],publisher:'Fixture Press',publishedDate:'2026',pageCount:100,categories:['Math'],description:'Fixture description',thumbnailUrl:'https://books.google.com/missing-cover',infoLink:'https://books.google.com/books?id=fixture-book',previewLink:'https://books.google.com/books?id=fixture-book&preview=1'};
function newRoom(host=true){return {id:'fixture-room',name:host?'Fixture room':'Joined room',host,ownerId:host?101:3,phase:'FOCUS',timerStatus:'PAUSED',remainingSeconds:1500,endsAt:null,serverNow:new Date().toISOString(),version:1,inviteCode:'ABCDEFGHIJ',members:[{userId:101,username:'fixture',online:true,studying:false,host},{userId:3,username:'partner',online:true,studying:true,host:!host}]};}
function update(fields={}){room={...room,...fields,version:room.version+1,serverNow:new Date().toISOString()};return {body:room};}
const browser=await mobileBrowser({intercept:async request=>{
 const url=new URL(request.url),p=url.pathname,m=request.method;
 if(p==='/login')return {body:tokens};if(p==='/logout')return {status:204};
 if(m!=='GET'){
  const body=request.postData?JSON.parse(request.postData):null;writes.push({p,m,body});
  if(p==='/api/study-rooms'){room=newRoom();return {body:room};}
  if(p==='/api/study-rooms/join'){if(body.code==='XXXXXXXXXX')return {status:404};room=newRoom(false);return {body:room};}
  if(p.endsWith('/heartbeat')){if(body.studying!==null)room.members[0].studying=body.studying;return update();}
  if(p.endsWith('/timer')){
   assert.equal(body.expectedVersion,room.version);const a=body.action;
   return update({timerStatus:a==='START'?'RUNNING':'PAUSED',endsAt:a==='START'?new Date(Date.now()+1500000).toISOString():null,phase:a==='BREAK'?'BREAK':a==='FOCUS'?'FOCUS':room.phase});
  }
  if(p.endsWith('/collaboration/messages')){if(failMessage){failMessage=false;return {status:503};}messages=[{id:body.id,authorId:101,authorName:'fixture',text:body.text,createdAt:new Date().toISOString(),removed:false}];return {body:messages[0]};}
  if(p.includes('/collaboration/messages/')){messages=messages.map(row=>({...row,removed:true,text:'Removed message'}));return {status:204};}
  if(p.endsWith('/collaboration/hand')){hand=body.raised;return {body:{}};}
  if(p.endsWith('/collaboration/reaction')){reaction=body.reaction;return {body:{}};}
  if(p.includes('/media/permissions/')){if(failModeration){failModeration=false;return {status:403};}allow=body.allowed;return {body:{}};}
  if(p.includes('/media/members/')){room.members=room.members.filter(row=>row.userId!==3);return {status:204};}
  if(p==='/api/study-rooms/fixture-room'&&m==='DELETE'){room=null;return {status:204};}
  if(p.endsWith('/selection')){selection=body.goalId;return {body:{}};}
  if(p.includes('/notifications/')){const id=Number(p.split('/')[4]);if(m==='PATCH'){notifications=notifications.map(n=>n.id===id?{...n,read:true}:n);return {body:notifications.find(n=>n.id===id)};}notifications=notifications.filter(n=>n.id!==id);return {status:204};}
  return {status:404};
 }
 reads.push(p);
 if(p==='/api/profile')return {body:{id:101,username:'fixture',presentationName:'Fixture Student'}};
 if(p==='/users/101/goals')return {body:page([{id:7,topic:'Fixture biology',completed:false,duration:25,frequency:3}])};
 if(p==='/users/101/goals/7')return {body:{id:7,topic:'Fixture biology',completed:true,duration:25,frequency:3}};
 if(p==='/api/goals/8/daily-records/11')return {body:{id:11,date:'2026-11-09',note:'Fixture evidence review',photoAvailable:false,voiceAvailable:false}};
 if(p==='/api/study-rooms')return {body:room?[room]:[]};
 if(p==='/api/study-rooms/fixture-room')return room?{body:room}:{status:404};
 if(p.endsWith('/collaboration'))return failChat?{status:503}:{body:{messages,totalPages:messages.length?1:0,presence:[{userId:101,handRaised:hand,reaction}]}};
 if(p.endsWith('/media'))return {body:{enabled:false,epoch:'fixture-epoch',permissions:[{userId:3,canPublish:allow}]}};
 if(p.endsWith('/selection'))return {body:{goalId:selection,sessions:[]}};
 if(p==='/api/goals/7/focus-sessions/summary')return {body:{goalId:7,totalMinutes:25,completedSessions:1}};
 if(p.includes('/notifications')){
  if(failNotification&&!p.includes('unread'))return {status:503};
  const data=p.endsWith('/unread')?notifications.filter(n=>!n.read):p.includes('/type/')?notifications.filter(n=>n.type===p.split('/').at(-1)):notifications;return {body:page(data)};
 }
 if(p==='/api/resources/books'){
  const q=url.searchParams.get('q');if(q==='Slow')return new Promise(resolve=>{pendingBook=()=>resolve({body:[{...book,title:'Late obsolete book'}]});});
  if(q==='Empty')return {body:[]};if(q==='Error'&&bookFailures-->0)return {status:502};return {body:[book]};
 }
 return {status:404};
}});
const has=label=>`!!document.querySelector('[aria-label="${label}"]')`;
const text=value=>`document.body.innerText.includes(${JSON.stringify(value)})`;
const gone=()=>browser.wait(`!document.querySelector('[aria-modal="true"]')`);
async function drawer(label){await browser.click('Open menu');await browser.click(label);await browser.waitForDrawerClosed();}
async function filter(label){await browser.wait(has(label));await browser.evaluate(`document.querySelector('[aria-label="${label}"]').scrollIntoView({inline:'center',block:'nearest'})`);await browser.click(label);}
async function search(q){await browser.fill('[aria-label="Book search topic"]',q);await browser.click('Search books');}
async function snap(name){await reviewNativeModule(browser,name);await browser.evaluate('document.activeElement?.blur()');const image=await browser.command('Page.captureScreenshot',{format:'png'});writeFileSync(`.expo/parity65b-${name}.png`,Buffer.from(image.data,'base64'));}
try{
 await browser.command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await browser.navigate('/');await browser.wait(has('Username'));await browser.fill('[aria-label="Username"]','fixture');await browser.fill('[aria-label="Password"]','fixture-password');await browser.click('Sign in');await browser.wait(has('Study Rooms'));
 await browser.click('Study Rooms');await browser.wait(has('Create a study room'));await browser.click('Create a study room');await browser.wait(has('Room name'));await browser.fill('[aria-label="Room name"]','Fixture room');await browser.click('Create room');await gone();await browser.wait(text('Timer paused'));await browser.wait(has('Start timer'));
 await browser.click('Start timer');await browser.wait(has('Pause timer'));await browser.click('Pause timer');await browser.wait(has('Start timer'));
 assert.ok(await browser.evaluate(text('Expo Go is not supported')));assert.equal(await browser.evaluate(has('Connect to screens')),false);assert.equal(writes.some(w=>w.p.includes('/media/token')),false);
 await browser.click('Mark me as studying');await browser.wait(text('✓ I am studying'));await browser.wait(has('Room message'));await browser.fill('[aria-label="Room message"]','Fixture chat message');await browser.click('Send message');await browser.wait(text('Message not confirmed'));await browser.click('Send message');await browser.wait(text('Fixture chat message'));
 const sent=writes.filter(w=>w.p.endsWith('/collaboration/messages'));assert.equal(sent.length,2);assert.equal(sent[0].body.id,sent[1].body.id);
 await browser.click('Raise hand');await browser.wait(has('Lower hand'));await browser.click('☺ Reactions');await browser.click('React 👏');await browser.wait(text('fixture ✋ 👏'));
 await browser.click('Delete message by fixture');await browser.wait(has('Confirm delete message'));await browser.click('Confirm delete message');await browser.wait(text('Removed message'));
 await browser.click('Participants (2)');await browser.click('Allow screen sharing');await browser.wait(text('Moderation failed'));await browser.click('Allow screen sharing');await browser.wait(has('Revoke screen permission'));
 await browser.click('Remove partner from room');await browser.wait(has('Confirm remove participant'));await browser.click('Keep participant');await gone();assert.equal(room.members.length,2);await browser.click('Chat');
 await browser.click('No Goal selected · Choose');await browser.wait(text('Fixture biology'));await browser.click('Fixture biology');await browser.wait(text('Server-confirmed snapshot'));assert.equal(selection,7);await snap('room');failChat=true;await browser.click('All rooms');await browser.wait(has('Open study room Fixture room'));await browser.click('Open study room Fixture room');await browser.wait(has('Retry chat'));failChat=false;await browser.click('Retry chat');await browser.wait(text('Removed message'));await browser.wait(text('Timer paused'));await browser.click('Close room for everyone');await browser.wait(has('Close room'));assert.ok(room);await browser.click('Keep room unchanged');await gone();assert.ok(room);
 await browser.click('Close room for everyone');await browser.wait(has('Close room'));await browser.click('Close room');await gone();await browser.wait(has('Invite code'));assert.equal(room,null);
 await browser.fill('[aria-label="Invite code"]','XXXXXXXXXX');await browser.click('Join room');await browser.wait(text('requested resource was not found'));await browser.fill('[aria-label="Invite code"]','ABCDEFGHIJ');await browser.click('Join room');await browser.wait(text('Only the host can control'));assert.equal(await browser.evaluate(has('Start timer')),false);await browser.wait(text('Timer paused'));
 await browser.click('Leave room');await browser.wait(has('Leave'));await browser.click('Leave');await gone();await browser.wait(has('Invite code'));assert.equal(room,null);
 await drawer('Resources');await browser.wait(has('Book search topic'));await search('Algebra');await browser.wait(has('View details for Algebra fixture'));await browser.wait(has('Cover unavailable for Algebra fixture'));await snap('resources');await browser.click('View details for Algebra fixture');await browser.wait(has('Close book details'));assert.ok(await browser.evaluate(text('Fixture Press')));assert.ok(await browser.evaluate(has('Preview on Google Books')));
 // Mock device Linking via window.open: verify the external target without navigating to Google.
 await browser.evaluate(`window.__bookLinks=[];window.open=(url)=>{window.__bookLinks.push(url);return {};}`);await browser.click('Open on Google Books');assert.ok((await browser.evaluate('window.__bookLinks')).some(url=>url.startsWith('https://books.google.com/')));await browser.click('Close book details');await gone();
 await search('Empty');await browser.wait(text('No books were found'));await search('Error');await browser.wait(has('Retry search'));await browser.click('Retry search');await browser.wait(has('View details for Algebra fixture'));
 await search('Slow');await browser.wait(has('Cancel search'));while(!pendingBook)await new Promise(r=>setTimeout(r,10));await browser.click('Cancel search');pendingBook();await browser.wait(text('Enter a topic'));assert.equal(await browser.evaluate(text('Late obsolete book')),false);
 await drawer('Notifications');await browser.wait(has('Unread'));await browser.wait(has('Mark as read'));
 await browser.evaluate(`Array.from(document.querySelectorAll('[aria-label="Mark as read"]')).find(e=>!e.closest('[aria-hidden="true"]')).click()`);await browser.wait(text('Notification marked as read'));await browser.wait(`!!document.querySelector('[data-testid="unread-badge"]')&&document.querySelector('[data-testid="unread-badge"]').innerText==='1'`);
 await filter('Unread');await browser.wait(text('1 notifications'));await browser.click('Mark as read');await browser.wait(text('No notifications in this category'));await browser.wait(`!document.querySelector('[data-testid="unread-badge"]')`);
 await filter('All');await browser.wait(text('2 notifications'));await filter('Goal completed');await browser.wait(text('1 notifications'));await browser.click('View goal');await browser.wait(`location.pathname.includes('/goals/7')`);await browser.evaluate('history.back()');await new Promise(r=>setTimeout(r,300));await browser.wait(has('All'));await filter('New daily record');await browser.wait(has('Review new record'));await browser.click('Review new record');await browser.wait(`location.search.includes('review=1')`);await browser.wait(text('Review this record'));await browser.evaluate('history.back()');await new Promise(r=>setTimeout(r,300));await browser.wait(has('All'));await filter('All');await browser.wait(text('2 notifications'));
 await browser.evaluate(`Array.from(document.querySelectorAll('[aria-label="Delete notification"]')).find(e=>!e.closest('[aria-hidden="true"]')).click()`);await browser.wait(has('Confirm delete'));await browser.click('Confirm delete');await browser.wait(text('1 notifications'));await snap('notifications');
 failNotification=true;await browser.click('Refresh');await browser.wait(has('Retry'));failNotification=false;await browser.click('Retry');await browser.wait(text('1 notifications'));
 for(const width of [320,390,768,1440]){await browser.command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await browser.wait('document.documentElement.scrollWidth<=innerWidth');}
 await drawer('Settings');await browser.wait(has('Light'));await browser.click('Light');await browser.click('Purple');await browser.evaluate('history.back()');await new Promise(r=>setTimeout(r,300));await drawer('Resources');await search('Algebra');await browser.wait(has('View details for Algebra fixture'));await snap('resources-light');
 assert.equal(writes.some(w=>/ledger|focus-sessions/.test(w.p)),false);assert.deepEqual(browser.errors,[]);process.stdout.write('Rooms/Resources/Notifications browser passed: host/member timer and membership, idempotent chat, reactions, moderation, media fallback, Books cancellation/retry/details/links, filters/badges/CRUD/contextual routes, themes and responsive.\n');
}catch(error){writeFileSync('.expo/parity65b-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),writes,errors:browser.errors}));throw error;}finally{pendingBook?.();await browser.close();}
