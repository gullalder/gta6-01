import { roads, rand, solid, moveBody, distance, clamp } from "./world.js";
import { sound } from "./audio.js";
export const cars = [],
  people = [],
  particles = [],
  bullets = [],
  pickups = [];
export const player = {
  x: 2770,
  y: 1440,
  a: Math.PI / 2,
  hp: 100,
  car: null,
  cash: 250,
  wanted: 0,
  heat: 0,
  lastCrime: -100,
  shot: 0,
  invulnerable: 0,
};
export const colors = [
  "#d27b65",
  "#ddbd69",
  "#81aaa5",
  "#b9c5bc",
  "#547b91",
  "#e4d9bd",
  "#a493b2",
];
export function createCar(
  x,
  y,
  a = 0,
  color = colors[Math.floor(rand() * colors.length)],
  type = "civilian",
) {
  const car = {
    x,
    y,
    a,
    color,
    type,
    speed: 0,
    hp: 100,
    parked: false,
    turn: 0,
    cool: 0,
    stuck: 0,
    name: type === "police" ? "HCPD / INTERCEPTOR" : "SOLSTICE / SABLE",
  };
  cars.push(car);
  return car;
}
export const targetCar = createCar(
  2724,
  1535,
  Math.PI / 2,
  "#e58e75",
  "target",
);
targetCar.parked = true;
targetCar.name = "SOLSTICE / CORAL GT";
for (let i = 0; i < 38; i++) {
  let vertical = i % 2 === 0,
    r = roads[Math.floor(rand() * 5)],
    pos = 180 + rand() * 3060,
    dir = i % 4 < 2 ? 1 : -1;
  let o = createCar(
    vertical ? r + dir * 23 : pos,
    vertical ? pos : r + dir * 23,
    vertical ? (dir * Math.PI) / 2 : dir > 0 ? Math.PI : 0,
  );
  o.speed = 65 + rand() * 50;
  o.vertical = vertical;
}
for (let i = 0; i < 24; i++) {
  let x = roads[i % 5] + 72,
    y = 450 + Math.floor(i / 5) * 600 + rand() * 180;
  if (!solid(x, y, 25)) {
    let o = createCar(x, y, Math.PI / 2);
    o.parked = true;
  }
}
for (let i = 0; i < 100; i++) {
  let x = roads[i % 5] + (i % 2 ? 1 : -1) * 79,
    y = 100 + rand() * 3300;
  if (!solid(x, y, 8))
    people.push({
      x,
      y,
      a: Math.PI / 2,
      dir: i % 3 ? 1 : -1,
      speed: 20 + rand() * 19,
      flee: 0,
      hp: 45,
      color: ["#e4c7a1", "#e1a38a", "#7ac0b2", "#d3ba67", "#a3b6c8"][i % 5],
      step: rand() * 6,
    });
}
export function burst(x, y, color, n = 10, force = 90) {
  for (let i = 0; i < n; i++) {
    let a = rand() * 7,
      s = rand() * force;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.3 + rand() * 0.6,
      max: 1,
      color,
      size: 2 + rand() * 3,
    });
  }
}
export function crime(stars, time) {
  player.wanted = Math.min(
    5,
    Math.max(stars, player.wanted + (stars >= 2 ? 0.55 : 0.25)),
  );
  player.lastCrime = time;
  player.heat = 0;
}
export function damage(n, state) {
  if (player.invulnerable > 0) return;
  player.hp -= n;
  state.shake = Math.max(state.shake, n * 0.5);
  if (player.hp <= 0) {
    player.hp = 0;
    state.die(
      "FLATLINED.",
      "Emergency care costs $150. Mara will keep your place in the story.",
    );
  }
}
export function enterExit(state) {
  if (player.car) {
    const car = player.car;
    if (Math.abs(car.speed) > 105) {
      state.toast("Slow down before getting out.");
      return;
    }
    let side = {
      x: car.x + Math.cos(car.a + Math.PI / 2) * 38,
      y: car.y + Math.sin(car.a + Math.PI / 2) * 38,
    };
    if (solid(side.x, side.y, 12)) {
      side = {
        x: car.x - Math.cos(car.a + Math.PI / 2) * 38,
        y: car.y - Math.sin(car.a + Math.PI / 2) * 38,
      };
    }
    if (solid(side.x, side.y, 12)) {
      state.toast("The door is blocked.");
      return;
    }
    player.x = side.x;
    player.y = side.y;
    car.speed = 0;
    car.parked = true;
    player.car = null;
    state.toast("On foot · aim with mouse, click to fire");
    return;
  }
  let near =
    targetCar.hp > 0 && distance(targetCar, player) < 68
      ? targetCar
      : cars
          .filter((o) => o.hp > 0 && distance(o, player) < 65)
          .sort((a, b) => distance(a, player) - distance(b, player))[0];
  if (near) {
    player.car = near;
    near.parked = false;
    crime(near.type === "police" ? 2 : 1, state.time);
    state.toast(
      near.type === "target"
        ? "Coral GT acquired. Get it to Mara."
        : "Vehicle taken · police notified",
    );
    sound("pickup");
    burst(near.x, near.y, "#eaca86", 5);
  }
}
// Oriented boxes let cars pass in adjacent lanes without false circular impacts.
function carsOverlap(a, b) {
  if (distance(a, b) > 64) return false;
  for (const axis of [a.a, a.a + Math.PI / 2, b.a, b.a + Math.PI / 2]) {
    const gap = Math.abs(
      (b.x - a.x) * Math.cos(axis) + (b.y - a.y) * Math.sin(axis),
    );
    const extent = (o) =>
      28 * Math.abs(Math.cos(axis - o.a)) + 14 * Math.abs(Math.sin(axis - o.a));
    if (gap > extent(a) + extent(b)) return false;
  }
  return true;
}
function angleDelta(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
export function fire(state, aim) {
  if (player.shot > 0) return;
  player.shot = 0.2;
  player.a = aim;
  let x = player.x + Math.cos(aim) * 18,
    y = player.y + Math.sin(aim) * 18;
  bullets.push({
    x,
    y,
    vx: Math.cos(aim) * 950,
    vy: Math.sin(aim) * 950,
    life: 0.75,
    enemy: false,
  });
  burst(x, y, "#ffe3a4", 5, 100);
  sound("shot");
  crime(2, state.time);
  for (let p of people) if (distance(p, player) < 220) p.flee = 5;
}
function visible(a, b) {
  const d = distance(a, b),
    n = Math.ceil(d / 45);
  for (let i = 1; i < n; i++)
    if (solid(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, 3))
      return false;
  return true;
}
function policeResponse(state, dt) {
  const active = cars.filter((o) => o.type === "police" && o.hp > 0);
  let nearby = active.some(
    (o) => distance(o, player) < 600 && visible(o, player),
  );
  if (
    player.wanted > 0 &&
    state.time > state.spawnAt &&
    active.length < Math.ceil(player.wanted) + 1
  ) {
    let angle = rand() * Math.PI * 2,
      x = clamp(player.x + Math.cos(angle) * 730, 100, 2850),
      y = clamp(player.y + Math.sin(angle) * 730, 100, 3450);
    let road = roads
      .slice(0, 5)
      .reduce((a, b) => (Math.abs(x - a) < Math.abs(x - b) ? a : b));
    x = road + 23;
    if (solid(x, y, 24))
      y =
        roads.reduce((a, b) => (Math.abs(y - a) < Math.abs(y - b) ? a : b)) +
        23;
    const car = createCar(
      x,
      y,
      Math.atan2(player.y - y, player.x - x),
      "#e2e7d6",
      "police",
    );
    car.speed = 120;
    state.spawnAt = state.time + 5;
  }
  if (player.wanted > 0) {
    let hidden = !nearby && state.time - player.lastCrime > 10;
    player.heat = hidden
      ? player.heat + dt
      : Math.max(0, player.heat - dt * 0.5);
    if (player.heat > 8) {
      player.wanted = Math.max(0, player.wanted - 1);
      player.heat = 0;
      if (player.wanted === 0) {
        state.toast("SEARCH CALLED OFF · You lost the heat");
        for (let o of active) {
          o.type = "civilian";
          o.color = "#7d9195";
          o.parked = false;
          o.speed = 65;
        }
        sound("reward");
      }
    }
    if (
      nearby &&
      Math.floor(state.time * 2) % 5 === 0 &&
      state.time - state.sirenAt > 0.8
    ) {
      state.sirenAt = state.time;
      sound("siren");
    }
  }
}
export function updateEntities(state, dt, keys, aim, mouseDown) {
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.shot = Math.max(0, player.shot - dt);
  if (player.car) {
    const car = player.car;
    let thrust =
        (keys.KeyW || keys.ArrowUp ? 1 : 0) -
        (keys.KeyS || keys.ArrowDown ? 1 : 0),
      steer =
        (keys.KeyD || keys.ArrowRight ? 1 : 0) -
        (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    car.speed += thrust * 235 * dt;
    car.speed *= Math.pow(
      keys.ShiftLeft || keys.Space ? 0.955 : 0.991,
      dt * 60,
    );
    car.speed = clamp(car.speed, -120, keys.ShiftLeft ? 240 : 380);
    car.a +=
      steer *
      2.25 *
      dt *
      clamp(Math.abs(car.speed) / 90, 0, 1) *
      (car.speed < 0 ? -1 : 1);
    let hit = moveBody(
      car,
      Math.cos(car.a) * car.speed * dt,
      Math.sin(car.a) * car.speed * dt,
      23,
    );
    if (hit && Math.abs(car.speed) > 30) {
      let impact = Math.abs(car.speed);
      burst(car.x, car.y, "#f9ce7b", 15, 150);
      sound("crash");
      damage(impact * 0.025, state);
      car.hp -= impact * 0.055;
      car.speed *= -0.35;
      state.shake = impact * 0.035;
    }
    player.x = car.x;
    player.y = car.y;
    player.a = car.a;
    if (car.hp <= 0) {
      burst(car.x, car.y, "#e39459", 40, 180);
      player.car = null;
      car.parked = true;
      car.speed = 0;
      damage(35, state);
      player.invulnerable = 2;
      state.toast("Vehicle wrecked · find another ride");
    }
  } else {
    let dx =
        (keys.KeyD || keys.ArrowRight ? 1 : 0) -
        (keys.KeyA || keys.ArrowLeft ? 1 : 0),
      dy =
        (keys.KeyS || keys.ArrowDown ? 1 : 0) -
        (keys.KeyW || keys.ArrowUp ? 1 : 0);
    let n = Math.hypot(dx, dy) || 1,
      speed = keys.ShiftLeft ? 240 : 140;
    moveBody(player, (dx / n) * speed * dt, (dy / n) * speed * dt, 10);
    player.a = aim;
  }
  if (mouseDown && !player.car) fire(state, aim);
  for (let car of cars) {
    if (car === player.car || car.hp <= 0) continue;
    car.cool = Math.max(0, car.cool - dt);
    if (car.type === "police" && player.wanted > 0) {
      let d = distance(car, player);
      if (d < 650 && visible(car, player))
        car.lastSeen = { x: player.x, y: player.y };
      const chase = car.lastSeen || player;
      let desired = Math.atan2(chase.y - car.y, chase.x - car.x);
      if (distance(car, chase) < 80 && d > 250)
        desired += Math.sin(state.time) * 1.5;
      car.a += clamp(angleDelta(desired, car.a), -2.3 * dt, 2.3 * dt);
      car.speed +=
        ((d > 130 ? 195 + player.wanted * 20 : 90) - car.speed) * dt * 2;
      let hit = moveBody(
        car,
        Math.cos(car.a) * car.speed * dt,
        Math.sin(car.a) * car.speed * dt,
        22,
      );
      if (hit) {
        car.stuck += dt;
        car.a += dt * 2.7;
        car.speed = 55;
        if (car.stuck > 2.5) {
          let r = roads
            .slice(0, 5)
            .reduce((a, b) =>
              Math.abs(car.x - a) < Math.abs(car.x - b) ? a : b,
            );
          car.x = r + 23;
          car.stuck = 0;
        }
      } else car.stuck = 0;
      if (d < 300 && visible(car, player) && !player.car && car.cool === 0) {
        car.cool = 1.1;
        let a = desired;
        bullets.push({
          x: car.x,
          y: car.y,
          vx: Math.cos(a) * 400,
          vy: Math.sin(a) * 400,
          life: 1,
          enemy: true,
        });
        burst(car.x, car.y, "#e9b66b", 3);
      }
      if (d < 48) {
        if (!player.car) {
          state.bust += dt;
          if (state.bust > 2.5)
            state.die(
              "BUSTED.",
              "Released on $200 bail. Your story continues at Mara’s safehouse.",
            );
        } else {
          damage(dt * 2.5, state);
        }
      }
    } else if (!car.parked) {
      // Follow connected grid lanes, choosing a ninety-degree turn at intersections.
      let ahead = cars.some(
        (o) =>
          o !== car &&
          o.hp > 0 &&
          distance(o, car) < 72 &&
          Math.abs(angleDelta(Math.atan2(o.y - car.y, o.x - car.x), car.a)) <
            0.5,
      );
      car.speed += ((ahead ? 0 : 90) - car.speed) * dt * 2;
      let horizontal = Math.abs(Math.cos(car.a)) > 0.7,
        along = horizontal ? car.x : car.y;
      let r = roads.slice(0, 5).find((v) => Math.abs(along - v) < 7);
      if (r !== undefined && state.time - car.turn > 3 && rand() < 0.025) {
        let sign = rand() < 0.5 ? -1 : 1;
        car.a += (sign * Math.PI) / 2;
        car.a = (Math.round(car.a / (Math.PI / 2)) * Math.PI) / 2;
        car.turn = state.time;
        if (Math.abs(Math.cos(car.a)) > 0.7)
          car.y = r - Math.sign(Math.cos(car.a)) * 23;
        else car.x = r + Math.sign(Math.sin(car.a)) * 23;
      }
      const hit = moveBody(
        car,
        Math.cos(car.a) * car.speed * dt,
        Math.sin(car.a) * car.speed * dt,
        20,
      );
      if (hit) {
        car.a += Math.PI;
        car.speed = 40;
      }
    }
    if (
      !player.car &&
      distance(car, player) < 22 &&
      Math.abs(car.speed) > 55 &&
      car.cool === 0
    ) {
      car.cool = 1;
      damage(14, state);
      burst(player.x, player.y, "#e4bf97", 10);
      player.invulnerable = 0.8;
    }
    if (player.car && carsOverlap(car, player.car) && car.cool === 0) {
      car.cool = 0.8;
      const own = player.car;
      let v = Math.hypot(
        own.speed * Math.cos(own.a) - car.speed * Math.cos(car.a),
        own.speed * Math.sin(own.a) - car.speed * Math.sin(car.a),
      );
      const front =
        (car.x - own.x) * Math.cos(own.a) + (car.y - own.y) * Math.sin(own.a);
      own.speed *= front > 8 ? -0.18 : 0.85;
      car.speed = -20;
      burst(car.x, car.y, "#f9ce7b", 12);
      state.shake = 8;
      sound("crash");
      damage(v * 0.012, state);
      player.car.hp -= v * 0.025;
    }
  }
  state.bust = Math.max(0, state.bust - dt * 0.3);
  for (let p of people) {
    if (p.hp <= 0) continue;
    p.step += dt * (p.flee > 0 ? 16 : 5);
    p.flee = Math.max(0, p.flee - dt);
    if (
      player.car &&
      Math.abs(player.car.speed) > 60 &&
      distance(p, player) < 140
    )
      p.flee = 3;
    let speed = p.flee > 0 ? 105 : p.speed,
      a =
        p.flee > 0
          ? Math.atan2(p.y - player.y, p.x - player.x)
          : (p.dir * Math.PI) / 2;
    p.a = a;
    if (moveBody(p, Math.cos(a) * speed * dt, Math.sin(a) * speed * dt, 7)) {
      p.dir *= -1;
      p.y = clamp(p.y, 90, 3460);
    }
    if (
      player.car &&
      Math.abs(player.car.speed) > 55 &&
      distance(player.car, p) < 27
    ) {
      p.hp = 0;
      burst(p.x, p.y, "#e4bc8d", 14);
      crime(2, state.time);
      player.car.speed *= 0.8;
      state.toast("Civilian injured · witnesses called police");
    }
  }
  for (let b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (solid(b.x, b.y, 1)) {
      b.life = 0;
      burst(b.x, b.y, "#eed28c", 4);
    }
    if (b.enemy && distance(b, player) < (player.car ? 24 : 13)) {
      damage(player.car ? 4 : 9, state);
      b.life = 0;
      burst(b.x, b.y, "#e3ac88", 5);
    }
    if (!b.enemy && b.life > 0) {
      let p = people.find((p) => p.hp > 0 && distance(p, b) < 14);
      if (p) {
        p.hp -= 35;
        p.flee = 6;
        b.life = 0;
        burst(b.x, b.y, "#e3ac88", 7);
        crime(2, state.time);
      }
      let car = cars.find(
        (o) => o !== player.car && o.hp > 0 && distance(o, b) < 27,
      );
      if (car) {
        car.hp -= 17;
        b.life = 0;
        burst(b.x, b.y, "#f8d189", 7);
        if (car.type === "police") crime(3, state.time);
      }
    }
  }
  for (let i = bullets.length - 1; i >= 0; i--)
    if (bullets[i].life <= 0) bullets.splice(i, 1);
  for (let p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
  }
  for (let i = particles.length - 1; i >= 0; i--)
    if (particles[i].life <= 0) particles.splice(i, 1);
  policeResponse(state, dt);
  // Drop old patrols far away; retain a bounded population during long play sessions.
  for (let i = cars.length - 1; i >= 0; i--)
    if (
      cars[i].type === "police" &&
      distance(cars[i], player) > 1500 &&
      cars[i] !== player.car
    )
      cars.splice(i, 1);
  while (cars.length > 92) {
    let far = cars
      .filter(
        (o) => o !== player.car && o !== targetCar && o.type === "civilian",
      )
      .sort((a, b) => distance(b, player) - distance(a, player))[0];
    if (!far) break;
    cars.splice(cars.indexOf(far), 1);
  }
}
