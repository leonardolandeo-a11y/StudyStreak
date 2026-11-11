// Original pixel-room geometry. Deterministic detail, no external images or random assets.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const old=JSON.parse(readFileSync(new URL('assets/auth/study-room.json',root),'utf8'));
const rects=[],effects={clouds:[],steam:[],stars:[],glow:[]};
const r=(x,y,w,h,c,when='all')=>rects.push([x,y,w,h,c,when]);
// Architectural layers: plaster, timber beams and parquet in perspective.
r(0,0,400,250,'wall');r(0,150,400,100,'wallShade');
for(let y=4;y<149;y+=8)for(let x=3;x<398;x+=13)if((x+y)%7<3)r(x,y,2,1,'wallShade');
r(0,0,400,5,'woodDark');r(0,5,400,2,'woodLight');
for(const x of [0,244,392]){r(x,0,8,156,'woodDark');r(x+1,0,2,155,'wood');}
r(0,150,400,5,'woodDark');r(0,151,400,1,'woodLight');
for(let y=161;y<250;y+=15){r(0,y,400,1,'woodDark');for(let x=(y%2)*27;x<399;x+=61)r(x,y,1,Math.min(14,250-y),'woodDark');}
// Large recessed window and layered landscape; animated clouds stay inside the glass.
r(22,17,207,120,'outline');r(25,20,201,114,'wood');
const landscapeStart=rects.length;
r(30,24,191,105,'sky');
for(let y=66;y<129;y+=7)r(30,y,191,7,y<87?'skyGlow':y<107?'horizon':'distant');
r(43,43,12,9,'sun','morning');r(46,40,6,15,'sun','morning');
r(181,35,13,13,'sun','afternoon');r(178,38,19,7,'sun','afternoon');
r(183,31,12,14,'sun','night');r(188,29,10,12,'sky','night');
for(let i=0;i<11;i++){const x=37+(i*47)%175,y=29+(i*13)%35;effects.stars.push([x,y,i%3===0?2:1,1,'sun','night']);}
for(const [x,y,w]of [[44,42,28],[118,33,32],[170,58,24]]){
 effects.clouds.push([x,y,w,3,'page','day'],[x+5,y-3,w-12,3,'page','day'],[x-3,y+3,w+6,2,'skyGlow','day']);
}
// Mountain silhouettes, treeline, distant town with roofs and warm windows.
for(let i=0;i<18;i++){const x=30+i*10,y=80+Math.abs(8-i)*2;r(x,y,10,129-y,'horizon');r(x+2,y-3,6,3,'horizon');}
for(let i=0;i<23;i++){const x=30+i*8,y=105+(i*7)%12;r(x,y,7,129-y,'distant');r(x+2,y-4,3,4,'distant');}
for(const [x,y]of [[51,108],[93,112],[166,106],[195,113]]){r(x,y,14,17,'frame');r(x-2,y-2,18,2,'woodDark');r(x+3,y+4,3,4,'lampLight');r(x+9,y+4,2,4,'lampLight');}
// Existing geometry is tagged for window-only motion; the room artwork stays intact.
const landscapeEnd=rects.length, windowFrameStart=rects.length;
// Window lattice, carved sill and curtains.
for(const x of [29,91,155,218]){r(x,23,3,108,'woodDark');r(x+1,24,1,104,'woodLight');}
r(30,76,191,4,'woodDark');r(30,76,191,1,'woodLight');r(17,133,218,7,'woodDark');r(18,133,216,2,'woodLight');r(22,140,208,3,'wood');
for(const x of [15,222]){r(x,18,9,107,'bookB');for(let i=0;i<3;i++)r(x+i*3,21,1,101,'frame');r(x-1,112,11,4,'bookC');}
const windowFrameEnd=rects.length;
// Detailed built-in bookcase, individual spines, brass labels, shelf shadows.
r(261,15,115,140,'outline');r(265,18,107,134,'woodDark');
for(const y of [54,94,134]){
 for(let i=0,x=269;x<362;i++,x+=8+(i%3)*2){const w=6+(i%3)*2,h=19+(i*7)%15,c=['bookA','bookB','bookC'][i%3];r(x,y-h,w,h,c);r(x+1,y-h+2,1,h-3,'woodLight');r(x+2,y-7,Math.max(2,w-3),1,'page');r(x+2,y-h+5,Math.max(2,w-3),1,'lamp');}
 r(264,y,109,4,'wood');r(265,y,107,1,'woodLight');r(266,y+4,105,3,'outline');
}
r(260,15,5,140,'wood');r(372,15,5,140,'wood');r(260,15,117,3,'woodLight');
// Hanging notes and botanical drawing.
r(237,42,17,24,'woodDark');r(239,44,13,20,'page');r(245,48,1,13,'bookA');r(242,50,3,2,'foliage');r(246,54,3,2,'foliage');
for(const [x,y,c]of [[236,85,'page'],[245,102,'lampLight']]){r(x,y,12,13,c);r(x+4,y-1,4,2,'bookC');r(x+2,y+4,7,1,'bookB');r(x+2,y+7,5,1,'bookB');}
// Desk foreground: grain, mouldings, drawer handles, shadow and legs.
r(9,184,248,41,'woodDark');r(14,188,237,35,'outline');r(20,190,10,49,'woodDark');r(22,191,2,46,'wood');r(228,188,10,51,'woodDark');r(228,190,2,46,'wood');
r(18,180,226,8,'wood');r(16,177,233,5,'woodLight');r(13,172,239,6,'woodDark');r(12,164,242,9,'wood');r(12,164,242,2,'woodLight');
for(let i=0;i<75;i++){const x=15+(i*31)%228,y=166+(i%6);r(x,y,3+(i%9),1,i%3?'woodLight':'woodDark');}
for(const y of [190,207]){r(170,y,52,14,'wood');r(172,y+1,48,1,'woodLight');r(190,y+6,14,2,'outline');r(193,y+6,8,1,'lamp');}
// Stack of stitched books.
for(const [x,y,w,c]of [[34,154,38,'bookA'],[30,146,44,'bookB'],[37,139,33,'bookC']]){r(x,y,w,7,c);r(x+3,y+2,w-5,3,'page');for(let z=0;z<3;z++)r(x+4,y+2+z,w-8,1,z%2?'page':'lampLight');r(x,y+6,w,1,'outline');}
// Open notebook, notes, spectacles, pencil and folded papers.
r(80,155,60,8,'woodDark');r(82,150,26,11,'page');r(109,151,27,10,'page');r(107,152,2,10,'frame');
for(let i=0;i<4;i++){r(86,153+i*2,16-(i%2)*4,1,'bookB');r(114,154+i*2,17-(i%2)*6,1,'bookA');}
r(84,162,50,1,'lampLight');r(138,159,23,2,'bookC');r(158,159,3,2,'outline');
r(142,145,19,10,'page');r(144,148,12,1,'bookB');r(144,151,9,1,'bookB');
for(const x of [112,123]){r(x,145,8,1,'outline');r(x,145,1,5,'outline');r(x+7,145,1,5,'outline');r(x,150,8,1,'outline');}r(120,147,3,1,'outline');
// Lamp silhouette, highlights, warm cone in stepped pixel bands.
r(211,116,3,42,'lamp');r(212,117,1,40,'lampLight');r(199,158,29,3,'outline');r(202,156,23,2,'lamp');
r(201,111,27,3,'outline');r(204,104,21,7,'lamp');r(209,101,12,3,'lampLight');r(203,114,23,4,'lampGlow');
for(let i=0;i<8;i++)effects.glow.push([201-i*2,118+i*5,27+i*4,5,'beam','night']);
// Plant foreground in a glazed terracotta pot.
r(5,170,16,20,'clay');r(3,167,20,4,'woodLight');r(8,172,2,14,'lamp');
for(let i=0;i<9;i++){const x=4+(i*7)%17,y=142+(i*11)%23;r(x,y,7,3,'foliage');r(x+2,y-2,3,7,'bookA');}r(12,145,2,22,'foliage');
// Chair and rug add near-plane depth on the right, behind the form.
r(276,195,102,35,'bookB');r(282,190,90,5,'frame');
for(let x=283;x<371;x+=8)r(x,196,2,33,'frame');
r(292,158,68,44,'outline');r(296,161,60,35,'bookA');r(299,164,54,2,'foliage');r(293,201,8,42,'woodDark');r(353,201,7,42,'woodDark');
for(let i=0;i<12;i++)r(297+(i%6)*10,172+Math.floor(i/6)*12,2,2,'foliage');
// Warm shafts from the window fall across the desk in daylight.
for(let i=0;i<11;i++)effects.glow.push([38+i*4,130+i*3,155,3,'lampLight','day']);
// Coffee reuses the original branded cup, without static steam (animated layer below).
for(const [x,y]of [[181,142],[187,138],[192,143]])effects.steam.push([x,y,1,4,'page','all'],[x-1,y-2,2,1,'page','all']);
const room={width:400,height:250,palettes:old.palettes,rects,effects,coffee:{x:174,y:138,size:30},window:{clip:[30,24,191,105],landscapeRange:[landscapeStart,landscapeEnd],frameRange:[windowFrameStart,windowFrameEnd]}};
const compactRows=rows=>'[\n'+rows.map(row=>'    '+JSON.stringify(row)).join(',\n')+'\n  ]';
let json=JSON.stringify({...room,rects:'__rects__',effects:Object.fromEntries(Object.keys(effects).map(key=>[key,'__'+key+'__']))},null,2).replace('"__rects__"',compactRows(rects));
for(const [name,rows]of Object.entries(effects))json=json.replace('"__'+name+'__"',compactRows(rows));
json+='\n';const path=new URL('assets/auth/study-room.json',root);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==json)throw Error('Room source out of sync');}else writeFileSync(path,json);
console.log(`Room authored: ${rects.length} detail rectangles.`);
