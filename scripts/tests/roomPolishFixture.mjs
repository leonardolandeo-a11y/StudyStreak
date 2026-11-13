import {collaborationFixture,token} from './roomCollaborationFixture.mjs';
export {token};
export function roomPolishFixture(){
 const fixture=collaborationFixture();const original=fixture.intercept;let actor=101,connectionFailed=false,chatAccessDenied=false;
 fixture.setChatAccessDenied=value=>{chatAccessDenied=value;};
 fixture.setConnectionFailure=value=>{connectionFailed=value;};
 fixture.setActor=value=>{actor=value;};fixture.actorRequests=[];
 fixture.intercept=async request=>{
  const path=new URL(request.url).pathname;
  const authorization=Object.entries(request.headers??{}).find(([key])=>key.toLowerCase()==='authorization')?.[1];
  if(authorization){try{const id=JSON.parse(Buffer.from(authorization.split('.')[1],'base64url')).userId;fixture.actorRequests.push({path,id});}catch{/* Ignore malformed fixture credentials. */}}
  if(actor!==101&&path.startsWith('/api/users/3/'))return{status:404};
  if(actor!==101&&path==='/api/tracking-links/active')return{body:{content:[],totalPages:0,totalElements:0,last:true}};
  if(chatAccessDenied&&path.endsWith('/collaboration'))return{status:403};
  if(connectionFailed&&(path==='/api/study-rooms/room-fixture'||path.endsWith('/heartbeat')))return{status:503,body:{message:'Simulated room connection interrupted'}};
  if(path==='/login')return{body:{token:actor===101?token:'fixture.'+Buffer.from(JSON.stringify({type:'access',userId:actor,sub:'Other Scholar',email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url')+'.signature',refreshToken:'fixture-only'}};
  if(path==='/logout')return{status:204};
  const reply=await original(request);
  const expand=room=>({...room,host:room.ownerId===actor,members:[...room.members,...Array.from({length:9},(_,i)=>({userId:200+i,username:'Academic companion '+i,host:false,online:false,studying:false}))]});
  if(path==='/api/study-rooms')reply.body=reply.body.map(expand);
  else if(path==='/api/study-rooms/room-fixture'||path.endsWith('/heartbeat')||path.endsWith('/timer'))reply.body=expand(reply.body);
  else if(path==='/api/profile')reply.body={id:actor,username:actor===101?'Scholar':'Other Scholar',presentationName:actor===101?'Scholar':'Other Scholar'};
  return reply;
 };return fixture;
}
