import assert from 'node:assert/strict';
import {test} from 'node:test';
export function collaborationCases({createCollaboration,mergeMessages,groupedMessage,nearChatEnd,roomProgress}){
 const row=(id,author=3,second=0)=>({id,authorId:author,authorName:'Scholar',text:id,createdAt:new Date(1763046000000+second*1000).toISOString(),removed:false});
 const settle=()=>new Promise(r=>setImmediate(r));
 function setup(overrides={}){
  const calls=[], sent=[], actions=[];let serial=0;
  const store=createCollaboration({
   async feed(page,signal){calls.push({page,signal});return{messages:page?[row('old',3,-30),row('new')]:[row('new')],presence:[],totalPages:3};},
   async send(message){sent.push(message);return row(message.id,101,60);},
   async action(path,body,method){actions.push({path,body,method});},...overrides
  },()=>`stable-${++serial}`);
  return{store,calls,sent,actions};
 }
 test('history merges overlapping offsets chronologically and never revives a removed message',()=>{
  const removed={...row('same'),removed:true,text:'Message removed by host'};
  assert.deepEqual(mergeMessages([row('same'),row('new',3,20)],[row('old',3,-10),removed]).map(x=>x.id),['old','same','new']);
  assert.equal(mergeMessages([removed],[row('same')])[0].removed,true);
  assert.equal(groupedMessage(row('a'),row('b',3,299)),true);assert.equal(groupedMessage(row('a'),row('b',4,1)),false);assert.equal(groupedMessage(row('a'),row('b',3,301)),false);assert.equal(groupedMessage(removed,row('b',3,1)),false);
  assert.equal(nearChatEnd(100,200,350),true);assert.equal(nearChatEnd(0,200,800),false);
  assert.equal(roomProgress(750,'FOCUS'),.5);assert.equal(roomProgress(150,'BREAK'),.5);assert.equal(roomProgress(-3,'FOCUS'),0);assert.equal(roomProgress(9999,'BREAK'),1);
 });
 test('latest polling keeps fetched history; one page per explicit request, no duplicate load or start',async()=>{
  const {store,calls}=setup();
  try{store.start();store.start();await settle();assert.deepEqual(calls.map(x=>x.page),[0]);
   await Promise.all([store.loadEarlier(),store.loadEarlier()]);assert.deepEqual(calls.map(x=>x.page),[0,1]);
   await store.retry();assert.deepEqual(store.getSnapshot().messages.map(x=>x.id),['old','new']);assert.equal(store.getSnapshot().hasEarlier,true);
   await store.loadEarlier();assert.equal(store.getSnapshot().hasEarlier,false);await store.loadEarlier();assert.deepEqual(calls.map(x=>x.page),[0,1,0,2]);
  }finally{store.stop();}assert.equal(calls[0].signal.aborted,true);
 });
 test('single-flight send trims text, rejects empty, retains UUID on failure and clears only confirmed text',async()=>{
  let reject=true, release;const sent=[];
  const {store}=setup({async send(message){sent.push(message);if(reject)throw Error('offline');return new Promise(r=>release=()=>r({...row(message.id,101,60),text:message.text}));}});
  try{store.start();await settle();store.setText('  ');await store.send();assert.equal(sent.length,0);
   store.setText('  Ready for study  ');await store.send();assert.equal(store.getSnapshot().text,'  Ready for study  ');assert.match(store.getSnapshot().actionError,/not confirmed/);
   await store.retry();assert.match(store.getSnapshot().actionError,/not confirmed/);reject=false;
   const result=store.send();await store.send();assert.equal(sent.length,2);assert.equal(sent[0].id,sent[1].id);assert.equal(sent[1].text,'Ready for study');release();await result;
   assert.equal(store.getSnapshot().text,'');assert.equal(store.getSnapshot().busy,false);assert.equal(store.getSnapshot().messages.filter(x=>x.id===sent[1].id).length,1);
  }finally{store.stop();}
 });
 test('network/history errors retain messages and page; forbidden access clears cached content',async()=>{
  let historyFails=true,denied=false;const pages=[];
  const {store}=setup({async feed(page){pages.push(page);if(denied)throw{response:{status:403}};if(page&&historyFails)throw Error('network');return{messages:[row('new')],presence:[],totalPages:2};}});
  try{store.start();await settle();await store.loadEarlier();assert.equal(store.getSnapshot().messages.length,1);assert.match(store.getSnapshot().historyError,/Earlier/);
   historyFails=false;await store.loadEarlier();assert.deepEqual(pages,[0,1,1]);assert.equal(store.getSnapshot().historyError,null);
   denied=true;await store.retry();assert.equal(store.getSnapshot().messages.length,0);assert.equal(store.getSnapshot().presence.length,0);assert.equal(store.getSnapshot().hasEarlier,false);
  }finally{store.stop();}
 });
 test('stopping cancels in-flight reads; late results never update a different room or account',async()=>{
  let finish,signal,notifications=0;
  const {store}=setup({async feed(page,s){signal=s;return new Promise(r=>finish=r);}}), other=setup();
  const unsubscribe=store.subscribe(()=>notifications++);
  store.start();store.stop();const count=notifications;assert.equal(signal.aborted,true);
  finish({messages:[row('private')],presence:[],totalPages:1});await settle();assert.equal(notifications,count);assert.equal(store.getSnapshot().messages.length,0);
  try{other.store.start();await settle();assert.equal(other.store.getSnapshot().messages.some(x=>x.id==='private'),false);}finally{other.store.stop();unsubscribe();}
 });
 test('a late write after blur cannot acknowledge or clear a different account draft',async()=>{
  let finish,signal;const sent=[];
  const {store}=setup({async send(message,s){signal=s;sent.push(message);return new Promise(r=>finish=()=>r({...row(message.id,101,60),text:message.text}));}}), other=setup();
  try{store.start();await settle();store.setText('Original draft');const writing=store.send();store.stop();assert.equal(signal.aborted,true);
   other.store.start();await settle();other.store.setText('Other account draft');finish();await writing;
   assert.equal(store.getSnapshot().text,'Original draft');assert.equal(other.store.getSnapshot().text,'Other account draft');assert.equal(other.store.getSnapshot().messages.some(x=>x.id===sent[0].id),false);
  }finally{store.stop();other.store.stop();}
 });
 test('moderation changes only after confirmation by the API; reactions use only the existing POST contract',async()=>{
  let fail=true;const calls=[];const {store}=setup({async action(path,body,method){calls.push({path,body,method});if(fail)throw Error('forbidden');}});
  try{store.start();await settle();await store.action('/messages/new',undefined,'delete');assert.equal(store.getSnapshot().messages[0].removed,false);assert.match(store.getSnapshot().actionError,/Action failed/);
   fail=false;await store.action('/messages/new',undefined,'delete');assert.equal(store.getSnapshot().messages[0].removed,true);
   await store.action('/reaction',{reaction:'👏'});assert.deepEqual(calls.at(-1),{path:'/reaction',body:{reaction:'👏'},method:'post'});
   await store.action('/hand',{raised:false},'put');assert.deepEqual(calls.at(-1),{path:'/hand',body:{raised:false},method:'put'});
  }finally{store.stop();}
 });
}
