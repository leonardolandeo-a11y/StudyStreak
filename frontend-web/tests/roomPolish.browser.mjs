import {profileBrowser} from './helpers/profileBrowser.mjs';
import {roomPolishFixture,token} from '../../scripts/tests/roomPolishFixture.mjs';
import {roomPolishReview} from '../../scripts/tests/roomPolishReview.mjs';
const fixture=roomPolishFixture(),browser=await profileBrowser({intercept:fixture.intercept});
try{await browser.command('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('room-polish-bootstrap')){sessionStorage.setItem('room-polish-bootstrap','1');sessionStorage.setItem('accessToken',${JSON.stringify(token)});}`});await roomPolishReview(browser,'web',fixture);}finally{await browser.close();}
