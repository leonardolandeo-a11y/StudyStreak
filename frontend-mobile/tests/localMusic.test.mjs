import './helpers/appearanceTestLoader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { players, deferNextMode } from './helpers/focusAudioMock.mjs';
import { files, File, pickedFiles, Paths } from './helpers/appearanceFileSystemMock.mjs';
const { LocalMusic } = await import('../src/features/focus/localMusic.ts');
const { MobileFocusAudio } = await import('../src/features/focus/mobileFocusAudio.ts');
const { pickLocalMusic, validAudio, MAX_TRACK_BYTES } = await import('../src/features/focus/localMusicPicker.ts');
const track=(id,released)=>({id,name:id+'.wav',uri:'file:///'+id+'.wav',release(){released.push(id);}});
test('local playback pauses/resumes, switches, resets finished tracks, releases players and owned tracks',async()=>{
 const released=[],music=new LocalMusic();music.add([track('a',released),track('b',released)]);
 await music.play('a',.5,()=>{});const first=players.at(-1);assert.equal(first.playing,true);
 music.pause();assert.equal(first.playing,false);await music.play('a',.5,()=>{});assert.equal(players.at(-1),first);
 first.currentTime=100;first.emit({playing:false,didJustFinish:true});await music.play('a',1,()=>{});assert.equal(first.currentTime,0);
 await music.play('b',.8,()=>{});assert.equal(first.released,true);music.remove('b');assert.deepEqual(released,['b']);assert.equal(players.at(-1).released,true);
 music.clear();music.clear();assert.deepEqual(released,['b','a']);assert.equal(music.getSnapshot().tracks.length,0);
});
test('soundscapes and local music exclude one another, including late preparation after a switch',async()=>{
 const sound=new MobileFocusAudio(),music=new LocalMusic();music.add([track('a',[])]);
 await sound.play('rain',.5);const synth=players.at(-1);await music.play('a',.5,()=>sound.stop());assert.equal(synth.released,true);
 let complete;deferNextMode(()=>new Promise(resolve=>complete=resolve));const pending=music.play('a',.5,()=>sound.stop());
 music.deactivate();await sound.play('forest',.5);complete();await pending;
 assert.equal(players.filter(player=>player.playing&&!player.released).length,1);
 assert.match(players.find(player=>player.playing&&!player.released).source.uri,/forest/);
 music.clear();sound.dispose();
});
test('decoder failure and removal cancel player status callbacks and pending starts',async()=>{
 const music=new LocalMusic(),released=[];music.add([track('a',released)]);
 await music.play('a',1,()=>{});const player=players.at(-1);player.emit({error:'private URI and codec failure'});
 assert.equal(player.released,true);assert.match(music.getSnapshot().error,/could not be played/);assert.doesNotMatch(music.getSnapshot().error,/private URI/);
 let complete;deferNextMode(()=>new Promise(resolve=>complete=resolve));const pending=music.play('a',1,()=>{});music.remove('a');complete();await pending;
 assert.equal(music.getSnapshot().activeId,null);assert.deepEqual(released,['a']);
});
test('native picker copies only permitted local audio; cleanup never deletes source files',async()=>{
 assert.equal(validAudio('track.wav','',1),true);assert.equal(validAudio('text.txt','text/plain',12),false);assert.equal(validAudio('track.mp3','audio/mpeg',MAX_TRACK_BYTES+1),false);
 const source=new File(Paths.document,'personal-name.wav');source.write(new Uint8Array([1,2,3]));pickedFiles.push(source);
 const tracks=await pickLocalMusic(10);assert.equal(tracks.length,1);assert.equal(source.exists,true);assert.doesNotMatch(tracks[0].uri,/personal-name/);
 const copy=tracks[0].uri;assert.ok(files.has(copy));tracks[0].release();assert.equal(files.has(copy),false);assert.equal(source.exists,true);
 pickedFiles.push(source);const controller=new AbortController();controller.abort();assert.deepEqual(await pickLocalMusic(10,controller.signal),[]);
});
