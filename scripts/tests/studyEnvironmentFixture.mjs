// Shared browser-only API fixture: no requests reach a user's backend.
export const token = 'fixture.' + Buffer.from(JSON.stringify({type:'access', userId:101, sub:'Scholar', email:'fixture@example.invalid',role:'USER',exp:4102444800})).toString('base64url') + '.signature';
const page = content => ({content,totalPages:1,totalElements:content.length,last:true,empty:!content.length,number:0,size:10});
export function environmentFixture(request) {
 const url=new URL(request.url), path=url.pathname;
 if(path==='/login')return {body:{token,refreshToken:'fixture-only'}};
 if(request.method!=='GET')throw Error('Unexpected write in visual review: '+path);
 if(path==='/api/profile')return {body:{id:101,username:'Scholar',presentationName:'Scholar'}};
 if(path==='/api/study/active')return {body:{session:null,serverNow:new Date().toISOString()}};
 if(path.endsWith('/avatar'))return {status:404};
 if(path==='/api/focus-sessions/stats'){
  const days=Number(url.searchParams.get('days'))||7;
  const daily=Array.from({length:days},(_,i)=>({date:new Date(Date.UTC(2026,10,12-days+i)).toISOString().slice(0,10),minutes:i===days-1?25:0,sessions:i===days-1?1:0}));
  return {body:{days,daily,verifiedPeriod:{minutes:25,sessions:1,daily},timeZone:'America/Lima',totalMinutes:95,verifiedMinutes:75,estimatedMinutes:20,periodMinutes:45,weekMinutes:45,completedSessions:4,periodSessions:2,studyStreak:2,bestStudyStreak:5,activeDays:1,completionPercent:75,previousMinutes:25,changePercent:80,individualMinutes:25,groupMinutes:20,groupSessions:1,averageMinutes:25/days,activity:daily,hourly:[],weekly:[],monthly:[],byGoal:[]}};
 }
 if(path==='/users/101/goals')return {body:page([{id:7,topic:'Linear algebra',completed:false,frequency:3,duration:25}])};
 if(path.includes('notifications'))return {body:path.includes('unread')?0:page([])};
 if(path==='/api/study/history'||path.startsWith('/api/tracking-links'))return {body:page([])};
 return {status:404};
}
