// Original StudyStreak pixel illustrations, authored on small integer grids.
import { readFileSync, writeFileSync } from 'node:fs';
const palette = { ink:'#261d36', shadow:'#44304e', hair:'#714630', hairLight:'#ae744d', skin:'#efb58d', skinLight:'#ffdab4', blush:'#d88291', paper:'#fff0ce', gold:'#edbe72', wood:'#986249', woodLight:'#c99168', mint:'#95d9b2', green:'#527f70', leaf:'#79aa83', lilac:'#bca0db', purple:'#7f5c9f', pink:'#e8a7c1', rose:'#b66488', blue:'#8cbcd8', slate:'#4c627b', sky:'#bf99d6', sunset:'#edb1ab', glass:'#e3c3df' };
const sprites={};
function art(name,width,height,paint){const rects=[];const r=(x,y,w,h,c)=>rects.push([x,y,w,h,c]);paint(r);sprites[name]={width,height,rects};}
function person(r,x,y,shirt='mint',hair='hair'){
 r(x+10,y,16,2,'ink');r(x+6,y+2,24,3,'ink');r(x+4,y+5,28,12,'ink');r(x+6,y+4,24,13,hair);
 r(x+10,y+3,14,2,'hairLight');r(x+7,y+6,6,2,'hairLight');r(x+4,y+12,4,7,'shadow');r(x+29,y+12,4,7,'shadow');
 r(x+8,y+12,21,14,'ink');r(x+10,y+12,17,13,'skin');r(x+11,y+14,15,7,'skinLight');
 r(x+7,y+9,7,7,hair);r(x+12,y+8,5,6,hair);r(x+20,y+9,9,5,hair);r(x+26,y+12,4,6,hair);
 r(x+13,y+17,2,4,'ink');r(x+23,y+17,2,4,'ink');r(x+11,y+22,3,2,'blush');r(x+25,y+22,3,2,'blush');r(x+18,y+23,4,1,'hair');
 r(x+14,y+27,12,2,'ink');r(x+9,y+29,22,13,'ink');r(x+10,y+30,20,10,shirt);r(x+17,y+28,7,3,'skin');
 r(x+5,y+34,6,10,'ink');r(x+6,y+35,5,8,'skin');r(x+30,y+34,5,10,'ink');r(x+30,y+35,4,8,'skinLight');
 r(x+13,y+31,2,8,'paper');r(x+25,y+31,2,8,'green');
}
function book(r,x,y,w,color){r(x,y,w,8,'ink');r(x+1,y+1,w-2,6,color);r(x+4,y+2,w-5,4,'paper');r(x+5,y+4,w-7,1,'woodLight');r(x+1,y+6,w-2,1,'shadow');r(x+2,y+1,2,5,color);}
function star(r,x,y,c='gold'){r(x+1,y,1,5,c);r(x,y+2,3,1,c);}
art('scholar',64,58,r=>{
 r(5,49,54,3,'shadow');r(11,45,42,7,'wood');person(r,5,4);
 r(11,6,18,2,'slate');r(8,8,3,9,'blue');r(7,16,5,11,'ink');r(8,17,3,8,'lilac');r(32,15,5,11,'ink');r(33,16,3,8,'lilac');
 r(31,31,26,18,'ink');r(33,32,22,14,'slate');r(34,33,20,2,'blue');r(40,38,5,3,'paper');r(29,48,30,2,'blue');r(27,50,34,2,'ink');
 r(6,43,5,8,'paper');r(11,45,3,4,'woodLight');r(7,40,1,2,'lilac');star(r,48,8);star(r,56,19,'pink');
});
art('companions',76,56,r=>{person(r,0,7,'mint');person(r,37,4,'lilac','woodLight');r(3,49,70,3,'shadow');r(5,45,28,5,'green');r(43,46,24,5,'purple');star(r,33,7);star(r,68,16,'pink');});
art('books',64,58,r=>{r(3,51,58,3,'shadow');book(r,7,41,50,'mint');book(r,4,31,49,'blue');book(r,12,21,45,'pink');book(r,8,11,46,'gold');r(43,15,2,12,'rose');r(44,26,3,4,'rose');star(r,55,3);r(10,44,2,3,'gold');});
art('stopwatch',40,44,r=>{
 r(16,1,9,4,'ink');r(17,1,7,2,'paper');r(18,5,5,4,'slate');r(31,7,5,5,'ink');r(32,8,3,3,'pink');
 r(12,8,16,2,'ink');r(7,10,26,3,'ink');r(4,13,32,23,'ink');r(7,36,26,3,'ink');r(12,39,16,2,'ink');
 r(8,12,24,24,'rose');r(5,17,30,15,'pink');r(11,14,18,21,'gold');r(8,19,24,11,'gold');r(11,17,18,15,'paper');
 for(const [x,y] of [[19,14],[19,32],[8,24],[29,24]])r(x,y,2,2,'hair');r(19,21,2,6,'ink');r(21,18,2,5,'ink');r(18,24,4,3,'rose');
 r(6,15,2,8,'paper');r(28,35,3,2,'lilac');
});
art('notebook',40,44,r=>{
 r(7,5,27,36,'ink');r(9,6,23,33,'wood');r(5,9,27,30,'ink');r(7,10,23,27,'gold');r(10,12,18,22,'paper');
 r(10,1,3,9,'slate');r(22,1,3,9,'slate');r(11,1,1,6,'paper');r(23,1,1,6,'paper');
 for(const y of [17,23,29])r(12,y,14,1,'woodLight');r(12,23,3,4,'green');r(15,26,3,3,'green');r(18,23,3,4,'green');r(21,18,3,6,'green');r(24,15,3,5,'mint');
 r(4,14,3,2,'lilac');r(4,25,3,2,'lilac');r(4,33,3,2,'lilac');
});
art('growth',40,44,r=>{
 r(3,37,35,4,'ink');r(4,37,33,2,'paper');
 for(const [x,y,h,c]of[[5,25,11,'mint'],[16,16,20,'leaf'],[27,5,31,'gold']]){r(x,y,8,h,'ink');r(x+1,y+1,6,h-1,c);r(x+2,y+2,2,h-3,'paper');}star(r,5,9,'lilac');
});
art('flame',40,44,r=>{
 r(17,1,5,11,'ink');r(13,10,13,8,'ink');r(9,17,22,20,'ink');r(5,22,30,11,'ink');r(10,35,20,5,'ink');
 r(18,5,2,12,'gold');r(15,12,9,10,'rose');r(11,20,18,14,'rose');r(7,25,26,7,'rose');r(13,34,15,3,'rose');
 r(18,14,3,11,'gold');r(13,24,13,10,'gold');r(10,28,20,5,'gold');r(18,25,3,13,'paper');r(15,30,9,7,'paper');
 r(9,14,2,4,'pink');r(30,15,2,3,'gold');
});
function city(r,y){
 const heights=[9,14,11,19,13,24,16,11,21,14,28,17,13,22,15,10];
 heights.forEach((h,i)=>{const x=i*8;r(x,y-h,8,h,'shadow');if(i%3===0)r(x+2,y-h-3,2,3,'shadow');for(let yy=y-h+4;yy<y-2;yy+=5){r(x+2,yy,1,2,i%3===0?'gold':'purple');if(i%2)r(x+5,yy,1,2,'gold');}});
 r(0,y,128,3,'purple');
}
art('skyline',128,46,r=>{city(r,43);for(const[x,y]of[[8,6],[26,12],[57,3],[80,11],[115,4]])star(r,x,y,'lilac');});
art('nook',132,64,r=>{
 r(2,1,54,52,'ink');r(4,3,50,47,'wood');r(6,5,46,42,'sky');r(6,27,46,20,'sunset');
 r(9,20,12,3,'paper');r(11,17,5,3,'paper');r(32,12,14,3,'glass');r(36,10,5,2,'glass');
 r(6,37,10,10,'purple');r(15,33,8,14,'purple');r(22,39,8,8,'purple');r(29,30,12,17,'purple');r(41,36,11,11,'purple');
 r(28,5,3,42,'wood');r(6,26,46,3,'wood');r(0,50,60,5,'ink');r(2,50,56,3,'woodLight');
 book(r,63,46,39,'blue');book(r,65,37,33,'paper');
 r(72,25,18,12,'ink');r(73,26,16,9,'wood');r(75,27,12,2,'gold');r(78,9,2,16,'green');r(70,13,9,6,'leaf');r(78,4,8,7,'leaf');r(80,17,10,5,'leaf');r(70,14,3,2,'mint');r(83,5,3,2,'mint');
 r(100,44,29,12,'ink');r(103,42,21,13,'paper');r(102,38,4,7,'ink');r(120,37,4,8,'ink');r(103,39,2,7,'gold');r(120,39,2,7,'gold');
 r(106,45,5,1,'hair');r(117,45,5,1,'hair');r(112,48,3,2,'rose');r(101,51,27,3,'gold');r(103,52,6,2,'paper');r(120,52,6,2,'paper');
 r(113,26,5,1,'lilac');r(116,27,1,1,'lilac');r(115,28,1,1,'lilac');r(114,29,1,1,'lilac');r(113,30,5,1,'lilac');r(120,18,4,1,'lilac');r(122,19,1,2,'lilac');r(120,21,4,1,'lilac');
 r(1,56,130,2,'shadow');
});
const data={palette,sprites};
const target=new URL('../assets/academic/sprites.json',import.meta.url);
const json=JSON.stringify(data,null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(target,'utf8')!==json)throw Error('Academic sprite source out of sync');}else writeFileSync(target,json);
console.log(`Original academic sprites: ${Object.keys(sprites).length}.`);
