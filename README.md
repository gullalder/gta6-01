# gta6-01

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/gullalder/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/gullalder/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

VICE HARBOR: an original, offline, top-down open-world crime game for the desktop browser — four districts, driving and carjacking, police pursuits, three story jobs and free roam, drawn entirely in canvas with synthesized sound. Built by an AI agent for make.fun's "Make GTA 6" bounty, $1,666 in USDC.

## Run it

```sh
node serve.ts
```

Open http://localhost:8080 in a desktop browser. No install, build step, account or internet connection is needed.

---
<sub>Entered on [make.fun](https://make.fun/?ref=r1te5ect&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>

## VICE HARBOR

An original, offline, top-down open-world crime game set on the fictional Leon Coast. Play as River Vale, a returning driver helping Mara recover evidence against Harbor Trust. Built for make.fun’s **gta6-01** competition.

## Play

Requires Node.js 22.18+ and desktop Chrome (or another modern desktop browser). No install, build, account, assets download, or internet connection is needed.

```sh
node serve.ts
```

Open **http://localhost:8080**. Any static HTTP server can also serve `game/` directly. The game only loads its own local HTML, CSS, and JavaScript; all artwork is drawn in canvas and all sound is synthesized with WebAudio.

## Controls

| Input               | Action                                                                         |
| ------------------- | ------------------------------------------------------------------------------ |
| WASD / arrow keys   | Walk; accelerate, brake/reverse, and steer a vehicle                           |
| Left Shift          | Sprint on foot / handbrake in a vehicle                                        |
| Space               | Alternate handbrake                                                            |
| E                   | Enter/carjack a nearby vehicle; exit when slow; accept a courier job at Mara’s |
| Mouse + left button | Aim and fire on foot (hold to keep firing)                                     |
| Tab                 | Full-city map; simulation pauses while you plan                                |
| P / Escape          | Pause / resume; Escape also closes the map                                     |
| F                   | Save progress immediately                                                      |
| M                   | Mute / unmute synthesized sound                                                |
| Enter               | Start a new game from the title screen                                         |

The gold diamond and screen-edge arrow show the current destination. Slow down inside Mara’s marked garage forecourt to complete the first delivery. Visit the garage for free health and vehicle repairs. Break line of sight with police, gain distance, and stay hidden to clear wanted stars.

## Features

- A 3,600 × 3,600 city with four districts: Downtown, Palm Strip, Port Meridian, and Cypress Heights. Connected roads, lane markings, crossings, solid buildings, rooftop details, hotel pools, a tennis court and fountain, container yards, port cranes, marina piers, boats, palms, sand and animated surf.
- Walking, sprinting, mouse aiming, carjacking both traffic and parked cars, acceleration, reverse, steering, handbraking, vehicle condition, collision damage, oriented vehicle collisions, screen shake and spark particles.
- Seeded traffic with intersection turns and simple braking avoidance; pavement pedestrians flee from gunfire and dangerous vehicles.
- Five wanted stars, police dispatch, pursuing patrol cars, last-seen positions and sight-line checks, incoming fire, busts, deaths, recovery fees and safehouse respawn.
- Three connected story jobs: **Borrowed sunshine** (steal and deliver the Coral GT, $650), **A clean getaway** (reach the freight yard and escape police, $1,000), and **Paper trails** (recover three evidence drops and return the ledger, $2,200).
- A finale and continued free roam, repeatable $400 courier deliveries, ten persistent $100 street stashes, and free garage first aid / repairs.
- Live objectives, dialogue, health, cash, wanted/search state, vehicle speed and condition, district notices, a minimap and a full-city map.
- Local save/continue, manual saves and automatic saves every 30 seconds. Cash, completed jobs, collected evidence and stashes persist. Continuing starts at the safehouse; an unfinished vehicle delivery restarts at its pickup, and an unfinished escape restarts at its checkpoint objective. Vehicles and wanted level are not saved.
- Original canvas artwork, golden-hour colors, headlights, live siren lights, gun flashes, debris and small WebAudio effects. No third-party game engine or game assets.

## Package the entry

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and the four screenshots into `out/` and writes `out/dossier.json` using the kit’s **unchanged** `vendor/makefun-game.ts`. In the grader it uses `/output` by default. Serve `out/game/` to play the packaged result. Generated output is ignored by Git.

## Verification

```sh
node tests/browser-smoke.mjs
```

The dependency-free smoke test starts the included static server and local headless `google-chrome` in a disposable profile. Set `CHROME_BIN` if Chrome has another executable name. It verifies collision, shooting and fleeing, police spawning and search decay, damage and respawn, carjacking and driving, all three mission rewards, the finale, courier deliveries, save/continue, pause/resume, browser exceptions and external requests. Ports 18080 and 19222 must be free.

The game was also exercised with real keyboard/mouse events in Chrome, including the opening delivery and a chase through the city. Screenshots are direct browser captures of the running game, without compositing or added artwork. Scenario setup is used to inspect later locations and story states. A separate Chrome run with `--virtual-time-budget=9000` checks initial rendering.

## Source

`game/src/world.js` builds and caches the city and handles building collision; `entities.js` runs movement, traffic, pedestrians, combat and police; `missions.js` owns the story and activities; `render.js` draws the world and maps; `audio.js` synthesizes effects; `main.js` coordinates input, saves, menus and the frame loop. Static scenery is cached once, off-screen entities are culled for drawing, patrol/vehicle populations are bounded, and delta time is capped when a tab stalls.

All city, character, vehicle and organization names, story, visuals and sounds are original. This game contains no commercial-game assets or branding. MIT licensed; kit tooling retains its attribution.
