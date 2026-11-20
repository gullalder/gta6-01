import { player, targetCar, crime, burst, pickups } from "./entities.js";
import { distance } from "./world.js";
import { sound } from "./audio.js";
export const story = {
  stage: 0,
  step: 0,
  packages: 0,
  done: [],
  delivery: null,
};
export const garage = { x: 2770, y: 1965 },
  escape = { x: 920, y: 2700 };
export const packages = [
  { x: 1510, y: 3120, name: "Freight manifest" },
  { x: 820, y: 2130, name: "Offshore accounts" },
  { x: 2070, y: 1450, name: "The original ledger" },
];
export const titles = [
  "Borrowed sunshine",
  "A clean getaway",
  "Paper trails",
  "The coast is yours",
];
const intros = [
  "River. Welcome home. There’s a coral GT on Ocean Avenue. Take it to my garage. We need something fast.",
  "Nice driving. The owner made a call. Head for the freight yard. Lose the patrols, then meet my contact.",
  "Three dead drops. One ledger that could bury Harbor Trust. Collect the evidence, then bring it home.",
  "The ledger’s safe. The debt’s paid. Keep the car, River. There’s always another job on this coast.",
];
for (let i = 0; i < 10; i++)
  pickups.push({
    x: [820, 1430, 2030, 2630, 220][i % 5],
    y: 660 + Math.floor(i / 5) * 1600 + ((i * 37) % 90),
    taken: false,
  });
export function missionMarker() {
  if (story.stage === 0)
    return story.step === 0 || player.car !== targetCar ? targetCar : garage;
  if (story.stage === 1) return escape;
  if (story.stage === 2)
    return packages.find((p, i) => !story.done.includes(i)) || garage;
  return story.delivery || garage;
}
export function objectiveText() {
  if (story.stage === 0)
    return story.step === 0
      ? "Steal the coral GT parked on Ocean Avenue."
      : "Deliver the coral GT to Mara’s garage. Keep it in one piece.";
  if (story.stage === 1)
    return story.step === 0
      ? "Reach the freight-yard checkpoint. Don’t let the patrols box you in."
      : "Lose the police. Get out of sight until the search is called off.";
  if (story.stage === 2)
    return story.done.length < 3
      ? `Collect the evidence dead drops. ${story.done.length} / 3 recovered.`
      : "Return the ledger to Mara’s garage.";
  return story.delivery
    ? "Deliver the sealed parcel to the marked drop."
    : "Explore the coast. Visit Mara’s garage for a courier job, repairs, and first aid.";
}
export function announceMission(state) {
  state.radio(intros[story.stage]);
}
function complete(state, reward) {
  player.cash += reward;
  player.hp = Math.min(100, player.hp + 20);
  burst(player.x, player.y, "#f4cf78", 35, 200);
  sound("reward");
  state.toast(`JOB COMPLETE · +$${reward.toLocaleString()}`);
  story.stage++;
  story.step = 0;
  state.save();
  announceMission(state);
}
export function updateMissions(state, dt) {
  if (story.stage === 0) {
    if (targetCar.hp <= 0) {
      targetCar.hp = 100;
      targetCar.x = 2724;
      targetCar.y = 1535;
      targetCar.parked = true;
      targetCar.speed = 0;
      targetCar.a = Math.PI / 2;
      story.step = 0;
      state.toast("Mara found another GT. Return to Ocean Avenue.");
    }
    if (story.step === 0 && player.car === targetCar) {
      story.step = 1;
      state.radio(
        "That’s the one. Bring it down Ocean Avenue. Don’t scratch the paint.",
      );
    }
    if (story.step === 1) {
      if (
        player.car === targetCar &&
        distance(player, garage) < 85 &&
        Math.abs(targetCar.speed) < 65
      ) {
        complete(state, 650);
        crime(2, state.time);
      }
    }
  } else if (story.stage === 1) {
    if (story.step === 0 && distance(player, escape) < 110) {
      story.step = 1;
      state.radio(
        "Checkpoint reached. Patrols are still looking. Duck down a side street, or run for Cypress. I’ll call when it’s clear.",
      );
      state.toast("CHECKPOINT REACHED · Lose your wanted level");
    }
    if (story.step === 1 && player.wanted === 0) {
      complete(state, 1000);
    }
  } else if (story.stage === 2) {
    for (let i = 0; i < packages.length; i++)
      if (!story.done.includes(i) && distance(player, packages[i]) < 65) {
        story.done.push(i);
        sound("pickup");
        burst(packages[i].x, packages[i].y, "#80e1c5", 25);
        state.toast(`EVIDENCE RECOVERED · ${story.done.length} / 3`);
        state.save();
        if (story.done.length === 3)
          state.radio(
            "That’s everything. Harbor Trust bought this city. Tonight we get a little of it back. Bring the ledger home.",
          );
      }
    if (story.done.length === 3 && distance(player, garage) < 85) {
      complete(state, 2200);
      player.wanted = 0;
    }
  } else if (story.delivery && distance(player, story.delivery) < 75) {
    story.delivery = null;
    player.cash += 400;
    sound("reward");
    state.toast("COURIER DELIVERY · +$400");
    state.save();
  }
  for (let p of pickups)
    if (!p.taken && distance(player, p) < 35) {
      p.taken = true;
      player.cash += 100;
      sound("pickup");
      burst(p.x, p.y, "#e8cd80", 15);
      state.toast("STREET STASH · +$100");
      state.save();
    }
  if (
    distance(player, garage) < 75 &&
    (!player.car || Math.abs(player.car.speed) < 25)
  ) {
    player.hp = Math.min(100, player.hp + dt * 18);
    if (player.car) player.car.hp = Math.min(100, player.car.hp + dt * 20);
  }
}
export function takeCourier(state) {
  if (story.stage === 3 && distance(player, garage) < 100 && !story.delivery) {
    story.delivery = packages[Math.floor(Math.random() * 3)];
    state.radio(
      "One more easy delivery. No questions, four hundred cash. Your drop is on the map.",
    );
  }
}
export function restoreStory(save) {
  story.stage = Math.min(3, save.stage || 0);
  story.step = 0;
  story.done = save.done || [];
  if (story.stage === 0 && save.step === 1) {
    targetCar.x = 2724;
    targetCar.y = 1535;
  }
}
