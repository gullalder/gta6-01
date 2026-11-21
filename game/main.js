import { WORLD, roads, buildings, blocked, clearSight, drawWorld, drawPalms, districtAt } from './world.js';
import { cars, pedestrians, targetCar, makeCar, updateTraffic, drawCar, drawPedestrian, angleDiff } from './traffic.js';
import { unlockAudio, toggleMute, sound } from './audio.js';
const canvas=document.querySelector('#city'),ctx=canvas.getContext('2d');
let width=innerWidth,height=innerHeight;
function resize(){width=innerWidth;height=innerHeight;canvas.width=width;canvas.height=height;}
addEventListener('resize',resize);resize();
const keys=new Set(),mouse={x:width/2,y:height/2,down:false};
const player={x:2470,y:790,a:0,hp:100,cash:250,car:null};
const camera={x:player.x,y:player.y};
let playing=false,paused=false,time=0,wanted=0,heat=0,policeTimer=0,fireTimer=0,shake=0,toastTimer=0,saveTimer=0,crimeCooldown=0;
const particles=[],bullets=[];
addEventListener('keydown',e=>{
  keys.add(e.code);if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(e.code==='KeyE'&&playing&&!paused)enterVehicle();
  if(e.code==='Escape'&&playing){paused=!paused;saveGame();document.querySelector('#menu').classList.toggle('hidden',!paused);document.querySelector('#new').textContent='RESTART STORY';document.querySelector('#continue').textContent='RESUME';}
  if(e.code==='KeyM')notify(toggleMute()?'SOUND OFF':'SOUND ON');
  if(e.code==='KeyQ'&&playing&&player.cash>=100&&player.hp<100){player.cash-=100;player.hp=100;sound('pickup');notify('MEDKIT • −$100');}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
addEventListener('mousedown',()=>mouse.down=true);addEventListener('mouseup',()=>mouse.down=false);
function start(){unlockAudio();playing=true;paused=false;document.querySelector('#menu').classList.add('hidden');}
document.querySelector('#new').onclick=()=>{
  player.x=2470;player.y=790;player.hp=100;player.cash=250;player.car=null;story.stage=0;story.packages=0;wanted=0;
  Object.assign(targetCar,{x:2572,y:805,a:-Math.PI/2,hp:100,speed:0,stolen:false});
  for(const car of cars)if(car.patrol){car.police=false;car.speed=0;}
  start();saveGame();
};
document.querySelector('#continue').onclick=()=>{if(!playing)loadGame();start();};
function notify(text){document.querySelector('#toast').textContent=text;toastTimer=3.4;}
function crime(stars){wanted=Math.min(5,Math.max(wanted,stars)+(crimeCooldown<=0&&wanted>=stars?1:0));heat=22;crimeCooldown=4;}
function burst(x,y,color='#ffcc8b',count=12){sound('hit');shake=7;for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*190,vy:(Math.random()-.5)*190,life:.3+Math.random()*.5,color});}
function enterVehicle(){
  sound('enter');
  if(player.car){
    const c=player.car,positions=[c.a+Math.PI/2,c.a-Math.PI/2,c.a+Math.PI];
    for(const a of positions){const x=c.x+Math.cos(a)*45,y=c.y+Math.sin(a)*45;if(!blocked(x,y)){player.x=x;player.y=y;player.car=null;notify('ON FOOT');return;}}
    notify('EXIT BLOCKED');return;
  }
  const car=cars.filter(c=>c.hp>0&&Math.hypot(c.x-player.x,c.y-player.y)<75).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
  if(car){player.car=car;if(!car.stolen){crime(car.police?2:1);car.stolen=true;}car.traffic=false;notify(car.target?'CORAL COUPE ACQUIRED':'VEHICLE ACQUIRED');}
  else notify('GET CLOSER TO A CAR');
}
function update(dt){
  if(!playing||paused)return;
  toastTimer-=dt;if(toastTimer<=0)document.querySelector('#toast').textContent='';
  fireTimer-=dt;shake*=Math.exp(-dt*7);saveTimer+=dt;if(saveTimer>8){saveGame();saveTimer=0;}
  crimeCooldown-=dt;
  const x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),y=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);
  if(player.car){
    const car=player.car,handbrake=keys.has('ShiftLeft')||keys.has('Space');
    car.speed+=(-y*245-car.speed*(handbrake?3.2:.65))*dt;car.speed=Math.max(-125,Math.min(385,car.speed));
    car.a+=x*Math.min(1,Math.abs(car.speed)/60)*2.1*dt*(car.speed<0?-1:1)*(handbrake?1.4:1);
    const nx=car.x+Math.cos(car.a)*car.speed*dt,ny=car.y+Math.sin(car.a)*car.speed*dt;
    if(blocked(nx,ny,22)){if(Math.abs(car.speed)>60){const damage=Math.abs(car.speed)*.055;player.hp-=damage*.35;car.hp-=damage;burst(nx,ny);}car.speed*=-.25;}else{car.x=nx;car.y=ny;}
    for(const other of cars){if(other!==car&&Math.hypot(other.x-car.x,other.y-car.y)<43&&Math.abs(car.speed)>50){burst((car.x+other.x)/2,(car.y+other.y)/2);other.speed=car.speed*.5;other.a=car.a;other.traffic=false;other.x+=Math.cos(car.a)*15;other.y+=Math.sin(car.a)*15;car.speed*=-.18;car.hp-=6;player.hp-=2;if(other.police)crime(2);}}
    if(car.hp<=0){player.car=null;player.x=car.x+45;player.y=car.y;player.hp-=25;car.speed=0;burst(car.x,car.y,'#f78b5a',40);notify('ENGINE DESTROYED');}
    else{player.x=car.x;player.y=car.y;}
  }else{
    const speed=keys.has('ShiftLeft')?235:135,n=Math.hypot(x,y)||1;
    if(!blocked(player.x+x/n*speed*dt,player.y))player.x+=x/n*speed*dt;
    if(!blocked(player.x,player.y+y/n*speed*dt))player.y+=y/n*speed*dt;
  }
  player.a=Math.atan2(mouse.y-(player.y-camera.y+height/2),mouse.x-(player.x-camera.x+width/2));
  if(mouse.down&&fireTimer<=0){fireTimer=.22;crime(1);sound('shot');bullets.push({x:player.x+Math.cos(player.a)*27,y:player.y+Math.sin(player.a)*27,a:player.a,life:.7});burstMuzzle();}
  updateTraffic(dt,player,wanted,time,{crime,hit:burst,policeShot:car=>{
    sound('shot');if(Math.random()<.5){player.hp-=wanted>3?6:3;burst(player.x,player.y,'#f9ad85',3);}
    particles.push({x:car.x,y:car.y,vx:(player.x-car.x)*3,vy:(player.y-car.y)*3,life:.15,color:'#f5df9e'});
  }});
  updateCombat(dt);updatePolice(dt);updateStory(dt);
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
  if(player.hp<=0)respawn();
  if(targetCar.hp<=0&&story.stage<2){targetCar.hp=100;targetCar.x=2572;targetCar.y=805;targetCar.speed=0;targetCar.a=-Math.PI/2;story.stage=0;notify('MARA RECOVERED THE COUPE • TRY AGAIN');}
}
function burstMuzzle(){particles.push({x:player.x+Math.cos(player.a)*29,y:player.y+Math.sin(player.a)*29,vx:0,vy:0,life:.08,color:'#ffefae'});}
function updateCombat(dt){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];b.life-=dt;
    for(let step=0;step<3;step++){
      b.x+=Math.cos(b.a)*900*dt/3;b.y+=Math.sin(b.a)*900*dt/3;
      if(blocked(b.x,b.y,2)){b.life=0;break;}
      const ped=pedestrians.find(p=>p.hp>0&&Math.hypot(p.x-b.x,p.y-b.y)<12);
      if(ped){ped.hp-=40;ped.panic=5;crime(2);burst(b.x,b.y,'#dd8a7c',6);b.life=0;break;}
      const car=cars.find(c=>c!==player.car&&Math.hypot(c.x-b.x,c.y-b.y)<26);
      if(car){car.hp-=22;if(car.police)crime(3);burst(b.x,b.y);b.life=0;break;}
    }
    if(b.life<=0)bullets.splice(i,1);
  }
}
function updatePolice(dt){
  const police=cars.filter(c=>c.police&&c.hp>0),near=police.some(c=>Math.hypot(c.x-player.x,c.y-player.y)<420&&clearSight(c.x,c.y,player.x,player.y));
  if(wanted>0){
    heat-=dt*(near?.25:1.8);if(heat<=0){wanted=Math.max(0,wanted-1);heat=9;if(!wanted)notify('PURSUIT LOST • KEEP A LOW PROFILE');}
    policeTimer-=dt;if(policeTimer<=0&&police.length<Math.ceil(wanted)+1){
      const angle=Math.random()*Math.PI*2;let x=player.x+Math.cos(angle)*560,y=player.y+Math.sin(angle)*560;
      x=roads.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a);y=Math.max(90,Math.min(2980,y));
      makeCar(x,y,Math.atan2(player.y-y,player.x-x),'#d7ded9',{police:true,patrol:true,turn:Math.random()*10});policeTimer=4;
    }
    if(Math.floor(time*2)!==Math.floor((time-dt)*2)&&near)sound('siren');
  }
  for(const c of cars)if(c.police&&c.hp<=0){c.police=false;c.traffic=false;c.speed=0;burst(c.x,c.y,'#ed9b6f',20);}
}
function respawn(){
  notify(player.car?'WASTED • HOSPITAL FEE $150':'BUSTED • RELEASED ON BAIL');
  player.cash=Math.max(0,player.cash-150);player.hp=100;player.car=null;player.x=2470;player.y=790;wanted=0;heat=0;
  for(const c of cars)if(c.police){c.police=false;c.speed=0;}
  if(story.stage===1){story.stage=0;targetCar.x=2572;targetCar.y=805;targetCar.hp=100;targetCar.speed=0;}
  saveGame();
}
const story={stage:0,packages:0,escapeTime:0};
const packageSites=[{x:1680,y:2500},{x:2160,y:2780},{x:1200,y:2890}];
const depot={x:720,y:2030},safehouse={x:720,y:620};
function missionMarker(){
  if(story.stage===0)return targetCar;
  if(story.stage===1)return depot;
  if(story.stage===2)return {x:2640,y:1680};
  if(story.stage===3)return safehouse;
  if(story.stage===4)return packageSites[Math.min(2,story.packages)];
  if(story.stage===5)return depot;
  return {x:2640,y:1200};
}
function updateStory(dt){
  const previousStage=story.stage,previousPackages=story.packages;
  const distance=Math.hypot(player.x-missionMarker().x,player.y-missionMarker().y);
  if(story.stage===0&&player.car===targetCar){story.stage=1;notify('01 • TAKE THE COUPE TO VALE AUTO');}
  else if(story.stage===1&&distance<85&&player.car===targetCar&&Math.abs(player.car.speed)<55){reward(600,'BORROWED SUNSHINE COMPLETE');story.stage=2;player.car.hp=100;}
  else if(story.stage===2&&distance<90){story.stage=3;crime(2);heat=35;notify('AMBUSH • LOSE THE TAIL');}
  else if(story.stage===3&&distance<100&&wanted===0){reward(900,'THE LONG WAY HOME COMPLETE');story.stage=4;}
  else if(story.stage===4&&distance<65){story.packages++;sound('pickup');notify(`MANIFEST ${story.packages} / 3 RECOVERED`);if(story.packages>=3)story.stage=5;}
  else if(story.stage===5&&distance<90){reward(1400,'PAPER TRAIL COMPLETE • CITY UNLOCKED');story.stage=6;}
  else if(story.stage===6&&distance<70){reward(120,'COURIER BONUS');story.stage=7;}
  else if(story.stage===7&&Math.hypot(player.x-depot.x,player.y-depot.y)<90){reward(180,'DELIVERY COMPLETE');story.stage=6;}
  if(previousStage!==story.stage||previousPackages!==story.packages)saveGame();
}
function reward(cash,text){player.cash+=cash;player.hp=Math.min(100,player.hp+25);sound('pickup');notify(`${text} +$${cash}`);}
function saveGame(){try{localStorage.setItem('vice-harbor-save',JSON.stringify({cash:player.cash,stage:story.stage,packages:story.packages,x:player.x,y:player.y}));}catch{}}
function loadGame(){try{const s=JSON.parse(localStorage.getItem('vice-harbor-save'));if(s){player.cash=Math.max(0,Number(s.cash)||0);story.stage=Math.max(0,Math.min(7,Number(s.stage)||0));story.packages=Math.min(3,Number(s.packages)||0);player.x=Number(s.x)||2470;player.y=Number(s.y)||790;if(story.stage===1){story.stage=0;player.x=2470;player.y=790;}if(blocked(player.x,player.y)){player.x=2470;player.y=790;}}}catch{}}
const missionCopy=[
  ['01 / BORROWED SUNSHINE','Take the coral coupe','Press E beside the marked coupe. Mara needs her wheels back.'],
  ['01 / BORROWED SUNSHINE','Deliver the coral coupe','Drive to Vale Auto in Port Sable. Slow down inside the golden ring.'],
  ['02 / THE LONG WAY HOME','Meet the harbor contact','Follow the coast to Coral Shore. Something about this deal feels wrong.'],
  ['02 / THE LONG WAY HOME','Lose the tail. Reach home.','Break line of pursuit, let your stars fade, then reach the Cypress safehouse.'],
  ['03 / PAPER TRAIL','Recover the manifests','Collect three freight records along the docks. The gold marker leads the way.'],
  ['03 / PAPER TRAIL','Return to Vale Auto','Bring the evidence to Mara. Time to make the harbor boss pay.'],
  ['FREE ROAM / COURIER RUN','Collect a beach delivery','The debt is paid. The city is yours. Take a delivery for extra cash.'],
  ['FREE ROAM / COURIER RUN','Deliver to Vale Auto','Drive the package across town. $180 on delivery.'],
];
const dialogue=[
  'Welcome home, Ren. We need wheels, not questions. My coral coupe is by the shore.',
  'Nice work. Bring it to the garage. And try to keep the paint on it.',
  'Someone at the harbor wants to talk. Meet them on the south beach road.',
  'It was a setup! Get clear of the patrols. Our old place in Cypress is still safe.',
  'Sable Freight keeps a paper trail. Three manifests. Then we own the truth.',
  'Those records prove the debt was a lie. Bring them home. We end this tonight.',
  'We got our garage back. No more favors. Well... maybe one little delivery.',
  'Sunset, open roads, honest money. I could get used to this.',
];
function drawPlayer(){
  ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.a);
  ctx.fillStyle='#122d3340';ctx.beginPath();ctx.ellipse(5,5,15,10,0,0,7);ctx.fill();
  ctx.fillStyle='#1a3d4a';ctx.fillRect(-6,-9,12,18);ctx.fillStyle='#e9bfa0';ctx.beginPath();ctx.arc(0,0,6,0,7);ctx.fill();ctx.fillRect(6,-8,12,4);ctx.fillStyle='#292d38';ctx.fillRect(14,-8,10,3);ctx.restore();
}
function render(){
  camera.x+=(player.x-camera.x)*.08;camera.y+=(player.y-camera.y)*.08;
  ctx.fillStyle='#1f6571';ctx.fillRect(0,0,width,height);
  ctx.save();ctx.translate(width/2-camera.x+(Math.random()-.5)*shake,height/2-camera.y+(Math.random()-.5)*shake);
  drawWorld(ctx,time);drawMissionMarker();
  for(const ped of pedestrians)drawPedestrian(ctx,ped,time);
  for(const car of cars)drawCar(ctx,car,time);
  if(!player.car)drawPlayer();
  for(const b of bullets){ctx.strokeStyle='#ffe2a3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-Math.cos(b.a)*18,b.y-Math.sin(b.a)*18);ctx.stroke();}
  for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);}ctx.globalAlpha=1;
  drawPalms(ctx);ctx.restore();
  const grade=ctx.createLinearGradient(0,0,width,height);grade.addColorStop(0,'#ffb97a12');grade.addColorStop(1,'#173f6a17');ctx.fillStyle=grade;ctx.fillRect(0,0,width,height);
  drawMinimap();drawCompass();
  const stars=Math.ceil(wanted),status=player.car?`${Math.round(Math.abs(player.car.speed)*.3)} MPH · HULL ${Math.ceil(player.car.hp)}%`:'ON FOOT · PISTOL';
  document.querySelector('#status').innerHTML=`<span style="color:#9ee6c6">$${player.cash.toLocaleString()}</span><small>♥ ${Math.max(0,Math.ceil(player.hp))} <span style="color:#ffc77c;font-size:21px">${'★'.repeat(stars)}<span style="opacity:.35">${'☆'.repeat(5-stars)}</span></span></small><small>${status}</small>`;
  const copy=missionCopy[story.stage];
  document.querySelector('#objective').innerHTML=`<small>${copy[0]}</small><b>${copy[1]}</b><p>${copy[2]}</p><p style="color:#ffe0a3">◇ ${Math.round(Math.hypot(player.x-missionMarker().x,player.y-missionMarker().y))} m ${story.stage===4?`· ${story.packages}/3 manifests`:''}</p>`;
  document.querySelector('#radio').innerHTML=`<b>MARA / VALE AUTO</b><br>${dialogue[story.stage]}`;
  if(playing&&!paused&&!player.car){const nearby=cars.find(c=>c.hp>0&&Math.hypot(c.x-player.x,c.y-player.y)<75);if(nearby){ctx.fillStyle='#102e38e8';ctx.fillRect(width/2-82,height/2+38,164,30);ctx.fillStyle='#ffe2ae';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('E  •  TAKE THE WHEEL',width/2,height/2+58);ctx.textAlign='left';}}
  if(playing&&!paused){ctx.strokeStyle='#fff0ce';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mouse.x,mouse.y,6,0,7);ctx.moveTo(mouse.x-11,mouse.y);ctx.lineTo(mouse.x-4,mouse.y);ctx.moveTo(mouse.x+4,mouse.y);ctx.lineTo(mouse.x+11,mouse.y);ctx.stroke();}
}
function drawMissionMarker(){
  const m=missionMarker(),pulse=Math.sin(time*3)*5;
  ctx.strokeStyle='#ffe3a4';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(m.x,m.y,43+pulse,0,7);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#ffd38b28';ctx.beginPath();ctx.arc(m.x,m.y,40,0,7);ctx.fill();
  ctx.fillStyle='#ffe3a4';ctx.beginPath();ctx.moveTo(m.x,m.y-68);ctx.lineTo(m.x-9,m.y-83);ctx.lineTo(m.x+9,m.y-83);ctx.fill();
  ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(story.stage===0?'CORAL COUPE':story.stage===4?'MANIFEST':'DESTINATION',m.x,m.y-94);ctx.textAlign='left';
  if(story.stage===4)for(let i=story.packages;i<3;i++){const p=packageSites[i];ctx.fillStyle='#ffcc85';ctx.fillRect(p.x-8,p.y-8,16,16);ctx.strokeStyle='#855e43';ctx.strokeRect(p.x-8,p.y-8,16,16);}
}
function drawMinimap(){
  const size=182,x=width-size-30,y=height-size-66,scale=size/3200;
  ctx.fillStyle='#0c2d37ee';ctx.fillRect(x-9,y-28,size+18,size+61);
  ctx.fillStyle='#bdd5c1';ctx.font='bold 10px Arial';ctx.fillText(districtAt(player.x,player.y),x,y-12);
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#739c87';ctx.fillRect(0,0,size,size);ctx.fillStyle='#2c8b96';ctx.fillRect(2940*scale,0,size-2940*scale,size);ctx.fillRect(0,3070*scale,size,130*scale);
  ctx.strokeStyle='#c4c3a7';ctx.lineWidth=5;for(const r of roads){ctx.beginPath();ctx.moveTo(r*scale,0);ctx.lineTo(r*scale,3070*scale);ctx.moveTo(0,r*scale);ctx.lineTo(2840*scale,r*scale);ctx.stroke();}
  ctx.fillStyle='#596e68';for(const b of buildings)ctx.fillRect(b.x*scale,b.y*scale,b.w*scale,b.h*scale);
  const m=missionMarker();ctx.strokeStyle='#ffdc8e';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(player.x*scale,player.y*scale);ctx.lineTo(m.x*scale,m.y*scale);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#ffe0a0';ctx.beginPath();ctx.arc(m.x*scale,m.y*scale,4,0,7);ctx.fill();
  for(const c of cars)if(c.police){ctx.fillStyle=Math.sin(time*10)>0?'#ef797c':'#9edfff';ctx.fillRect(c.x*scale-2,c.y*scale-2,4,4);}
  ctx.translate(player.x*scale,player.y*scale);ctx.rotate(player.car?player.car.a:player.a);ctx.fillStyle='#fffbe3';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-4);ctx.lineTo(-3,0);ctx.lineTo(-5,4);ctx.fill();ctx.restore();
  ctx.fillStyle=wanted?'#ffbe88':'#a7d6c3';ctx.font='bold 9px Arial';ctx.fillText(wanted?(heat<8?'SEARCH AREA COOLING':'POLICE DISPATCH ACTIVE'):'N ↑  •  VICE HARBOR',x,y+size+20);
}
function drawCompass(){
  const m=missionMarker(),dx=m.x-player.x,dy=m.y-player.y;
  if(Math.abs(dx)>width/2-70||Math.abs(dy)>height/2-90){const a=Math.atan2(dy,dx),r=Math.min((width/2-70)/Math.max(.01,Math.abs(Math.cos(a))),(height/2-100)/Math.max(.01,Math.abs(Math.sin(a))));ctx.save();ctx.translate(width/2+Math.cos(a)*r,height/2+Math.sin(a)*r);ctx.rotate(a);ctx.fillStyle='#ffe1a3';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-9,-9);ctx.lineTo(-9,9);ctx.fill();ctx.restore();}
}
let previous=0;
function frame(now){const dt=Math.min((now-previous)/1000,.035);previous=now;time+=dt;update(dt);render();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
