import assert from 'node:assert/strict';
import {test} from 'node:test';
export function roomPolishCases({createCollaboration}){
 const row=id=>({id,authorId:3,authorName:'Scholar',createdAt:'2026-11-13T12:00:00Z',text:id,removed:false});
 const feed=(id,pages=4)=>({messages:[row(id)],presence:[],totalPages:pages});
 const settle=()=>new Promise(resolve=>setImmediate(resolve));
 for(const status of [403,404])test(`${status}: restored membership restarts history at page one`,async()=>{
  const calls=[];let denied=false;
  const store=createCollaboration({async feed(page){calls.push(page);if(denied)throw{response:{status}};return feed('page-'+page);},async send(){},async action(){}},()=> 'uuid');
  try{store.start();await settle();await store.loadEarlier();denied=true;await store.retry();assert.equal(store.getSnapshot().messages.length,0);
   denied=false;await store.retry();await store.loadEarlier();assert.deepEqual(calls,[0,1,0,0,1]);
  }finally{store.stop();}
 });
 test('a feed denial invalidates a parallel successful read issued before revocation',async()=>{
  let late,historyDenied=false,delay=false;
  const store=createCollaboration({async feed(page){if(page&&historyDenied)throw{response:{status:403}};if(!page&&delay)return new Promise(resolve=>late=resolve);return feed('private-'+page);},async send(){},async action(){}},()=> 'uuid');
  try{store.start();await settle();delay=true;const refresh=store.retry();historyDenied=true;await store.loadEarlier();assert.equal(store.getSnapshot().messages.length,0);
   late(feed('stale-private'));await refresh;assert.equal(store.getSnapshot().messages.length,0,'A stale response must not restore content after denial');
  }finally{store.stop();}
 });
 test('a late send acknowledgment cannot restore content after the feed revoked membership',async()=>{
  let late,denied=false;
  const store=createCollaboration({async feed(){if(denied)throw{response:{status:404}};return feed('initial');},async send(message){return new Promise(resolve=>late=()=>resolve(row(message.id)));},async action(){}},()=> 'pending-uuid');
  try{store.start();await settle();store.setText('Draft');const send=store.send();denied=true;await store.retry();late();await send;
   assert.equal(store.getSnapshot().messages.length,0);assert.equal(store.getSnapshot().text,'Draft');assert.equal(store.getSnapshot().busy,false);
  }finally{store.stop();}
 });
}
