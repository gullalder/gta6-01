import { clamp, distance, district, solid } from "./world.js";
import {
  player,
  cars,
  pickups,
  targetCar,
  enterExit,
  updateEntities,
  crime,
  burst,
} from "./entities.js";
import {
  story,
  titles,
  missionMarker,
  objectiveText,
  announceMission,
  updateMissions,
  restoreStory,
  takeCourier,
  garage,
} from "./missions.js";
import {
  canvas,
  camera,
  view,
  renderWorld,
  drawMinimap,
  drawCityMap,
} from "./render.js";
import { unlockAudio, toggleSound, sound } from "./audio.js";
const $ = (s) => document.querySelector(s),
  keys = {};
export const state = {
  time: 0,
  started: false,
  paused: false,
  mapOpen: false,
  dead: false,
  shake: 0,
  spawnAt: 0,
  sirenAt: -1,
  bust: 0,
  mouse: { x: innerWidth * 0.6, y: innerHeight * 0.5 },
  mouseDown: false,
  toastUntil: 0,
  radioUntil: 0,
  saveAt: 30,
  toast(text) {
    $("#toast").textContent = text;
    $("#toast").style.display = "block";
    this.toastUntil = this.time + 4;
  },
  radio(text) {
    $("#dialogue").textContent = text;
    $("#radio").classList.remove("hidden");
    this.radioUntil = this.time + 13;
  },
  save() {
    try {
      localStorage.setItem(
        "vice-harbor-save-v1",
        JSON.stringify({
          version: 1,
          cash: player.cash,
          stage: story.stage,
          step: story.step,
          done: story.done,
          stashes: pickups.map((p) => p.taken),
        }),
      );
      return true;
    } catch {
      return false;
    }
  },
  die(title, text) {
    if (this.dead) return;
    this.dead = true;
    this.mouseDown = false;
    $("#deathTitle").textContent = title;
    $("#deathText").textContent = text;
    $("#death").classList.remove("hidden");
    sound("crash");
  },
};
let stored = null;
try {
  stored = JSON.parse(localStorage.getItem("vice-harbor-save-v1"));
  if (stored?.version !== 1) stored = null;
} catch {}
$("#continue").classList.toggle("hidden", !stored);
function startGame(continuing = false) {
  if (state.started) return;
  unlockAudio();
  if (continuing && stored) {
    restoreStory(stored);
    player.cash = Math.max(0, Number(stored.cash) || 0);
    if (Array.isArray(stored.stashes))
      pickups.forEach((p, i) => (p.taken = !!stored.stashes[i]));
    player.x = 2770;
    player.y = 1965;
  }
  state.started = true;
  state.time = 0;
  state.spawnAt = 3;
  $("#menu").classList.add("hidden");
  $("#hud").classList.remove("hidden");
  camera.x = player.x - 100;
  camera.y = player.y;
  announceMission(state);
  state.toast(
    continuing
      ? "STORY RESTORED · Welcome back to Leon Coast"
      : "Welcome to Leon Coast · Walk to the coral GT and press E",
  );
}
$("#start").onclick = () => startGame(false);
$("#continue").onclick = () => startGame(true);
function pause() {
  if (state.mapOpen) {
    toggleMap();
    return;
  }
  if (!state.started || state.dead) return;
  state.paused = !state.paused;
  state.mouseDown = false;
  $("#pause").classList.toggle("hidden", !state.paused);
  if (!state.paused) unlockAudio();
}
function toggleMap() {
  if (!state.started || state.dead) return;
  if (state.paused && !state.mapOpen) return;
  state.mapOpen = !state.mapOpen;
  state.paused = state.mapOpen;
  state.mouseDown = false;
  $("#cityMap").classList.toggle("hidden", !state.mapOpen);
  if (state.mapOpen) drawCityMap();
}
$("#resume").onclick = pause;
$("#save").onclick = () => {
  $("#saveMessage").textContent = state.save()
    ? "Progress saved locally. Your story is safe."
    : "Storage unavailable in this browser.";
};
$("#respawn").onclick = () => {
  player.cash = Math.max(
    0,
    player.cash - ($("#deathTitle").textContent === "BUSTED." ? 200 : 150),
  );
  if (player.car) {
    player.car.parked = true;
    player.car.speed = 0;
  }
  player.car = null;
  player.x = 2770;
  player.y = 1965;
  player.hp = 100;
  player.wanted = 0;
  player.heat = 0;
  player.invulnerable = 5;
  state.dead = false;
  state.bust = 0;
  for (let o of cars)
    if (o.type === "police") {
      o.type = "civilian";
      o.parked = true;
    }
  $("#death").classList.add("hidden");
  state.save();
  state.radio("Mara here. You’re still breathing. Get back out there.");
};
addEventListener("keydown", (e) => {
  if (
    [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ].includes(e.code)
  )
    e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  if (!state.started && e.code === "Enter") {
    startGame(false);
    return;
  }
  if (e.code === "KeyM") {
    let muted = toggleSound();
    if (state.started) state.toast(muted ? "SOUND OFF" : "SOUND ON");
  }
  if (e.code === "Tab") {
    e.preventDefault();
    toggleMap();
  }
  if (e.code === "KeyP" || e.code === "Escape") pause();
  if (state.started && !state.paused && !state.dead) {
    if (e.code === "KeyE") {
      takeCourier(state);
      enterExit(state);
    }
    if (e.code === "KeyF") {
      state.toast(
        state.save()
          ? "PROGRESS SAVED · Local browser save"
          : "Save unavailable",
      );
    }
  }
});
addEventListener("keyup", (e) => (keys[e.code] = false));
addEventListener("blur", () => {
  Object.keys(keys).forEach((k) => (keys[k] = false));
  state.mouseDown = false;
  if (state.started && !state.paused && !state.dead) pause();
});
canvas.addEventListener("mousemove", (e) => {
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
});
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0 && state.started && !state.paused && !state.dead) {
    state.mouseDown = true;
    unlockAudio();
  }
});
addEventListener("mouseup", () => (state.mouseDown = false));
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
let oldDistrict = "",
  districtUntil = 0,
  hudAt = 0;
function updateHUD() {
  let area = district(player.x, player.y);
  if (area !== oldDistrict) {
    oldDistrict = area;
    $("#district b").textContent = area;
    $("#district").style.opacity = 1;
    districtUntil = state.time + 5;
  }
  $("#district").style.opacity = state.time < districtUntil ? 1 : 0;
  $("#districtMini").textContent = area;
  const n = Math.ceil(player.wanted);
  $("#stars").textContent = "★".repeat(n) + "☆".repeat(5 - n);
  $("#stars").style.color =
    n && state.time - player.lastCrime > 10 ? "#a9dcdf" : "#ffd581";
  $("#cash").textContent = "$" + Math.floor(player.cash).toLocaleString();
  $("#health").style.width = player.hp + "%";
  $("#health").style.background = player.hp < 30 ? "#f18173" : "#83d5b2";
  $("#healthText").textContent =
    Math.ceil(player.hp) +
    " / 100 HEALTH" +
    (state.bust > 0.5 ? " · BUSTING" : "");
  $("#clock").textContent =
    `${18 + Math.floor((42 + state.time / 12) / 60)}:${String(Math.floor((42 + state.time / 12) % 60)).padStart(2, "0")}`;
  $("#missionTag").textContent =
    story.stage < 3
      ? `0${story.stage + 1} / THE OPENING HAND`
      : "STORY COMPLETE / FREE ROAM";
  $("#missionTitle").textContent = titles[story.stage];
  $("#missionText").textContent = objectiveText();
  const meters = Math.round(distance(player, missionMarker()));
  $("#missionDistance").textContent =
    (meters > 1000 ? (meters / 1000).toFixed(2) + " KM" : meters + " M") +
    " TO DESTINATION" +
    (player.wanted > 0
      ? " · " +
        (player.heat > 0
          ? "LAY LOW " + Math.ceil(8 - player.heat) + "s"
          : "POLICE SEARCH ACTIVE")
      : "");
  $("#speed").textContent = player.car
    ? Math.round(Math.abs(player.car.speed) * 0.23) + " MPH"
    : "ON FOOT";
  $("#vehicleName").textContent = player.car
    ? player.car.name + " · " + Math.ceil(player.car.hp) + "% CONDITION"
    : "RIVER VALE · " + (keys.ShiftLeft ? "SPRINTING" : "RUNNER");
  let prompt = "";
  if (player.car)
    prompt = Math.abs(player.car.speed) < 105 ? "E  /  EXIT VEHICLE" : "";
  else {
    let near =
      targetCar.hp > 0 && distance(targetCar, player) < 68
        ? targetCar
        : cars.find((o) => o.hp > 0 && distance(o, player) < 65);
    if (near)
      prompt =
        "E  /  " +
        (near.type === "police"
          ? "STEAL POLICE INTERCEPTOR"
          : near.type === "target"
            ? "ENTER CORAL GT"
            : "TAKE VEHICLE");
  }
  if (distance(player, garage) < 85) {
    prompt =
      story.stage === 3 && !story.delivery
        ? "E  /  ACCEPT COURIER JOB · FREE REPAIR & AID"
        : "MARA’S GARAGE  /  FREE REPAIR & FIRST AID";
  }
  $("#prompt").textContent = prompt;
  $("#prompt").style.display = prompt ? "block" : "none";
  if (state.time > state.toastUntil) $("#toast").style.display = "none";
  if (state.time > state.radioUntil) $("#radio").classList.add("hidden");
  drawMinimap(state);
}
let last = 0;
function frame(t) {
  let dt = Math.min(0.035, (t - last) / 1000 || 0.016);
  last = t;
  if (!state.paused && !state.dead) {
    state.time += dt;
    if (state.started) {
      let aim = Math.atan2(
        state.mouse.y - view.h / 2 + (camera.y - player.y) * camera.zoom,
        state.mouse.x - view.w / 2 + (camera.x - player.x) * camera.zoom,
      );
      updateEntities(state, dt, keys, aim, state.mouseDown);
      if (!state.dead) updateMissions(state, dt);
      let look = player.car
          ? Math.min(100, Math.abs(player.car.speed) * 0.2)
          : 0,
        tx = player.x + Math.cos(player.a) * look,
        ty = player.y + Math.sin(player.a) * look;
      camera.x += (tx - camera.x) * (1 - Math.exp(-5 * dt));
      camera.y += (ty - camera.y) * (1 - Math.exp(-5 * dt));
      let z = player.car ? 0.94 - Math.abs(player.car.speed) * 0.00025 : 1.02;
      camera.zoom += (z - camera.zoom) * dt * 2;
      if (state.time > state.saveAt) {
        state.save();
        state.saveAt = state.time + 30;
      }
    } else {
      for (let car of cars)
        if (!car.parked) {
          car.x += Math.cos(car.a) * car.speed * dt;
          car.y += Math.sin(car.a) * car.speed * dt;
          if (car.y > 3500) car.y = 120;
          if (car.y < 100) car.y = 3480;
          if (car.x > 2850) car.x = 100;
          if (car.x < 80) car.x = 2820;
        }
    }
    state.shake = Math.max(0, state.shake - dt * 18);
  }
  renderWorld(state);
  if (state.started && t > hudAt) {
    updateHUD();
    hudAt = t + 80;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// The game exposes read-only snapshots for local browser verification; no network or runtime dependencies.
window.viceHarbor = {
  snapshot: () => ({
    started: state.started,
    paused: state.paused,
    dead: state.dead,
    player: {
      x: player.x,
      y: player.y,
      hp: player.hp,
      cash: player.cash,
      wanted: player.wanted,
      driving: !!player.car,
      angle: player.a,
      speed: player.car?.speed || 0,
      vehicleHp: player.car?.hp || 0,
    },
    story: { ...story },
    cars: cars.length,
  }),
};
