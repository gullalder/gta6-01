import {
  W,
  H,
  mapCanvas,
  palms,
  props,
  district,
  roads,
  distance,
  clamp,
} from "./world.js";
import {
  cars,
  people,
  player,
  particles,
  bullets,
  pickups,
  targetCar,
} from "./entities.js";
import { story, missionMarker, garage, escape, packages } from "./missions.js";
export const canvas = document.querySelector("#world"),
  c = canvas.getContext("2d");
export const camera = { x: 2520, y: 1520, zoom: 0.9 };
export const view = { w: 1280, h: 800 };
export function resize() {
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  view.w = innerWidth;
  view.h = innerHeight;
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
}
addEventListener("resize", resize);
resize();
function inView(o, pad = 100) {
  return (
    Math.abs(o.x - camera.x) < view.w / camera.zoom / 2 + pad &&
    Math.abs(o.y - camera.y) < view.h / camera.zoom / 2 + pad
  );
}
function rounded(x, y, w, h, r, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function drawCar(car, time) {
  if (!inView(car)) return;
  c.save();
  c.translate(car.x, car.y);
  c.rotate(car.a);
  c.globalAlpha = car.hp <= 0 ? 0.65 : 1;
  rounded(-27 + 5, -15 + 7, 57, 31, 8, "#102b3366");
  for (let x of [-16, 15])
    for (let y of [-17, 12]) rounded(x - 5, y, 11, 5, 2, "#1f2d32");
  rounded(-30, -15, 61, 30, 6, car.hp <= 0 ? "#5c6260" : car.color);
  rounded(-27, -12, 52, 24, 4, car.color);
  c.fillStyle = "#fff3";
  c.fillRect(-24, -13, 46, 2);
  c.fillStyle = "#1b3c48";
  c.beginPath();
  c.moveTo(-17, -11);
  c.lineTo(8, -11);
  c.lineTo(14, -9);
  c.lineTo(14, 9);
  c.lineTo(8, 11);
  c.lineTo(-17, 11);
  c.closePath();
  c.fill();
  rounded(-11, -9, 17, 18, 3, car.color);
  c.fillStyle = "#a8d3cb77";
  c.fillRect(8, -8, 4, 16);
  c.fillStyle = "#c9e8dc55";
  c.fillRect(-17, -8, 4, 16);
  c.fillStyle = "#192e3455";
  c.fillRect(20, -11, 2, 22);
  c.fillStyle = "#ffeead";
  c.fillRect(27, -11, 4, 6);
  c.fillRect(27, 5, 4, 6);
  c.fillStyle = "#ee6d62";
  c.fillRect(-31, -11, 3, 5);
  c.fillRect(-31, 6, 3, 5);
  c.fillStyle = "#acc3bf";
  c.fillRect(-3, -18, 6, 4);
  c.fillRect(-3, 14, 6, 4);
  if (car.type === "police") {
    rounded(-12, -11, 19, 22, 2, "#e1e6d7");
    rounded(-8, -12, 7, 24, 2, "#29404c");
    c.fillStyle = Math.sin(time * 12) > 0 ? "#f9675c" : "#aadbe0";
    c.fillRect(-6, -13, 4, 11);
    c.fillStyle = Math.sin(time * 12) > 0 ? "#a8d3e9" : "#77b9ff";
    c.fillRect(-6, 2, 4, 11);
    if (player.wanted > 0) {
      c.globalAlpha = 0.13 + Math.sin(time * 12) * 0.05;
      c.fillStyle = Math.sin(time * 12) > 0 ? "#ff5a5a" : "#7db9ff";
      c.beginPath();
      c.arc(-4, 0, 65, 0, 7);
      c.fill();
      c.globalAlpha = 1;
    }
    c.save();
    c.rotate(Math.PI / 2);
    c.fillStyle = "#29404c";
    c.font = "bold 7px Arial";
    c.textAlign = "center";
    c.fillText("POLICE", 0, -16);
    c.restore();
  }
  if (car === targetCar) {
    c.strokeStyle = "#eedda677";
    c.lineWidth = 1;
    c.strokeRect(-24, -10, 46, 20);
  }
  if (Math.abs(car.speed) > 40) {
    c.globalAlpha = 0.07;
    c.fillStyle = "#fff5b5";
    c.beginPath();
    c.moveTo(31, -11);
    c.lineTo(135, -45);
    c.lineTo(135, 45);
    c.lineTo(31, 11);
    c.fill();
  }
  if (car.hp < 35) {
    c.globalAlpha = 0.4;
    c.fillStyle = "#35444b";
    c.beginPath();
    c.arc(20, -10, 9 + Math.sin(time * 4) * 3, 0, 7);
    c.fill();
  }
  c.restore();
}
function drawPerson(p, time, isPlayer = false) {
  if (!inView(p)) return;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(p.a);
  c.fillStyle = "#152c3444";
  c.beginPath();
  c.ellipse(6, 7, 8, 11, 0, 0, 7);
  c.fill();
  if (p.hp <= 0) {
    c.fillStyle = "#b9a78b";
    c.fillRect(-14, -5, 28, 10);
    c.restore();
    return;
  }
  let step = Math.sin(p.step || time * 8) * 2;
  c.fillStyle = "#263e49";
  c.fillRect(-7, -5 + step, 7, 4);
  c.fillRect(-7, 2 - step, 7, 4);
  rounded(-5, -9, 12, 18, 4, isPlayer ? "#e4d5b1" : p.color);
  c.fillStyle = "#b88868";
  c.beginPath();
  c.arc(2, 0, 5.5, 0, 7);
  c.fill();
  c.fillStyle = "#3c3931";
  c.beginPath();
  c.arc(0, 0, 4, -Math.PI / 2, Math.PI / 2);
  c.fill();
  if (isPlayer) {
    c.fillStyle = "#d5b595";
    c.fillRect(3, 5, 12, 4);
    c.fillStyle = "#2b3d46";
    c.fillRect(12, 4, 10, 4);
  }
  c.restore();
}
function drawPalm(p) {
  if (!inView(p, 80)) return;
  c.save();
  c.translate(p.x, p.y);
  c.scale(p.s, p.s);
  c.fillStyle = "#182d3340";
  c.beginPath();
  c.ellipse(20, 24, 32, 15, 0.5, 0, 7);
  c.fill();
  c.strokeStyle = "#ac9e72";
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(4, -8, 6, -13);
  c.stroke();
  for (let i = 0; i < 7; i++) {
    c.save();
    c.translate(6, -13);
    c.rotate((i * Math.PI * 2) / 7);
    c.fillStyle = i % 2 ? "#386c52" : "#568264";
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(20, -19, 43, 1);
    c.quadraticCurveTo(16, -2, 0, 0);
    c.fill();
    c.strokeStyle = "#b4bd6855";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(17, -9, 37, 0);
    c.stroke();
    c.restore();
  }
  c.restore();
}
function worldLabel(text, x, y, color = "#f6d18b") {
  c.save();
  c.textAlign = "center";
  c.font = "bold 10px Arial";
  let w = c.measureText(text).width + 24;
  rounded(x - w / 2, y - 15, w, 25, 3, "#15313ae6");
  c.fillStyle = color;
  c.fillText(text, x, y + 1);
  c.restore();
}
function beacon(p, time, label, color = "#f7d188") {
  if (!p || !inView(p)) return;
  c.save();
  c.translate(p.x, p.y);
  c.fillStyle = color + "16";
  c.beginPath();
  c.arc(0, 0, 45, 0, 7);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.setLineDash([9, 5]);
  c.beginPath();
  c.arc(0, 0, 33 + Math.sin(time * 3) * 4, 0, 7);
  c.stroke();
  c.setLineDash([]);
  c.translate(0, -50 - Math.sin(time * 3) * 4);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, 10);
  c.lineTo(-10, -4);
  c.lineTo(10, -4);
  c.fill();
  if (label) worldLabel(label, 0, -22, color);
  c.restore();
}
export function renderWorld(state) {
  const { w, h } = view;
  const ratio = canvas.width / w;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.fillStyle = "#218b94";
  c.fillRect(0, 0, w, h);
  c.save();
  c.translate(
    w / 2 + (Math.random() - 0.5) * state.shake,
    h / 2 + (Math.random() - 0.5) * state.shake,
  );
  c.scale(camera.zoom, camera.zoom);
  c.translate(-camera.x, -camera.y);
  c.drawImage(mapCanvas, 0, 0);
  // A moving line of surf and tiny wakes animate the coast without image assets.
  c.strokeStyle = "#e1eed399";
  c.lineWidth = 3;
  for (
    let y = Math.floor((camera.y - h / camera.zoom / 2) / 130) * 130;
    y < camera.y + h / camera.zoom / 2;
    y += 130
  ) {
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      let yy = y + k * 17,
        xx = 3011 + Math.sin(state.time * 0.6 + k * 0.9) * 6;
      if (k === 0) c.moveTo(xx, yy);
      else c.lineTo(xx, yy);
    }
    c.stroke();
  }
  for (let p of props)
    if (inView(p)) {
      if (p.t === 0) {
        rounded(p.x - 4, p.y - 10, 8, 20, 2, "#315851");
        rounded(p.x - 3, p.y - 9, 6, 4, 1, "#a9bf9b");
      } else if (p.t === 1) {
        c.fillStyle = "#746c55";
        c.fillRect(p.x - 4, p.y - 14, 8, 28);
        c.fillStyle = "#d4bd88";
        c.fillRect(p.x - 7, p.y - 13, 14, 26);
      } else {
        c.fillStyle = "#30484d";
        c.fillRect(p.x, p.y, 3, 22);
        c.fillStyle = "#ddc99a";
        c.beginPath();
        c.arc(p.x + 1, p.y, 5, 0, 7);
        c.fill();
      }
    }
  // Garage forecourt: a free repair and medical service.
  c.fillStyle = "#6bd3ac18";
  c.fillRect(2730, garage.y - 55, 80, 110);
  c.strokeStyle = "#8fd9b6";
  c.setLineDash([8, 5]);
  c.strokeRect(2730, garage.y - 55, 80, 110);
  c.setLineDash([]);
  worldLabel("MARA’S / REPAIR + AID", garage.x, garage.y + 80, "#9de0c3");
  for (let p of pickups)
    if (!p.taken && inView(p)) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(Math.sin(state.time) * 0.2);
      rounded(-10, -8, 20, 16, 2, "#d8bb72");
      c.fillStyle = "#466b60";
      c.fillRect(-3, -8, 6, 16);
      c.restore();
    }
  for (let car of cars) drawCar(car, state.time);
  for (let p of people) drawPerson(p, state.time);
  if (!player.car) {
    drawPerson(player, state.time, true);
    c.strokeStyle = "#f8dfa4aa";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(player.x, player.y, 15, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "#f8dfa44a";
    c.setLineDash([3, 6]);
    c.beginPath();
    c.moveTo(
      player.x + Math.cos(player.a) * 22,
      player.y + Math.sin(player.a) * 22,
    );
    c.lineTo(
      player.x + Math.cos(player.a) * 85,
      player.y + Math.sin(player.a) * 85,
    );
    c.stroke();
    c.setLineDash([]);
  }
  for (let b of bullets) {
    c.strokeStyle = b.enemy ? "#ff9c7d" : "#ffe7a9";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(b.x, b.y);
    c.lineTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018);
    c.stroke();
  }
  for (let p of particles) {
    c.globalAlpha = clamp(p.life * 2, 0, 1);
    c.fillStyle = p.color;
    c.fillRect(p.x, p.y, p.size, p.size);
  }
  c.globalAlpha = 1;
  for (let p of palms) drawPalm(p);
  let mark = missionMarker();
  beacon(
    mark,
    state.time,
    story.stage === 0 && story.step === 0
      ? "CORAL GT / E TO ENTER"
      : story.stage === 2 && story.done.length < 3
        ? "EVIDENCE DROP"
        : story.stage === 3 && !story.delivery
          ? "SAFEHOUSE"
          : "DESTINATION",
  );
  if (story.stage === 2)
    for (let i = 0; i < packages.length; i++)
      if (!story.done.includes(i) && packages[i] !== mark)
        beacon(packages[i], state.time, "EVIDENCE", "#8ddbc7");
  c.restore();
  // Golden-hour grade and subtle film texture are part of the live render.
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#ffbd7610");
  g.addColorStop(1, "#e2757a0a");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  if (state.started && !state.paused && !player.car) {
    const { x, y } = state.mouse;
    c.strokeStyle = "#fff9";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, 7, 0, 7);
    c.moveTo(x - 12, y);
    c.lineTo(x - 8, y);
    c.moveTo(x + 8, y);
    c.lineTo(x + 12, y);
    c.moveTo(x, y - 12);
    c.lineTo(x, y - 8);
    c.moveTo(x, y + 8);
    c.lineTo(x, y + 12);
    c.stroke();
  }
  const screenX = (mark.x - camera.x) * camera.zoom + w / 2,
    screenY = (mark.y - camera.y) * camera.zoom + h / 2;
  if (
    state.started &&
    (screenX < 25 || screenX > w - 25 || screenY < 25 || screenY > h - 25)
  ) {
    let a = Math.atan2(screenY - h / 2, screenX - w / 2),
      rx = (w / 2 - 55) / Math.max(0.001, Math.abs(Math.cos(a))),
      ry = (h / 2 - 70) / Math.max(0.001, Math.abs(Math.sin(a))),
      r = Math.min(rx, ry);
    c.save();
    c.translate(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
    c.rotate(a);
    c.fillStyle = "#f6cf80";
    c.beginPath();
    c.moveTo(14, 0);
    c.lineTo(-8, -9);
    c.lineTo(-8, 9);
    c.fill();
    c.restore();
  }
}
const mini = document.querySelector("#minimap"),
  m = mini.getContext("2d");
export function drawMinimap(state) {
  m.fillStyle = "#153c43";
  m.fillRect(0, 0, 220, 190);
  const sx = 220 / W,
    sy = 190 / H;
  m.fillStyle = "#5e8275";
  m.fillRect(4, 3, 3000 * sx, 3500 * sy);
  m.fillStyle = "#d4c699";
  m.fillRect(2840 * sx, 3, 180 * sx, 3500 * sy);
  m.strokeStyle = "#c4c5a299";
  m.lineWidth = 3;
  for (let r of roads) {
    m.beginPath();
    m.moveTo(4, r * sy);
    m.lineTo(2840 * sx, r * sy);
    m.stroke();
    if (r < 3000) {
      m.beginPath();
      m.moveTo(r * sx, 3);
      m.lineTo(r * sx, 187);
      m.stroke();
    }
  }
  let mark = missionMarker();
  m.strokeStyle = "#f4d184";
  m.lineWidth = 1.5;
  m.setLineDash([3, 4]);
  m.beginPath();
  m.moveTo(player.x * sx, player.y * sy);
  m.lineTo(mark.x * sx, mark.y * sy);
  m.stroke();
  m.setLineDash([]);
  for (let car of cars)
    if (car.type === "police" && player.wanted > 0) {
      m.fillStyle = "#ff8077";
      m.beginPath();
      m.arc(car.x * sx, car.y * sy, 2.7, 0, 7);
      m.fill();
    }
  m.fillStyle = "#f4d184";
  m.save();
  m.translate(mark.x * sx, mark.y * sy);
  m.rotate(Math.PI / 4);
  m.fillRect(-4, -4, 8, 8);
  m.restore();
  m.fillStyle = "#a3e7c8";
  m.fillRect(garage.x * sx - 2, garage.y * sy - 2, 5, 5);
  if (story.stage === 2)
    for (let i = 0; i < packages.length; i++)
      if (!story.done.includes(i)) {
        m.fillStyle = "#94e2cf";
        m.fillRect(packages[i].x * sx - 2, packages[i].y * sy - 2, 5, 5);
      }
  m.save();
  m.translate(player.x * sx, player.y * sy);
  m.rotate(player.a);
  m.fillStyle = "#fff9df";
  m.strokeStyle = "#15363b";
  m.lineWidth = 2;
  m.beginPath();
  m.moveTo(7, 0);
  m.lineTo(-5, -4);
  m.lineTo(-3, 0);
  m.lineTo(-5, 4);
  m.closePath();
  m.stroke();
  m.fill();
  m.restore();
  m.fillStyle = "#c6d0b1";
  m.font = "7px Arial";
  m.fillText("CYPRESS", 15, 57);
  m.fillText("DOWNTOWN", 88, 80);
  m.fillText("DOCKS", 90, 177);
  m.save();
  m.translate(204, 104);
  m.rotate(-Math.PI / 2);
  m.fillText("LEON OCEAN", 0, 0);
  m.restore();
}

export function drawCityMap() {
  const large = document.querySelector("#cityMapCanvas"),
    ctx = large.getContext("2d"),
    s = 0.16,
    ox = 162,
    oy = 22;
  ctx.fillStyle = "#143640";
  ctx.fillRect(0, 0, 900, 620);
  ctx.drawImage(mapCanvas, ox, oy, 576, 576);
  const point = (o) => ({ x: ox + o.x * s, y: oy + o.y * s });
  const mark = point(missionMarker()),
    p = point(player);
  ctx.strokeStyle = "#f4d184";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(mark.x, mark.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = "center";
  ctx.font = "bold 12px Arial";
  for (const [label, x, y] of [
    ["CYPRESS HEIGHTS", 600, 170],
    ["DOWNTOWN", 1730, 180],
    ["PALM STRIP", 2680, 180],
    ["PORT MERIDIAN", 1660, 3500],
  ]) {
    ctx.fillStyle = "#142e38bb";
    ctx.fillRect(ox + x * s - 85, oy + y * s - 15, 170, 24);
    ctx.fillStyle = "#fff0c3";
    ctx.fillText(label, ox + x * s, oy + y * s + 1);
  }
  for (const car of cars)
    if (car.type === "police" && player.wanted > 0) {
      const a = point(car);
      ctx.fillStyle = "#ff8077";
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4, 0, 7);
      ctx.fill();
    }
  ctx.save();
  ctx.translate(mark.x, mark.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#f6cf80";
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();
  const g = point(garage);
  ctx.fillStyle = "#a1e7cc";
  ctx.font = "bold 22px Arial";
  ctx.fillText("+", g.x, g.y + 6);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(player.a);
  ctx.fillStyle = "#fff8db";
  ctx.strokeStyle = "#132e36";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(-7, -6);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-7, 6);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#9ec7c0";
  ctx.font = "10px Arial";
  ctx.fillText("N", 805, 70);
  ctx.beginPath();
  ctx.moveTo(805, 83);
  ctx.lineTo(805, 113);
  ctx.strokeStyle = "#9ec7c0";
  ctx.stroke();
  ctx.fillText("↑", 805, 91);
  ctx.save();
  ctx.translate(805, 320);
  ctx.rotate(-Math.PI / 2);
  ctx.font = "italic 20px Arial";
  ctx.fillText("L E O N   O C E A N", 0, 0);
  ctx.restore();
}
