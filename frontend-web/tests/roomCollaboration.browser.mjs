import {writeFileSync} from 'node:fs';
import {profileBrowser} from './helpers/profileBrowser.mjs';
import {collaborationFixture,token} from '../../scripts/tests/roomCollaborationFixture.mjs';
import {reviewRoom} from '../../scripts/tests/roomCollaborationReview.mjs';
const fixture=collaborationFixture(),browser=await profileBrowser({intercept:fixture.intercept});
try{await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('accessToken',${JSON.stringify(token)})`});await reviewRoom(browser,'web',fixture);}catch(error){writeFileSync('../.local/stage74c/web-room-failure.json',JSON.stringify({text:await browser.evaluate('document.body.innerText'),scroll:await browser.evaluate(`(()=>{const e=document.querySelector('.room-chat-scroll');if(!e)return null;return{top:e.scrollTop,height:e.scrollHeight,rows:Array.from(e.querySelectorAll('[data-message]')).slice(20,29).map(r=>({id:r.dataset.message,y:r.getBoundingClientRect().top-e.getBoundingClientRect().top}))};})()`),requests:fixture.requests}));throw error;}finally{await browser.close();}
