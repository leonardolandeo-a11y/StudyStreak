import {readFileSync} from 'node:fs';
const avatar=readFileSync(new URL('../../src/test/resources/profile/image.png',import.meta.url));
import {environmentFixture,token} from './studyEnvironmentFixture.mjs';
export {token};
export function collaborationFixture() {
 let host=true,version=4,seconds=1200,status='PAUSED',phase='FOCUS',reaction=null,raised=false,failSend=false,failFeed=false,screenAllowed=false;
 const requests=[];
 const messages=Array.from({length:65},(_,i)=>({id:`message-${String(i).padStart(3,'0')}`,authorId:i%5===0?101:3,authorName:i%5===0?'Scholar':'LunaStudy',text:`Study note ${i+1}: reviewing graph theory together.`,createdAt:new Date(Date.UTC(2026,10,13,15,0,i*20)).toISOString(),removed:false}));
 const room=()=>({id:'room-fixture',name:'Campus study circle',inviteCode:'ABCDEFGHIJ',ownerId:host?101:3,host,phase,timerStatus:status,remainingSeconds:seconds,endsAt:null,serverNow:new Date().toISOString(),version,members:[{userId:101,username:'Scholar',host,online:true,studying:true},{userId:3,username:'LunaStudy',host:!host,online:true,studying:false},{userId:4,username:'A very long academic companion name',host:false,online:false,studying:false}]});
 const intercept=async request=>{
  const url=new URL(request.url),path=url.pathname,body=request.postData?JSON.parse(request.postData):null;
  requests.push({path,method:request.method,body,authorized:Object.entries(request.headers??{}).some(([key,value])=>key.toLowerCase()==='authorization'&&value.startsWith('Bearer ')),page:Number(url.searchParams.get('page')||0)});
  if(path==='/api/study-rooms')return{body:[room()]};
  if(path==='/api/study-rooms/room-fixture'||path.endsWith('/heartbeat'))return{body:room()};
  if(path.endsWith('/timer')){version++;if(['RESET','FOCUS','BREAK'].includes(body.action)){if(body.action!=='RESET')phase=body.action;seconds=phase==='FOCUS'?1500:300;status='PAUSED';}else status=body.action==='START'?'RUNNING':'PAUSED';return{body:room()};}
  if(path.endsWith('/collaboration')){
   if(failFeed)return{status:503};
   const page=Number(url.searchParams.get('page')||0);return{body:{messages:[...messages].reverse().slice(page*25,page*25+25),totalPages:Math.ceil(messages.length/25),presence:[{userId:101,handRaised:raised,reaction}]}};
  }
  if(path.endsWith('/collaboration/messages')){
   if(failSend){failSend=false;return{status:503};}
   if(!messages.some(m=>m.id===body.id))messages.push({id:body.id,authorId:101,authorName:'Scholar',text:body.text,createdAt:new Date().toISOString(),removed:false});return{body:messages.at(-1)};
  }
  if(path.includes('/collaboration/messages/')){const m=messages.find(m=>path.endsWith('/'+m.id));if(!host)return{status:403};if(m){m.text='Message removed by host';m.removed=true;}return{status:204};}
  if(path.endsWith('/collaboration/reaction')){reaction=body.reaction;return{status:204};}
  if(path.endsWith('/collaboration/hand')){raised=body.raised;return{status:204};}
  if(path.endsWith('/media/permissions/3')){screenAllowed=body.allowed;return{status:204};}
  if(path.endsWith('/media'))return{body:{enabled:false,epoch:'fixture',canPublish:host,permissions:[{userId:3,canPublish:screenAllowed}]}};
  if(path.endsWith('/selection'))return{body:{goalId:null,sessions:[]}};
  if(path==='/api/tracking-links/active')return{body:{content:[{id:1,requesterId:101,receiverId:3,requesterUsername:'Scholar',receiverUsername:'LunaStudy',status:'ACCEPTED'}],totalPages:1,totalElements:1,last:true}};
  if(path==='/api/users/3/profile/avatar')return{body:avatar,type:'image/png'};
  if(path==='/api/users/4/profile/avatar')return{status:403};
  if(path==='/api/users/3/profile')return{body:{id:3,username:'LunaStudy',presentationName:'LunaStudy',bio:'Graph theory together',statistics:{},presence:{status:'HIDDEN',lastSeenAt:null},registrationDate:null}};
  if(path==='/api/users/3/presence')return{body:{status:'HIDDEN',lastSeenAt:null}};
  if(path==='/api/profile')return{body:{id:101,username:'Scholar',presentationName:'Scholar'}};
  return environmentFixture(request);
 };
 return{intercept,requests,room,messages,setHost:v=>host=v,failSend:()=>failSend=true,setFeedFailure:v=>failFeed=v,addMessage:()=>messages.push({id:`new-${messages.length}`,authorId:3,authorName:'LunaStudy',text:'New arrival while reading history',createdAt:new Date().toISOString(),removed:false})};
}
