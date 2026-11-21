import { roads, blocked, clearSight } from './world.js';
export const cars=[],pedestrians=[];
const paint=['#e8aa63','#87b8aa','#d9767c','#d7d7b7','#709aaf','#966c8b'];
export function makeCar(x,y,a,color,extra={}){
  const car={x,y,a,color,speed:0,hp:100,traffic:false,police:false,stolen:false,turn:0,...extra};
  const retired=extra.patrol&&cars.find(c=>c.patrol&&!c.police);
  if(retired){Object.assign(retired,car,{goal:null});return retired;}
  cars.push(car);return car;
}
export const targetCar=makeCar(2572,805,-Math.PI/2,'#f18d82',{target:true});
for(let i=0;i<40;i++){
  const vertical=i%2===0,road=roads[i%6],v=120+(i*373)%2680,reverse=i%4<2;
  makeCar(vertical?road+(reverse?24:-24):v,vertical?v:road+(reverse?-24:24),vertical?(reverse?Math.PI/2:-Math.PI/2):(reverse?0:Math.PI),paint[i%6],{traffic:true,speed:60+i%5*9});
}
for(let i=0;i<18;i++)makeCar(roads[i%6]+65,370+(i*229)%2400,-Math.PI/2,paint[(i+2)%6]);
for(let i=0;i<95;i++){
  const vertical=i%2===0,r=roads[i%6],p=80+(i*131)%2820;
  pedestrians.push({x:vertical?r+(i%3?65:-65):p,y:vertical?p:r+(i%3?65:-65),a:vertical?Math.PI/2:0,homeA:vertical?Math.PI/2:0,panic:0,hp:40,color:paint[i%6],seed:i});
}
export function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
export function updateTraffic(dt,player,wanted,time,effects){
  for(const car of cars){
    if(car===player.car)continue;
    if(car.police){
      if(!wanted){car.traffic=true;car.police=false;continue;}
      const dx=player.x-car.x,dy=player.y-car.y,distance=Math.hypot(dx,dy);
      let tx=player.x,ty=player.y;
      if(distance>220||!clearSight(car.x,car.y,player.x,player.y)){
        if(!car.goal){car.goal={x:roads.reduce((a,b)=>Math.abs(b-car.x)<Math.abs(a-car.x)?b:a),y:roads.reduce((a,b)=>Math.abs(b-car.y)<Math.abs(a-car.y)?b:a)};}
        if(Math.hypot(car.x-car.goal.x,car.y-car.goal.y)<36){
          const ix=roads.indexOf(car.goal.x),iy=roads.indexOf(car.goal.y);
          const choices=[[ix-1,iy],[ix+1,iy],[ix,iy-1],[ix,iy+1]].filter(([x,y])=>x>=0&&x<6&&y>=0&&y<6).map(([x,y])=>({x:roads[x],y:roads[y]}));
          choices.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));car.goal=choices[0];
        }
        tx=car.goal.x;ty=car.goal.y;
      }
      const turn=angleDiff(Math.atan2(ty-car.y,tx-car.x),car.a);
      car.a+=Math.max(-2.6*dt,Math.min(2.6*dt,turn));
      car.speed+=((Math.abs(turn)>.7?65:Math.min(225,90+distance*.25))-car.speed)*dt*2;
      if(distance<42){player.hp-=dt*(player.car?5:14);if(player.car)player.car.speed*=.97;}
      car.shotClock=(car.shotClock||0)-dt;
      if(wanted>=2&&distance<310&&car.shotClock<=0&&clearSight(car.x,car.y,player.x,player.y)){effects.policeShot(car);car.shotClock=1.1+Math.random()*.7;}
    }else if(car.traffic){
      car.turn-=dt;
      const crossing=roads.find(r=>Math.abs((Math.abs(Math.sin(car.a))>.5?car.y:car.x)-r)<9);
      if(crossing!==undefined&&car.turn<0){
        car.turn=4;
        if(Math.random()<.3){car.a+=Math.random()<.5?Math.PI/2:-Math.PI/2;const r=roads.reduce((a,b)=>Math.abs(b-(Math.abs(Math.sin(car.a))>.5?car.x:car.y))<Math.abs(a-(Math.abs(Math.sin(car.a))>.5?car.x:car.y))?b:a);if(Math.abs(Math.sin(car.a))>.5)car.x=r+(Math.sin(car.a)>0?24:-24);else car.y=r+(Math.cos(car.a)>0?-24:24);}
      }
      const ahead=cars.some(other=>other!==car&&Math.hypot(other.x-car.x,other.y-car.y)<75&&Math.abs(angleDiff(Math.atan2(other.y-car.y,other.x-car.x),car.a))<.45);
      car.speed+=((ahead?0:85)-car.speed)*dt*2;
    }else{car.speed*=Math.exp(-dt*4);}
    const nx=car.x+Math.cos(car.a)*car.speed*dt,ny=car.y+Math.sin(car.a)*car.speed*dt;
    if(blocked(nx,ny,19)){if(car.police){car.a+=dt*4;car.speed=-35;car.goal=null;}else{car.a+=Math.PI;car.speed=20;}}
    else{car.x=nx;car.y=ny;}
  }
  for(const ped of pedestrians){
    if(ped.hp<=0)continue;
    const d=Math.hypot(ped.x-player.x,ped.y-player.y);
    if((wanted||player.car&&Math.abs(player.car.speed)>65)&&d<150)ped.panic=4;
    ped.panic=Math.max(0,ped.panic-dt);
    if(ped.panic>0)ped.a=Math.atan2(ped.y-player.y,ped.x-player.x);else ped.a=ped.homeA;
    const speed=ped.panic?110:24,nx=ped.x+Math.cos(ped.a)*speed*dt,ny=ped.y+Math.sin(ped.a)*speed*dt;
    if(blocked(nx,ny,6)){ped.homeA+=Math.PI;ped.a+=Math.PI;}else{ped.x=nx;ped.y=ny;}
    if(player.car&&d<26&&Math.abs(player.car.speed)>70){ped.hp=0;effects.crime(1);effects.hit(ped.x,ped.y,'#d88b7e');player.car.speed*=.85;}
  }
}
export function drawCar(ctx,car,time){
  ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.a);
  ctx.fillStyle='#18303c50';ctx.fillRect(-22,-10,53,29);
  ctx.fillStyle='#24363a';ctx.fillRect(-17,-17,12,5);ctx.fillRect(12,-17,10,5);ctx.fillRect(-17,12,12,5);ctx.fillRect(12,12,10,5);
  ctx.fillStyle=car.police?'#e7e4d4':car.hp<30?'#6a6962':car.color;ctx.beginPath();ctx.roundRect(-27,-13,54,26,6);ctx.fill();
  ctx.fillStyle='#304e5d';ctx.fillRect(-11,-10,22,20);ctx.fillStyle='#8cb3b6';ctx.fillRect(8,-9,6,18);ctx.fillStyle='#223f4b';ctx.fillRect(-16,-9,5,18);
  ctx.fillStyle=car.police?'#293d48':car.color;ctx.fillRect(-7,-9,13,18);ctx.fillStyle='#f9e2ad';ctx.fillRect(24,-11,4,6);ctx.fillRect(24,5,4,6);
  ctx.fillStyle='#f98070';ctx.fillRect(-28,-11,3,5);ctx.fillRect(-28,6,3,5);
  if(car.police){ctx.fillStyle=Math.sin(time*12)>0?'#f67477':'#71ceff';ctx.fillRect(-3,-10,6,20);ctx.globalAlpha=.1;ctx.beginPath();ctx.arc(0,0,65,0,7);ctx.fill();ctx.globalAlpha=1;}
  if(car.target){ctx.strokeStyle='#fff1b5';ctx.lineWidth=1.5;ctx.strokeRect(-31,-18,62,36);}
  ctx.restore();
}
export function drawPedestrian(ctx,ped,time){
  ctx.save();ctx.translate(ped.x,ped.y);ctx.rotate(ped.a);
  if(ped.hp<=0){ctx.fillStyle='#813e3d70';ctx.beginPath();ctx.ellipse(0,0,13,9,0,0,7);ctx.fill();ctx.fillStyle=ped.color;ctx.fillRect(-12,-4,23,8);}
  else{ctx.fillStyle='#233e4030';ctx.beginPath();ctx.ellipse(3,4,10,7,0,0,7);ctx.fill();ctx.fillStyle='#374b58';const step=Math.sin(time*(ped.panic?18:7)+ped.seed)*3;ctx.fillRect(-4+step,-6,7,4);ctx.fillRect(-4-step,3,7,4);ctx.fillStyle=ped.color;ctx.fillRect(-5,-7,10,14);ctx.fillStyle='#e5b895';ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();}ctx.restore();
}
