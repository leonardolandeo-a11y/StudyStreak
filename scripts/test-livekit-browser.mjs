/** Opt-in local acceptance. Requires disposable Spring/PostgreSQL + LiveKit + Vite.
 * PLAYWRIGHT_MODULE points to playwright/index.mjs; no signing keys enter this test.
 * Real capture uses Chrome getDisplayMedia with an auto-selected dedicated fixture tab.
 * SYNTHETIC=1 instead publishes canvas frames and MUST NOT be called real capture.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const api=process.env.TEST_API_URL??'http://localhost:18089';
const web=process.env.TEST_WEB_URL??'http://localhost:5179';
for(const url of [api,web])assert.equal(new URL(url).hostname,'localhost','Test requires local disposable services');
const synthetic=process.env.SYNTHETIC==='1';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/google-chrome',headless:process.env.HEADED!=='1',
    args:['--auto-select-tab-capture-source-by-title=StudyStreak Capture Fixture','--enable-usermedia-screen-capturing']});
let room,accounts=[];
async function request(path,token,body,method=body?'POST':'GET',expected=200) {
    const response=await fetch(api+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
    assert.equal(response.status,expected,`${method} ${path}: expected ${expected}, received ${response.status}`);
    return response.status===204||response.headers.get('content-length')==='0'?null:response.json().catch(()=>null);
}
try {
    for(let i=0;i<3;i++) {
        const username='av_'+randomUUID().slice(0,12),password='Test9_'+randomUUID();
        const user=await request('/register',null,{username,password,email:username+'@test.invalid',timeZone:'America/Lima'},'POST',201);
        const login=await request('/login',null,{username,password});
        accounts.push({...login,user,username});
    }
    room=await request('/api/study-rooms',accounts[0].token,{name:'Phase 4 browser acceptance'},'POST',201);
    for(const account of accounts.slice(1))await request('/api/study-rooms/join',account.token,{code:room.inviteCode});
    if(!synthetic)await request(`/api/study-rooms/${room.id}/media/permissions/${accounts[1].user.id}`,accounts[0].token,{allowed:true},'PUT');
    let fixture;
    async function openFixture() {
        const page=await browser.newPage();await page.goto(web);
        await page.evaluate(()=>{document.title='StudyStreak Capture Fixture';document.body.innerHTML='<h1 style="background:#34d399;padding:100px">Dedicated screen capture test — no personal content</h1>';});
        return page;
    }
    const pages=[];
    for(const account of accounts) {
        const context=await browser.newContext({viewport:{width:1440,height:1100}});
        await context.addInitScript(()=>{
            window.acceptancePeers=[];window.acceptanceStreams=[];
            const NativePeer=window.RTCPeerConnection;
            window.RTCPeerConnection=class extends NativePeer {constructor(...args){super(...args);window.acceptancePeers.push(this);}};
            const capture=navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
            navigator.mediaDevices.getDisplayMedia=async(...args)=>{const stream=await capture(...args);window.acceptanceStreams.push(stream);return stream;};
        });
        await context.addInitScript(({token,refreshToken})=>{sessionStorage.setItem('accessToken',token);sessionStorage.setItem('refreshToken',refreshToken);},account);
        const page=await context.newPage();page.setDefaultTimeout(20000);pages.push(page);
        await page.goto(web+'/study-rooms');
        try { await page.getByRole('button',{name:/Phase 4 browser acceptance/}).click(); }
        catch(error) { console.log('UI failure',page.url(),await page.locator('body').innerText());throw error; }
        await page.getByRole('button',{name:'Connect to screens',exact:true}).click();
        await page.getByRole('region',{name:'Shared screens'}).getByRole('status').filter({hasText:/^Connected$/}).waitFor();
    }
    const [host,viewer,third]=pages;
    // The actual collaboration components and authenticated endpoints participate.
    await host.getByLabel('Message ·').fill('Acceptance message');await host.getByRole('button',{name:'Send message',exact:true}).click();
    await viewer.getByText('Acceptance message',{exact:true}).waitFor();
    await viewer.getByRole('button',{name:'Raise hand',exact:true}).click();
    await host.getByRole('status').filter({hasText:'✋'}).waitFor();
    await third.getByRole('button',{name:'React 💡',exact:true}).click();
    await host.getByRole('status').filter({hasText:'💡'}).waitFor();
    await host.getByRole('button',{name:'Remove message',exact:true}).click();
    await viewer.getByText('Message removed by host',{exact:true}).waitFor();
    console.log('PASS: three authenticated UI sessions, chat delivery/moderation, hand and reaction');
    const before=await request(`/api/study-rooms/${room.id}/media`,accounts[0].token);
    let credentials;
    if(synthetic) {
        credentials=await request(`/api/study-rooms/${room.id}/media/token`,accounts[0].token,{},'POST');
        await host.evaluate(async credentials=>{
            const {Room,Track}=await import('/node_modules/.vite/deps/livekit-client.js');
            const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
            const context=canvas.getContext('2d');let frame=0;
            const timer=setInterval(()=>{context.fillStyle=frame++%2?'#34d399':'#0f172a';context.fillRect(0,0,640,360);context.fillStyle='white';context.fillText('Synthetic transport '+frame,50,50);},100);
            const stream=canvas.captureStream(10),media=new Room();await media.connect(credentials.url,credentials.token);
            await media.localParticipant.publishTrack(stream.getVideoTracks()[0],{source:Track.Source.ScreenShare});
            window.acceptanceMedia={media,stream,timer};
        },credentials);
    } else {
        fixture=await openFixture();
        await host.bringToFront();
        await host.getByRole('button',{name:'Share screen',exact:true}).click();
        await host.getByRole('button',{name:'Stop sharing',exact:true}).waitFor({timeout:20000});
    }
    for(const page of [viewer,third])await page.waitForFunction(()=>[...document.querySelectorAll('video')].some(video=>video.videoWidth>0&&video.readyState>=2&&video.getVideoPlaybackQuality().totalVideoFrames>3),{},{timeout:20000});
    console.log(`PASS: ${synthetic?'SYNTHETIC transport':'REAL getDisplayMedia tab capture'} decoded by two independent Web accounts`);
    if(!synthetic) {
        await viewer.getByRole('button',{name:'Share screen',exact:true}).click();
        await third.getByRole('button',{name:accounts[1].username,exact:true}).click();
        await third.waitForFunction(()=>[...document.querySelectorAll('video')].some(video=>video.videoWidth>0));
        await third.getByRole('button',{name:'Fullscreen',exact:true}).click();
        await third.waitForFunction(()=>!!document.fullscreenElement);await third.evaluate(()=>document.exitFullscreen());
        await viewer.getByRole('button',{name:'Stop sharing',exact:true}).click();
        await third.getByRole('button',{name:accounts[1].username,exact:true}).waitFor({state:'hidden'});
        console.log('PASS: two simultaneous publishers, main sender selection and fullscreen');
    }
    await host.screenshot({path:'/tmp/ss-phase4-host.png',fullPage:true});
    await viewer.screenshot({path:'/tmp/ss-phase4-viewer.png',fullPage:true});
    if(!synthetic) {
        await host.getByRole('button',{name:'Stop sharing',exact:true}).click();
        await viewer.waitForFunction(()=>document.querySelectorAll('video').length===0);
        await host.waitForFunction(()=>window.acceptanceStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended')));
        console.log('PASS: application stop removes remote video and ends capture tracks');
        await host.getByRole('button',{name:'Share screen',exact:true}).click();
        await viewer.waitForFunction(()=>[...document.querySelectorAll('video')].some(video=>video.videoWidth>0));
        await fixture.close();
        await host.getByRole('button',{name:'Share screen',exact:true}).waitFor();
        await viewer.waitForFunction(()=>document.querySelectorAll('video').length===0);
        console.log('PASS: browser source closure ends sharing and removes remote video');
        fixture=await openFixture();await host.bringToFront();
        await host.getByRole('button',{name:'Share screen',exact:true}).click();
        await viewer.waitForFunction(()=>[...document.querySelectorAll('video')].some(video=>video.videoWidth>0));
    }
    await request(`/api/study-rooms/${room.id}/media/permissions/${accounts[1].user.id}`,accounts[0].token,{allowed:synthetic},'PUT');
    const after=await request(`/api/study-rooms/${room.id}/media`,accounts[0].token);assert.notEqual(before.epoch,after.epoch);
    for(const page of pages)await page.getByRole('button',{name:'Connect to screens',exact:true}).waitFor({timeout:20000});
    if(synthetic) {
        await host.waitForFunction(()=>window.acceptanceMedia.media.state==='disconnected',{},{timeout:20000});
        await host.evaluate(()=>{clearInterval(window.acceptanceMedia.timer);window.acceptanceMedia.stream.getTracks().forEach(track=>track.stop());});
        // An old JWT can recreate ONLY the retired namespace on self-hosted LiveKit.
        const oldRoom=await host.evaluate(async credentials=>{
            const {Room}=await import('/node_modules/.vite/deps/livekit-client.js');const media=new Room();
            try{await media.connect(credentials.url,credentials.token);window.oldAcceptance=media;return media.name;}catch{return null;}
        },credentials);
        if(oldRoom){assert.equal(oldRoom,before.epoch);assert.notEqual(oldRoom,after.epoch);await host.waitForFunction(()=>window.oldAcceptance.state==='disconnected',{},{timeout:20000});}
        console.log(`PASS: old JWT ${oldRoom?'recreated retired namespace and cleanup disconnected it':'rejected'}; never joined current epoch`);
    }
    await request(`/api/study-rooms/${room.id}/media/members/${accounts[2].user.id}`,accounts[0].token,undefined,'DELETE');
    await request(`/api/study-rooms/${room.id}/media/token`,accounts[2].token,{},'POST',403);
    await request('/api/study-rooms/join',accounts[2].token,{code:room.inviteCode},'POST',403);
    await request(`/api/study-rooms/${room.id}/collaboration`,accounts[2].token,undefined,'GET',403);
    console.log('PASS: rotation disconnects clients; kicked account denied new tokens, known invitation and chat');
    await host.getByRole('button',{name:'Connect to screens',exact:true}).click();
    await host.getByRole('region',{name:'Shared screens'}).getByRole('status').filter({hasText:/^Connected$/}).waitFor();
    await host.getByRole('link',{name:'Dashboard',exact:true}).first().click();
    await host.waitForFunction(()=>window.acceptancePeers.length>0&&window.acceptancePeers.every(peer=>peer.connectionState==='closed'));
    await host.waitForFunction(()=>window.acceptanceStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended')));
    assert.equal(await host.locator('video').count(),0);
    console.log('PASS: leaving Study Rooms closes every captured RTCPeerConnection and ends all local capture tracks');
} finally {
    if(room&&accounts[0])await request(`/api/study-rooms/${room.id}`,accounts[0].token,undefined,'DELETE',204).catch(()=>{});
    await browser.close();
}
