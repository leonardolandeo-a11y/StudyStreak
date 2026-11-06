import test from 'node:test';
import assert from 'node:assert/strict';
import {toggleScreenCapture} from '../src/components/study/mediaCapture.ts';
function fake(sharing=false){
 const calls=[];
 const room={localParticipant:{isScreenShareEnabled:sharing,async setScreenShareEnabled(enabled,options){calls.push(['capture',enabled,options]);}},async disconnect(stop){calls.push(['disconnect',stop]);}};
 return {room,calls};
}
test('sharing is explicit video only; stop requests disable capture',async()=>{
 const first=fake();await toggleScreenCapture(first.room,()=>true);assert.deepEqual(first.calls,[['capture',true,{audio:false}]]);
 const second=fake(true);await toggleScreenCapture(second.room,()=>true);assert.deepEqual(second.calls,[['capture',false,{audio:false}]]);
});
test('a capture prompt resolved after leaving the room releases all tracks',async()=>{
 const {room,calls}=fake();let finish;room.localParticipant.setScreenShareEnabled=()=>new Promise(resolve=>{finish=resolve;});
 let current=true;const pending=toggleScreenCapture(room,()=>current);current=false;finish();await pending;
 assert.deepEqual(calls,[['disconnect',true]]);
});
test('permission cancellation surfaces to UI without reconnecting or retrying capture',async()=>{
 const {room,calls}=fake();room.localParticipant.setScreenShareEnabled=async()=>{throw new DOMException('Cancelled','NotAllowedError');};
 await assert.rejects(toggleScreenCapture(room,()=>true),{name:'NotAllowedError'});assert.deepEqual(calls,[]);
});
test('capture failure after unmount still cleans the old connection',async()=>{
 const {room,calls}=fake();room.localParticipant.setScreenShareEnabled=async()=>{throw new Error('Connection closed');};
 await assert.rejects(toggleScreenCapture(room,()=>false));assert.deepEqual(calls,[['disconnect',true]]);
});
