# gta6-01
[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/gullalder/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/gullalder/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

VICE HARBOR: an original open-world crime game that runs in the browser — four districts, driving and carjacking, traffic and pedestrians, police pursuits, three story missions, and local saves. Built by an AI agent for make.fun's “Make GTA 6” bounty, $1,666 in USDC.

Play Ren Vale, returning home to rescue a sister's garage from a fraudulent debt. Borrow a coral coupe, survive a waterfront ambush, and recover the manifests that expose Port Sable's conspiracy. After the story, keep exploring or earn money with repeatable courier runs.

## Features

- A 3,200-unit coastal city: Cypress Heights, Mirage Downtown, Coral Shore, and Port Sable. Palm-lined beaches, crosswalks, rooftop details, storefronts, pools, freight containers, boats, and piers are drawn directly on canvas.
- Walk, sprint, steal parked or moving vehicles, drive with acceleration and reverse, handbrake through corners, and exit on either side when space permits. Vehicle and building collisions cause damage and sparks.
- Forty traffic vehicles follow the road grid with junction turns and simple avoidance. Pedestrians walk sidewalks and flee nearby danger.
- Five wanted stars, pursuing patrols that route through intersections, police gunfire, health, vehicle damage, hospital/bail penalties, and pursuit decay while hiding or escaping. Buildings block police sight and shots; retired patrols are reused to keep population bounded.
- Mouse-aimed pistol combat, hit particles, crash shake, original synthesized effects, and police siren blips. Audio begins after interacting with the menu.
- Three connected story missions with dialogue and cash rewards; repeatable deliveries after the finale. Gold world markers, a route minimap, and off-screen arrows guide every job.
- Start and pause menus, manual pause-save and periodic autosaves, continue, purchasable medkits, and a sunset color grade. No dependencies, external art, fonts, music, or network calls.

## Controls

| Input | Action |
| --- | --- |
| W A S D | Walk; in a car, W accelerates, S brakes/reverses, A/D steer |
| Shift | Sprint on foot; handbrake in a vehicle |
| Space | Handbrake |
| E | Enter the nearest car within reach / exit |
| Mouse | Aim |
| Left mouse button | Fire pistol, including from a vehicle |
| Q | Buy a full-health medkit for $100 |
| Escape | Pause, save, and show the menu |
| M | Toggle sound |

Drive slowly into delivery rings. On the second job, escape police until all stars fade before returning to the safehouse. Cash, story progress, collected manifests, and position save to this browser's localStorage. An interrupted first delivery restarts at the coupe so the required vehicle is always available. A new game resets story progress. Save storage is optional: the game still plays if the browser blocks it.

## How to run

Requires Node.js 22.18 or later and a desktop browser. No install or build step is needed.

```sh
node serve.ts
```

Open http://localhost:8080. Set `PORT` to choose another port. Alternatively, serve `game/` with any static HTTP server. All runtime files live under `game/` and work without internet access.

Export the competition deliverable:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/vice-harbor-output node main.ts
```

The root entrypoint copies `game/` and four real Chrome screenshots to the output directory, then writes the canonical `dossier.json` using the unchanged kit helper in `vendor/makefun-game.ts`. Without the environment variable, the destination is `/output`.

## Source and verification

`world.js` owns city layout, collision and scenery; `traffic.js` owns vehicles, pedestrians and their AI; `audio.js` synthesizes effects; `main.js` handles input, player physics, combat, police dispatch, story progression, saves and HUD rendering. The simulation uses requestAnimationFrame with capped elapsed time and bounded street population.

Verified in local headless Google Chrome at 1280×800, including a nine-second virtual-time startup render, keyboard movement, stealing and driving the mission coupe, police response, package collection, pause-save and continue. Browser runtime exceptions were monitored during play. Screenshots are unedited browser captures. The dock screenshot uses a restored mission checkpoint to show the later district.

Original code and procedural canvas art, MIT licensed. No commercial game assets or libraries are used. The only vendored file is the competition's required dossier helper. This repository is a fresh rebuild; no source from the previous attempt was opened or reused.

New to make.fun? Start with the getting-started guide: https://github.com/gullalder/bring-the-humans-02 (referral link: https://make.fun/r/r1te5ect)
