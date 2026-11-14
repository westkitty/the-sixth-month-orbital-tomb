# The Sixth Month — R5 Displacement Evidence and Recursive Verification

Status: **IMPLEMENTED SOURCE / VERIFIED LOGIC / RELEASE BLOCKED**.

## Authority and source

Derived from the ZIP-delivered R4 version, which itself preserved the original standalone *The Sixth Month* contract. No museum UI, no new characters, no new canon or historically exact month assignments, no cosmic combat, no souls after death. The only persisted new preference is a Boolean in the existing schema 1, under the existing storage key. The source remains vanilla Three.js 0.185.1, TypeScript and Vite. The source **is not a Git checkout**.

## Comparison against R4

- **Original R4:** Select a departed component and view its present location; separately inspect the former room's empty coordinates. No physically connected comparison between those facts. Separation watch re-selected the highest-scored active joint each frame, which could make the camera change focus even while its former target was still active. Probe weather animations could overwrite the scene-visibility preference.
- **R5:** Select the station's physical structure and toggle `K / TRACE DISPLACEMENT`: a sparse, depth-tested vector spans the structure's **original** location and its **current modeled** location. Both endpoints come from `poseAt()`; no independent or arbitrary positions. Reverse scrub contracts the vector; at Month Zero and for the surviving keel it disappears. Cinematic hide suppresses it. The watch camera now uses a stable active target and moves toward the original observation coordinate at Month Six. Its smoothing is frame-rate independent, with matching 30/60/120 Hz pure tests. Probe lighting uses the persistent visibility level, including when leaving a storm.

The trace is *geometric evidence for the reconstruction*, not a tether, communication, canonical flight path, historical sensor record or proof of supernatural causation. It contains exactly 40 dashed segments and two low-cost markers. No added characters, audio files, NPCs, model packs, cinematic overlay UI, web fonts, remote dependencies or second render loops.

## Defects found and repaired

1. **Camera re-targeting:** a changing sort order in `activeDetachments()` could make `WATCH SEPARATIONS` jump between still-active connections. Added `stableWatchTarget`, using previous ID only while it remains in the active set.
2. **Frame-rate-sensitive camera smoothing:** old per-frame fixed `lerp` constants made the same transition behave differently at 30, 60 and 120 Hz. Converted the position and target smoothing to an exponential gain based on frame delta; exact 1-second end-state equivalence is tested.
3. **Lighting settings lost in Virgil probe:** the atmosphere update hard-coded `ambient.intensity` every frame, overwriting the inspector's configured value. Added a user-controlled base ambient and restoration on weather/probe changes.
4. **Stale offline cache:** R4 and R5 share a service-worker scope; keeping the same cache version could continue serving older compiled assets. Cache version bumped from v6 to v7 and checked in tests.
5. **Input toggle autorepeat:** newly introduced `K` could flip repeatedly while held; added the key to the protected nonrepeat list.
6. **Regressed source test after cache version bump:** a static assertion had an old hard-coded cache name. Updated it to the new current version and reran the full suite.

## Verification ledger

| Obligation | Actual evidence | State |
|---|---|---|
| Twelve docking arms, source ordering, geometry and seven timeline states | Unchanged `src/domain.ts`, baseline focused regression tests | Source verified; rendered scene unverified |
| Full station navigation, collision, free float, safe removal behavior | R3/R4 collision tests and unmodified collision boundary except pure camera target helper | Logic verified; browser unverified |
| Original empty observation coordinate and personal route | `src/forensic.ts`, unchanged former-room source and source tests | Logic verified; browser unverified |
| Meaningful selected-to-original location comparison | `src/displacement.ts`, `src/displacement-visual.ts`, R5 source and exact-transform tests | Pure geometry mapping verified; WebGL rendering unverified |
| Reversible, saveable inspector setting | `src/save-model.ts`, old-save roundtrip and K control wiring assertions | Logic/source verified; browser storage unverified |
| Stable seam tracking | `stableWatchTarget` test exercises re-sorted active set | Pure logic verified; camera movement unverified |
| Scene visibility retained through atmospheric effects | `src/virgil.ts` base ambient and source wiring checks | Static integration verified; WebGL unverified |
| Offline cache updates when source changes | `public/sw.js` cache version v7 and tests | Source verified; service worker in real browser unverified |
| Animation ownership, teardown, resource lifecycle | One `setAnimationLoop`, disposal of all new GPU resources | Source verified; actual GPU memory unmeasured |
| Runability, screenshots, seven-state walkthrough, mobile input, performance and visual AAA finish | Requires dependencies/target WebGL browser | **BLOCKED** by npm registry DNS failure; no qualifying proof |
| Git commit/push | R5 ZIP contains no `.git`, branch, or configured upstream | NOT APPLICABLE; no commit/push attempted |

## Validation results and limitations

- `npm test`: **51/51 PASS** in final fresh source pass; full log: `docs/R5_TESTS_FRESH_FINAL.log`.
- `npm run typecheck`: failed because `three` and `vite/client` cannot be resolved in this execution environment. This is an unavailable-dependency failure, **not a passed semantic check**.
- `npm run build`: blocked by the same missing dependencies. `npm view three@0.185.1 version --fetch-retries=0 --fetch-timeout=6000` returned DNS `EAI_AGAIN`.
- TypeScript AST parsing: **14 source/config TypeScript files**, zero syntax failures; `docs/R5_AST_VALIDATION.json`.
- Integration/source check: **63 referenced HTML elements present**, no missing relative imports, one render loop and one shutdown, all **15 authored PNG maps** validated; `docs/R5_INTEGRATION_AUDIT.json`, `docs/R5_TEXTURE_VALIDATION.log`.
- Service-worker `node --check` and Mac launcher `bash -n` passed. ZIP integrity and per-file checksums were completed at packaging.
- No screenshots, visual-performance comparisons, touch smoke tests, Chrome console observations or target-device frame rates can be truthfully asserted yet.

The prior R4 tentative quality score (55/100, source only) is not treated as a performance benchmark. No new numerical score is awarded without a real browser comparison. The highest-value next validation is to run the unchanged Mac launcher from this R5 ZIP in a dependency-enabled environment and traverse Months Zero, One, Four and Six while tracking a detached structure through its original coordinate. The completion gate remains **BLOCKED**, not PASS.

## External analogues (advisory only)

- Three.js `WebGLRenderer` official documentation favors one render loop and exposes renderer memory/render counters. R5 retains one loop, bounded GPU buffers and proper disposal rather than adding an effect pipeline.
  - https://threejs.org/docs/pages/WebGLRenderer
- Environmental storytelling analysis of *Gone Home* and *Firewatch* underscores the value of place, revisitation and non-linear evidence, rather than added textual lore. R5 applies the principle without copying assets, narrative, or mechanics.
  - https://www.mdpi.com/2076-0787/15/1/13

This documentation is **not** evidence of audience emotion, deployed code, or an approved canon addition.
