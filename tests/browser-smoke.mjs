import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const profile = mkdtempSync(join(tmpdir(), "vice-smoke-"));
const server = spawn(process.execPath, ["serve.ts", "--port", "18080"], {
  cwd: root,
  stdio: "ignore",
});
let chrome;
async function ready(url) {
  for (let i = 0; i < 60; i++) {
    try {
      let r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Browser/server did not start: " + url);
}
try {
  await ready("http://localhost:18080/");
  chrome = spawn(
    process.env.CHROME_BIN || "google-chrome",
    [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--window-size=1280,800",
      "--remote-debugging-port=19222",
      "--user-data-dir=" + profile,
      "http://localhost:18080/",
    ],
    { stdio: "ignore" },
  );
  await ready("http://localhost:19222/json");
  const pages = await (await fetch("http://localhost:19222/json")).json();
  const ws = new WebSocket(
    pages.find((p) => p.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((r) => (ws.onopen = r));
  let seq = 0;
  const p = new Map(),
    errors = [],
    requests = [];
  ws.onmessage = (e) => {
    let m = JSON.parse(e.data);
    if (m.id) {
      p.get(m.id)(m);
      p.delete(m.id);
    }
    if (m.method === "Runtime.exceptionThrown")
      errors.push(m.params.exceptionDetails);
    if (m.method === "Network.requestWillBeSent")
      requests.push(m.params.request.url);
  };
  const call = (method, params = {}) =>
    new Promise((resolve) => {
      let id = ++seq;
      p.set(id, (m) => {
        if (m.error) throw Error(JSON.stringify(m.error));
        resolve(m.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression) => {
    let r = await call("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  await call("Runtime.enable");
  await call("Page.enable");
  await call("Network.enable");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await call("Page.reload");
  await wait(700);
  // Exercise engine transitions in deterministic fixture locations. Screenshots are captured separately from play.
  await ev("document.querySelector('#start').click()");
  await wait(100);
  await ev(
    "Promise.all(['entities','missions','main','world'].map(x=>import('./src/'+x+'.js'))).then(([e,m,g,w])=>{window.test={e,m,g,w}})",
  );
  const result =
    await ev(`(()=>{const {e,m,g,w}=test;const s=g.state;const report=[];
const wall=w.buildings[0];if(!w.solid(wall.x+15,wall.y+15))throw Error('Building collision missing');report.push('building collision');
// Real simulation steps test fire, fleeing, impacts, police search, death and respawn.
e.player.x=2700;e.player.y=1400;e.player.car=null;e.player.shot=0;
const pedestrian=e.people[0];pedestrian.x=2765;pedestrian.y=1400;pedestrian.speed=0;pedestrian.hp=45;
e.fire(s,0);if(!e.bullets.length||pedestrian.flee<=0||e.player.wanted<2)throw Error('fire/flee/crime');
for(let i=0;i<7;i++){s.time+=.02;e.updateEntities(s,.02,{},0,false);}if(pedestrian.hp>=45)throw Error('bullet impact');report.push('combat + fleeing');
s.time=100;s.spawnAt=0;e.player.wanted=2;e.updateEntities(s,.016,{},0,false);if(!e.cars.some(c=>c.type==='police'))throw Error('police did not spawn');
for(let i=e.cars.length-1;i>=0;i--)if(e.cars[i].type==='police')e.cars.splice(i,1);s.spawnAt=100000;e.player.wanted=1;e.player.heat=7.99;e.player.lastCrime=0;e.updateEntities(s,.02,{},0,false);if(e.player.wanted!==0)throw Error('hidden search did not decay');report.push('police response + hiding');
e.damage(200,s);if(!s.dead||e.player.hp!==0)throw Error('death');document.querySelector('#respawn').click();if(s.dead||e.player.hp!==100)throw Error('respawn');e.player.cash=250;report.push('health + respawn');
e.player.x=2700;e.player.y=1400;e.player.wanted=3;s.bust=3;e.createCar(2710,1400,0,'#eee','police');e.updateEntities(s,.016,{},0,false);if(!s.dead||document.querySelector('#deathTitle').textContent!=='BUSTED.')throw Error('busting');document.querySelector('#respawn').click();e.player.cash=250;report.push('arrest + bail');

e.player.x=e.targetCar.x;e.player.y=e.targetCar.y-30;e.enterExit(s);if(e.player.car!==e.targetCar)throw Error('mission vehicle entry');m.updateMissions(s,.016);if(m.story.step!==1)throw Error('mission pickup');report.push('carjacking + wanted');
e.targetCar.x=e.player.x=1500;e.targetCar.y=e.player.y=2100;for(const car of e.cars)if(car!==e.targetCar&&w.distance(car,e.targetCar)<250){car.x=300;car.y=100;car.parked=true;}const beforeX=e.targetCar.x;e.targetCar.a=0;e.updateEntities(s,.1,{KeyW:true},0,false);if(e.targetCar.speed<=0||e.targetCar.x<=beforeX)throw Error('driving acceleration');
const b=w.buildings[0];e.targetCar.x=b.x-26;e.targetCar.y=b.y+40;e.targetCar.a=0;e.targetCar.speed=250;const hp=e.targetCar.hp;e.updateEntities(s,.05,{},0,false);if(e.targetCar.hp>=hp)throw Error('crash damage');report.push('driving physics + crash');

e.player.x=e.targetCar.x=m.garage.x;e.player.y=e.targetCar.y=m.garage.y;e.targetCar.speed=0;m.updateMissions(s,.016);if(m.story.stage!==1||e.player.cash!==900)throw Error('first reward');report.push('mission 1 + reward');
e.player.x=m.escape.x;e.player.y=m.escape.y;m.updateMissions(s,.016);if(m.story.step!==1)throw Error('checkpoint');e.player.wanted=0;m.updateMissions(s,.016);if(m.story.stage!==2||e.player.cash!==1900)throw Error('getaway reward');report.push('mission 2 + escape');
for(const p of m.packages){e.player.x=p.x;e.player.y=p.y;m.updateMissions(s,.016);}if(m.story.done.length!==3)throw Error('package pickups');e.player.x=m.garage.x;e.player.y=m.garage.y;m.updateMissions(s,.016);if(m.story.stage!==3||e.player.cash!==4100)throw Error('final reward');report.push('mission 3 + finale');
m.takeCourier(s);if(!m.story.delivery)throw Error('courier not started');e.player.x=m.story.delivery.x;e.player.y=m.story.delivery.y;m.updateMissions(s,.016);if(e.player.cash!==4500||m.story.delivery!==null)throw Error('courier reward');report.push('repeat courier');
s.save();const saved=JSON.parse(localStorage.getItem('vice-harbor-save-v1'));if(saved.stage!==3||saved.cash!==4500)throw Error('save failed');report.push('local save');return report;})()`);
  console.log(result);
  // Pause must freeze the simulation, then resume. Save and continue must restore progress after a reload.
  await ev("document.querySelector('#resume').click()");
  let before = await ev("test.g.state.time");
  await wait(250);
  assert.equal(await ev("test.g.state.time"), before);
  await ev("document.querySelector('#resume').click()");
  await wait(100);
  assert.ok((await ev("test.g.state.time")) > before);
  console.log("pause/resume PASS");
  await call("Page.reload");
  await wait(500);
  assert.equal(
    await ev(
      "document.querySelector('#continue').classList.contains('hidden')",
    ),
    false,
  );
  await ev("document.querySelector('#continue').click()");
  await wait(100);
  let snap = JSON.parse(await ev("JSON.stringify(viceHarbor.snapshot())"));
  assert.equal(snap.story.stage, 3);
  assert.equal(snap.player.cash, 4500);
  console.log("continue PASS");
  assert.equal(errors.length, 0);
  assert.ok(
    requests.every(
      (u) => u.startsWith("http://localhost:18080/") || u.startsWith("data:"),
    ),
  );
  console.log(
    "runtime errors:",
    errors.length,
    "external requests:",
    requests.filter(
      (u) => !u.startsWith("http://localhost:18080/") && !u.startsWith("data:"),
    ).length,
  );
  // Fixtures live in a disposable browser profile.
  await ev("localStorage.removeItem('vice-harbor-save-v1')");
  ws.close();
} finally {
  chrome?.kill();
  server.kill();
  await new Promise((r) => setTimeout(r, 300));
  rmSync(profile, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
