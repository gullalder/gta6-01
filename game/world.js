export const WORLD = 3200;
export const roads = [240, 720, 1200, 1680, 2160, 2640];
export const buildings = [];
export const palms = [];
export const districts = [
  {name:'CYPRESS HEIGHTS',x:750,y:550,color:'#9ebd8a'},
  {name:'MIRAGE DOWNTOWN',x:1700,y:1100,color:'#d0b496'},
  {name:'CORAL SHORE',x:2640,y:850,color:'#ead3a1'},
  {name:'PORT SABLE',x:1650,y:2510,color:'#99aaa1'},
];
const random = n => { const s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); };
for(let row=0;row<6;row++) for(let col=0;col<5;col++) {
  const x=roads[col]+84,y=roads[row]+84;
  const port=row>=4, suburb=col<2&&row<3;
  const colors=port?['#bc8263','#7e9d9d','#d4b284']:suburb?['#e8ba9d','#d8cd9e','#91b7a8']:['#d7bfad','#a4bdba','#c4a4a4','#e6d1b2'];
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){
    const seed=row*100+col*10+j*2+i;
    buildings.push({x:x+i*166,y:y+j*158,w:suburb?102:132,h:suburb?93:121,color:colors[seed%colors.length],height:port?10:suburb?8:18+random(seed)*22,port,suburb,seed});
  }
}
for(let i=0;i<100;i++){
  const shore=i<42;
  palms.push({x:shore?2780+(i%2)*90:100+random(i+4)*2450,y:shore?90+i*71:90+random(i+90)*2850,s:0.8+random(i)*0.4});
}
export function blocked(x,y,r=12){
  if(x<55||y<55||x>2900||y>3030)return true;
  return buildings.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h);
}
export function clearSight(x,y,tx,ty){
  const distance=Math.hypot(tx-x,ty-y),steps=Math.ceil(distance/28);
  for(let i=1;i<steps;i++)if(blocked(x+(tx-x)*i/steps,y+(ty-y)*i/steps,2))return false;
  return true;
}
export function districtAt(x,y){ return y>2150?'PORT SABLE':x>2450?'CORAL SHORE':x<1150?'CYPRESS HEIGHTS':'MIRAGE DOWNTOWN'; }
export function drawWorld(ctx,time){
  ctx.fillStyle='#7f9b80';ctx.fillRect(0,0,WORLD,WORLD);
  ctx.fillStyle='#cebda0';ctx.fillRect(2490,0,450,3100);
  ctx.fillStyle='#217d89';ctx.fillRect(2940,0,400,3200);ctx.fillRect(0,3070,3200,160);
  ctx.fillStyle='#3c99a1';ctx.fillRect(2920,0,30,3070);
  ctx.strokeStyle='#83c4bc';ctx.lineWidth=3;
  for(let i=0;i<30;i++){const y=i*120+Math.sin(time*.4+i)*10;ctx.beginPath();ctx.moveTo(2970,y);ctx.lineTo(3180,y-25);ctx.stroke();}
  ctx.fillStyle='#e2cf9e';ctx.fillRect(2815,0,100,3060);
  for(const road of roads){
    ctx.fillStyle='#c9c7ad';ctx.fillRect(road-74,0,148,3070);ctx.fillRect(0,road-74,2830,148);
    ctx.fillStyle='#45525a';ctx.fillRect(road-53,0,106,3070);ctx.fillRect(0,road-53,2830,106);
    ctx.strokeStyle='#e4c77d';ctx.lineWidth=2;ctx.setLineDash([24,23]);
    ctx.beginPath();ctx.moveTo(road,0);ctx.lineTo(road,3070);ctx.moveTo(0,road);ctx.lineTo(2830,road);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#b7b8a1';for(let q=0;q<3070;q+=70){ctx.fillRect(road-69,q,2,25);ctx.fillRect(q,road-69,25,2);}
  }
  for(const x of roads)for(const y of roads){
    ctx.fillStyle='#45525a';ctx.fillRect(x-54,y-54,108,108);
    ctx.fillStyle='#d7d5b8';for(let i=-40;i<45;i+=13){ctx.fillRect(x+i,y-70,7,17);ctx.fillRect(x-70,y+i,17,7);}
    ctx.fillStyle='#273e42';ctx.fillRect(x+60,y+60,4,17);ctx.fillStyle=Math.sin(time*.2+x)>0?'#8ed795':'#ffad84';ctx.fillRect(x+59,y+59,6,7);
  }
  // The southern waterfront has timber piers and moored little boats.
  for(let i=0;i<5;i++){
    const x=520+i*430;ctx.fillStyle='#a8906e';ctx.fillRect(x,3020,72,150);
    ctx.strokeStyle='#786d59';for(let j=0;j<13;j++){ctx.beginPath();ctx.moveTo(x,3020+j*11);ctx.lineTo(x+72,3020+j*11);ctx.stroke();}
    ctx.fillStyle='#eee1be';ctx.beginPath();ctx.ellipse(x+110,3110,20,45,.2,0,7);ctx.fill();ctx.fillStyle='#52727b';ctx.fillRect(x+99,3085,20,35);
  }
  for(const b of buildings) drawBuilding(ctx,b);
  // Landmarks give the regular street grid a few unmistakable destinations.
  drawLandmark(ctx,615,1900,'VALE AUTO','#65c7ae');
  drawLandmark(ctx,2470,900,'CORAL CAFE','#f3a18a');
  drawLandmark(ctx,620,490,'CYPRESS COURT','#dcd29e');
  drawLandmark(ctx,1510,2380,'SABLE FREIGHT','#b6c9c1');
  ctx.fillStyle='#b97560';ctx.fillRect(900,2830,225,44);ctx.fillStyle='#769a9b';ctx.fillRect(1450,2830,195,44);
  ctx.strokeStyle='#314a4c70';for(let i=0;i<20;i++){ctx.beginPath();ctx.moveTo(908+i*11,2833);ctx.lineTo(908+i*11,2870);ctx.stroke();}
  ctx.strokeStyle='#ffe0a060';ctx.lineWidth=2;for(let i=0;i<8;i++)ctx.strokeRect(880+i*105,2950,77,45);
  ctx.textAlign='center';ctx.font='900 24px Arial';ctx.fillStyle='#fff5d54a';
  for(const d of districts){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(-Math.PI/2);ctx.fillText(d.name,0,0);ctx.restore();}
  for(let i=0;i<17;i++){
    const y=160+i*170;ctx.fillStyle=i%2?'#e7927d':'#69bbb8';ctx.beginPath();ctx.arc(2850,y,17,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#89705c';ctx.fillRect(2848,y,4,20);
    ctx.fillStyle='#fff0ce';ctx.fillRect(2830,y+24,40,8);
  }
  ctx.textAlign='left';
}
function drawLandmark(ctx,x,y,label,color){
  ctx.fillStyle='#193b44';ctx.fillRect(x-75,y-20,150,37);ctx.fillStyle=color;ctx.fillRect(x-75,y+17,150,5);
  ctx.font='900 16px Arial';ctx.textAlign='center';ctx.fillStyle='#fff0c9';ctx.fillText(label,x,y+4);ctx.textAlign='left';
}
function drawBuilding(ctx,b){
  ctx.fillStyle='#203a3a40';ctx.fillRect(b.x+12,b.y+15,b.w+9,b.h+9);
  ctx.fillStyle='#596d68';ctx.fillRect(b.x,b.y,b.w,b.h);
  ctx.fillStyle=b.color;ctx.fillRect(b.x-b.height*.2,b.y-b.height*.3,b.w,b.h-7);
  ctx.strokeStyle='#f7e4c04d';ctx.lineWidth=3;ctx.strokeRect(b.x+5,b.y+5,b.w-12,b.h-20);
  ctx.fillStyle='#526c6c';
  if(b.port){for(let i=12;i<b.w-10;i+=15)ctx.fillRect(b.x+i,b.y+12,3,b.h-35);}
  else{
    for(let x=12;x<b.w-10;x+=24)for(let y=12;y<b.h-20;y+=25){ctx.fillStyle=(x+y+b.seed)%3?'#678c92':'#e6c888';ctx.fillRect(b.x+x,b.y+y,13,12);ctx.fillStyle='#ffffff30';ctx.fillRect(b.x+x,b.y+y,13,2);}
    ctx.fillStyle='#e8ddc1';ctx.fillRect(b.x+b.w-33,b.y+10,22,23);ctx.fillStyle='#a0aaa0';ctx.fillRect(b.x+b.w-29,b.y+15,14,13);
  }
  const signs=['LUNA MOTEL','CORAL CAFE','VALE AUTO','SUNDOWN','SABLE FREIGHT','PALM MART'];
  if(b.seed%3===0){ctx.fillStyle='#254952';ctx.fillRect(b.x+4,b.y+b.h-22,b.w-8,18);ctx.font='bold 9px Arial';ctx.fillStyle='#ffcc97';ctx.textAlign='center';ctx.fillText(signs[b.seed%signs.length],b.x+b.w/2,b.y+b.h-9);ctx.textAlign='left';}
  if(b.suburb){ctx.fillStyle='#438e8c';ctx.fillRect(b.x+b.w+7,b.y+25,34,53);ctx.strokeStyle='#8ad4c5';ctx.strokeRect(b.x+b.w+10,b.y+28,28,47);}
}
export function drawPalms(ctx){
  for(const p of palms){
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
    ctx.fillStyle='#173f3e24';ctx.beginPath();ctx.ellipse(17,20,27,12,.6,0,7);ctx.fill();
    ctx.strokeStyle='#8b7654';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,10);ctx.quadraticCurveTo(-3,-3,3,-16);ctx.stroke();
    for(let j=0;j<7;j++){ctx.save();ctx.translate(3,-16);ctx.rotate(j*.91);ctx.fillStyle=j%2?'#387b62':'#4f9570';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(20,-14,34,3);ctx.quadraticCurveTo(14,-1,0,0);ctx.fill();ctx.restore();}ctx.restore();
  }
}
