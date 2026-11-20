export const W = 3600,
  H = 3600,
  coast = 3020;
export const roads = [300, 900, 1500, 2100, 2700, 3300];
export const buildings = [],
  palms = [],
  props = [];
let seed = 124813;
export function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function district(x, y) {
  return y > 2400
    ? "PORT MERIDIAN"
    : x > 2350
      ? "PALM STRIP"
      : x < 1100
        ? "CYPRESS HEIGHTS"
        : "DOWNTOWN";
}
const roofs = [
  "#a78f76",
  "#c5b49a",
  "#d2bda4",
  "#78959a",
  "#8c9a92",
  "#b78d77",
];
for (let ix = 0; ix < 5; ix++)
  for (let iy = 0; iy < 6; iy++) {
    const x = roads[ix] + 105,
      y = roads[iy] + 105,
      bw = 385,
      bh = 385;
    if (iy === 5) continue;
    if (ix === 4 && iy === 4) continue; // Open working quay beneath the port cranes.
    if (ix === 4) {
      buildings.push({
        x: x + 20,
        y: y + 20,
        w: 195,
        h: 120,
        c: "#e6baa1",
        name:
          iy === 1 ? "THE MIRAGE" : iy === 2 ? "SOLARIS HOTEL" : "OCEAN CLUB",
        t: 2,
      });
      buildings.push({
        x: x + 25,
        y: y + 200,
        w: 190,
        h: 125,
        c: "#c3ba9f",
        name: iy === 2 ? "MARA’S GARAGE" : "",
        t: 2,
      });
      continue;
    }
    if (ix === 0 && iy === 1) {
      props.push({ x: x + 100, y: y + 300, t: 1 });
      continue;
    }
    if (ix === 0) {
      for (let a = 0; a < 2; a++)
        for (let b = 0; b < 2; b++)
          buildings.push({
            x: x + a * 195 + 20,
            y: y + b * 190 + 20,
            w: 125,
            h: 105,
            c: roofs[Math.floor(rand() * 3)],
            name: "",
            t: 0,
          });
    } else if (iy === 4) {
      buildings.push({
        x,
        y,
        w: bw,
        h: 145,
        c: "#789096",
        name: "MERIDIAN FREIGHT",
        t: 3,
      });
      buildings.push({
        x,
        y: y + 215,
        w: bw,
        h: 135,
        c: "#8d9d94",
        name: "WAREHOUSE " + (ix + 1),
        t: 3,
      });
    } else {
      buildings.push({
        x,
        y,
        w: 165,
        h: bh,
        c: roofs[Math.floor(rand() * 6)],
        name: ix === 2 && iy === 2 ? "HARBOR TRUST" : "",
        t: 1,
      });
      buildings.push({
        x: x + 215,
        y,
        w: 170,
        h: 170,
        c: roofs[Math.floor(rand() * 6)],
        name: ix === 3 && iy === 1 ? "SUNSET PLAZA" : "",
        t: 1,
      });
      buildings.push({
        x: x + 215,
        y: y + 220,
        w: 170,
        h: 165,
        c: roofs[Math.floor(rand() * 6)],
        name: "",
        t: 1,
      });
    }
  }
for (let y = 180; y < 3450; y += 135) {
  const beachPalm = { x: 2920 + rand() * 25, y, s: 0.8 + rand() * 0.4 };
  if (y < 2450) palms.push(beachPalm);
  if (y % 2 < 1) palms.push({ x: 2620, y: y + 50, s: 1 });
}
for (let r of roads.slice(0, 5))
  for (let y = 160; y < 3450; y += 180) {
    palms.push({ x: r - 85, y: y + rand() * 45, s: 0.65 + rand() * 0.3 });
  }
for (let i = 0; i < 90; i++) {
  const r = roads[Math.floor(rand() * 5)];
  props.push({ x: r + 72, y: 140 + rand() * 3100, t: Math.floor(rand() * 3) });
}
export function solid(x, y, r = 12) {
  if (x < 65 || y < 65 || x > 2975 || y > 3520) return true;
  return buildings.some(
    (b) => x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h,
  );
}
export function moveBody(o, dx, dy, r = 12) {
  let hit = false;
  if (!solid(o.x + dx, o.y, r)) o.x += dx;
  else hit = true;
  if (!solid(o.x, o.y + dy, r)) o.y += dy;
  else hit = true;
  return hit;
}
export const mapCanvas = document.createElement("canvas");
mapCanvas.width = W;
mapCanvas.height = H;
const c = mapCanvas.getContext("2d");
function rect(x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function text(t, x, y, size = 13, col = "#e5d5b9") {
  c.fillStyle = col;
  c.font = `700 ${size}px Arial`;
  c.textAlign = "center";
  c.fillText(t, x, y);
}
export function buildCity() {
  rect(0, 0, W, H, "#218b94");
  for (let y = 0; y < H; y += 35) {
    c.strokeStyle = "#8cd2bf18";
    c.beginPath();
    for (let x = 2990; x < W; x += 15) {
      let yy = y + Math.sin(x * 0.018 + y) * 5;
      if (x === 2990) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
  }
  rect(50, 50, 2970, 3500, "#d4c49e");
  rect(65, 65, 2790, 3470, "#65877b");
  rect(2830, 50, 170, 3500, "#e3cda3");
  rect(2820, 50, 26, 3500, "#e7d9b8");
  for (let r of roads) {
    rect(65, r - 65, 2770, 130, "#aaa998");
    rect(65, r - 50, 2770, 100, "#435057");
    if (r < 3000) {
      rect(r - 65, 65, 130, 3470, "#aaa998");
      rect(r - 50, 65, 100, 3470, "#435057");
    }
  }
  for (let r of roads) {
    c.strokeStyle = "#e6ce8499";
    c.lineWidth = 2;
    c.setLineDash([22, 22]);
    c.beginPath();
    c.moveTo(70, r);
    c.lineTo(2835, r);
    c.stroke();
    if (r < 3000) {
      c.beginPath();
      c.moveTo(r, 65);
      c.lineTo(r, 3530);
      c.stroke();
    }
    c.setLineDash([]);
  }
  for (let x of roads.slice(0, 5))
    for (let y of roads) {
      rect(x - 51, y - 51, 102, 102, "#435057");
      for (let i = -40; i < 43; i += 14) {
        rect(x + i, y - 79, 7, 24, "#e2dcca");
        rect(x + i, y + 55, 7, 24, "#e2dcca");
        rect(x - 79, y + i, 24, 7, "#e2dcca");
        rect(x + 55, y + i, 24, 7, "#e2dcca");
      }
      for (let a of [-1, 1]) {
        rect(x + a * 60 - 3, y - 62, 6, 14, "#e5c285");
        rect(x - 62, y + a * 60 - 3, 14, 6, "#e5c285");
      }
    }
  for (let b of buildings) {
    rect(b.x + 14, b.y + 20, b.w, b.h, "#233b3e55");
    rect(b.x - 4, b.y - 4, b.w + 8, b.h + 8, "#3f5f59");
    rect(b.x, b.y, b.w, b.h, b.c);
    rect(b.x + 8, b.y + 8, b.w - 16, b.h - 16, b.c);
    c.strokeStyle = "#fff5";
    c.lineWidth = 3;
    c.strokeRect(b.x + 9, b.y + 9, b.w - 18, b.h - 18);
    if (b.t === 0) {
      rect(b.x + 16, b.y + 14, b.w - 32, b.h - 28, "#b27762");
      rect(b.x + 21, b.y + 19, b.w - 42, b.h - 38, "#c18b70");
      rect(b.x + b.w / 2 - 2, b.y + 17, 4, b.h - 34, "#dfb18b");
      rect(b.x - 1, b.y + b.h + 15, b.w + 1, 20, "#9ea18a");
    } else {
      for (let x = b.x + 20; x < b.x + b.w - 25; x += 38)
        for (let y = b.y + 20; y < b.y + b.h - 20; y += 42) {
          rect(x, y, 20, 11, "#4a6d7166");
          rect(x, y, 20, 3, "#e4dac066");
        }
      rect(b.x + 22, b.y + 25, 40, 30, "#64797b");
      rect(b.x + 26, b.y + 29, 32, 20, "#819599");
      for (let j = 0; j < 4; j++)
        rect(b.x + 29, b.y + 32 + j * 4, 26, 1, "#44585c");
    }
    if (b.t === 2) {
      rect(b.x + b.w + 15, b.y + 20, 72, 94, "#e5ddc4");
      rect(b.x + b.w + 21, b.y + 26, 60, 82, "#4cc6c3");
      for (let j = 0; j < 3; j++) {
        rect(b.x + b.w + 28, b.y + 36 + j * 24, 44, 2, "#b0ece0");
      }
      for (let j = 0; j < 4; j++)
        rect(b.x + 20 + j * 40, b.y + b.h + 14, 22, 8, "#f1dcb4");
    }
    if (b.name) {
      c.save();
      c.translate(b.x + b.w / 2, b.y + b.h / 2 + 5);
      if (b.w < 200 && b.h > 250) c.rotate(-Math.PI / 2);
      text(b.name, 0, 0, b.name.length > 14 ? 11 : 14, "#223e42aa");
      c.restore();
    }
  }

  // Cypress Commons: paths, fountain, tennis and neighborhood recreation.
  rect(405, 1005, 385, 385, "#789a76");
  rect(420, 1018, 355, 18, "#c8bd94");
  rect(420, 1358, 355, 18, "#c8bd94");
  rect(581, 1025, 22, 335, "#c8bd94");
  rect(425, 1060, 135, 240, "#bbaa83");
  rect(432, 1067, 121, 226, "#559593");
  c.strokeStyle = "#e0debd";
  c.lineWidth = 2;
  c.strokeRect(442, 1078, 101, 204);
  c.strokeRect(452, 1078, 81, 204);
  c.beginPath();
  c.moveTo(442, 1180);
  c.lineTo(543, 1180);
  c.moveTo(451, 1130);
  c.lineTo(534, 1130);
  c.moveTo(451, 1230);
  c.lineTo(534, 1230);
  c.moveTo(492, 1130);
  c.lineTo(492, 1230);
  c.stroke();
  rect(431, 1178, 123, 3, "#ece7cd");
  c.fillStyle = "#d5c6a0";
  c.beginPath();
  c.arc(687, 1145, 62, 0, 7);
  c.fill();
  c.fillStyle = "#5eada7";
  c.beginPath();
  c.arc(687, 1145, 45, 0, 7);
  c.fill();
  c.strokeStyle = "#a1ded0";
  c.lineWidth = 5;
  c.beginPath();
  c.arc(687, 1145, 31, 0, 7);
  c.stroke();
  c.fillStyle = "#cbd8c0";
  c.beginPath();
  c.arc(687, 1145, 10, 0, 7);
  c.fill();
  text("CYPRESS COMMONS", 679, 1320, 11, "#31584b");
  // Shade trees, parking bays and rooftop details distinguish the blocks.
  for (let b of buildings) {
    if (b.t === 0) {
      for (let n = 0; n < 2; n++) {
        let xx = b.x + 20 + n * 70,
          yy = b.y + b.h + 50;
        rect(xx + 7, yy + 6, 24, 22, "#203f3c33");
        c.fillStyle = "#477457";
        c.beginPath();
        c.arc(xx, yy, 15, 0, 7);
        c.fill();
        c.fillStyle = "#678c60";
        c.beginPath();
        c.arc(xx - 4, yy - 4, 10, 0, 7);
        c.fill();
      }
    }
    if (b.t === 3) {
      for (let j = 0; j < 6; j++) {
        rect(b.x + 20 + j * 57, b.y + b.h + 7, 38, 26, "#8a9b94");
        c.strokeStyle = "#e5d4a7";
        c.lineWidth = 1;
        c.strokeRect(b.x + 20 + j * 57, b.y + b.h + 7, 38, 26);
      }
      rect(b.x + 20, b.y + 10, b.w - 40, 7, "#d1d6c2");
    }
  }
  // Paved wharf and customs shed keep freight handling separate from the hotels.
  rect(2804, 2700, 180, 780, "#aaa88e");
  for (let y = 2760; y < 3450; y += 70) {
    rect(2814, y, 45, 22, "#718c86");
    rect(2818, y + 3, 37, 2, "#a9bcaa");
  }
  text("MERIDIAN / QUAY 04", 2890, 3400, 10, "#34534f");
  // Port cranes with diagonal trusses, all original geometry.
  for (let y of [2780, 3000, 3220]) {
    rect(2860, y, 15, 110, "#ccaa67");
    rect(2860, y + 12, 220, 13, "#d7b66d");
    rect(3068, y + 15, 3, 60, "#43585b");
    rect(3057, y + 70, 24, 9, "#475d5d");
    c.strokeStyle = "#8e7c57";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(2869, y + 110);
    c.lineTo(2940, y + 19);
    c.lineTo(2869, y + 40);
    c.stroke();
    rect(2849, y + 75, 36, 32, "#687e7b");
    rect(2854, y + 78, 26, 12, "#99bbb1");
  }
  // Marina piers, beach cabanas and freight stacks.
  for (let y = 2550; y < 3380; y += 220) {
    rect(2980, y, 460, 42, "#a98e69");
    rect(2980, y + 4, 460, 3, "#e2bd8a");
    for (let x = 3050; x < 3410; x += 90) {
      rect(x, y + 42, 8, 65, "#bc9d73");
      c.save();
      c.translate(x + 22, y + 77);
      c.rotate(0.08);
      rect(-11, -27, 22, 54, "#e8e2cd");
      rect(-7, -12, 14, 25, "#577e88");
      c.restore();
    }
  }
  for (let y = 170; y < 2400; y += 190) {
    rect(2925, y, 28, 28, "#e9a78a");
    c.fillStyle = y % 3 ? "#edc584" : "#d9e3c6";
    c.beginPath();
    c.arc(2939, y + 14, 23, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#fff5";
    c.beginPath();
    c.moveTo(2916, y + 14);
    c.lineTo(2962, y + 14);
    c.stroke();
  }
  for (let i = 0; i < 30; i++) {
    let x = 1130 + (i % 10) * 145,
      y = 3150 + Math.floor(i / 10) * 46;
    rect(x + 5, y + 6, 110, 32, "#283d4255");
    rect(x, y, 110, 32, ["#c27e5c", "#698e93", "#bfaa71"][i % 3]);
    for (let j = 8; j < 108; j += 10) rect(x + j, y + 2, 2, 28, "#ffffff22");
  }
  c.save();
  c.translate(2700, 1240);
  c.rotate(-Math.PI / 2);
  text("O C E A N   A V E N U E", 0, 0, 13, "#e4ddbf80");
  c.restore();
  text("M E R I D I A N   D R I V E", 1730, 3306, 13, "#e4ddbf80");
  text("C Y P R E S S   B O U L E V A R D", 1500, 906, 13, "#e4ddbf80");
}
buildCity();
