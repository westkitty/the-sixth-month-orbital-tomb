# Orbital Tomb / The Sixth Month - Revision R2

## Outcome and scope

Forked the exact 55-file `THE_SIXTH_MONTH_VISUAL_UPLIFT_SOURCE.zip`, retaining the existing art, structural proportions, 12 docking arms, seven-month deterministic model, all spatial-memory functions, Virgil visuals, navigation, save format, controls, user references, and prior tests. This is a bounded asset and delivery uplift, not a rebuild of the scene.

## New in-world improvements

- **Dock identity and authored scale:** one new original 4x3 `dock_id_atlas.png` labels existing `dock-01..dock-12` with 12 distinct plates. A single texture/map is reused for every dock using per-geometry UV subrectangles; no 12 textures or 12 new scene entities.
- **Mating hardware:** each docking arm receives a steel mating collar and four load-sharing struts while keeping the exact original component IDs, routes, detach month, original pose and drift.
- **Navigable spatial identity:** one original `wayfinding_floor.png` communicates the lived-in pressure-route function in corridor floors and the observation chamber. The image moves only with the associated station section, not in empty vacuum.
- **Cold industrial palette preserved:** original titanium, grille, console, door, identification and frost assets unchanged in intent, all now part of a 15-map same-origin source package.
- **Local Mac launcher:** `START_MAC.command` performs prerequisite check, install, tests, production build and launches the site locally in one command. `dev:local` prevents LAN-wide binding while preserving the existing `dev` command for deliberate LAN testing. The only extra npm script is `dev:local`.
- **Offline cache manifest:** v4 adds both textures to same-origin precache.

R2 authored markings are **illustrative engineering labels**, not assertions about the station's historical markings or canonical month-by-month dates. Five supplied Drive reference images are retained unchanged and not used as runtime texture maps. This release did not create character likenesses or claim official character approval.

## Validation matrix

- Earlier source package ZIP: integrity checked with `unzip -t`.
- Image sources physically generated: 15 PNG files, all decoded, nonblank, sizes and SHA-256 recorded in `docs/visual/ASSET_MANIFEST.json`.
- Tests: **24/24** `npm run test` (inherited 22 plus atlas/wayfinding guards).
- JS syntax: `node --check public/sw.js` passed.
- Full semantic typecheck and Vite build: **not completed here** because npm registry DNS returns `EAI_AGAIN`; no node_modules installed. The included Mac launcher will run `npm run check` before it starts.
- Browser WebGL scene, texture output, pointer/touch journeys, actual FPS: **unverified**. Do not promote source/PNG checks to visual runtime proof.

## Protected invariants

The exact formerly occupied location `[0, 1.72, -80]`, Month 0-6 chronology and scene transitions, 12 original docking IDs, ghost source geometry, separation/reversal logic, six physical (non-spiritual) landmark figures, recording and replay of *user* paths, bounded atmosphere-vacuum separation, no new Shard-God visual, one WebGL renderer and one animation loop remain as implemented.

## Post-launch visual QA

Visit Month Zero as a pedestrian, check deck arrows and observation sightlines; use `3` to orbit and inspect all twelve docking collars, zoom to see `01..12` labels; scrub months 0 to 1 to observe deliberate first departures; use `4` at Month Six and compare the absent room with its original outline. If the planet or camera clips the geometry, fix that observed defect rather than claiming this source-only pass proved it correct.

## Release classification

**Source uplift delivered; browser verification still pending.** All changes are confined to this fork and newly packaged artifact. No museum repository, Drive source/reference file or prior archive was overwritten.
