# The Sixth Month / Orbital Tomb R10 QA2 — Implementation and verification

**Project:** standalone Three.js 0.185.1 + TypeScript + Vite Meridian Station experience. **Status: implemented, source and automated WebGL paths verified, production release gate OPEN.** This is a new revision built on the independently validated R9 QA1 source. R10 RC1 and all earlier archives remain unchanged.

## Controlling story and preservation constraints

Meridian Station remains above the cold desaturated gas giant Virgil. Its twelve docking arms, existing 74 removable *model* groups and six months of deliberate surgical disassembly retain their prior sequence, fixed original observation coordinates and reversible behavior. The player can still walk, collide, free-float, anchor to drifting fragments, inspect source-bounded evidence, compare times, reverse, watch cuts, save, return and use keyboard/touch accessibility. The six named physical remains are inert, not voices or ghosts. No historical day-by-day chronology, fabricated crew testimony, added beings, museum framing, commissioned character designs, or networked services were introduced. New subsystem dependencies and fixtures are explicitly reconstruction, not newly locked canon.

## Ten authorized changes: evidence matrix

| ID | Implemented behavior | Concrete evidence | Verdict |
|---|---|---|---|
| P001 | Three player-submitted source-bounded deductions with physical prerequisites, wrong-answer rejection and persisted solutions | `src/inquiry.ts`, `src/ui.ts`, `src/main.ts`; actual browser scan/submit/persist + case-switch button repair; source logic tests | Implemented; automated PASS |
| P002 | Three reversible modeled service states distinguish remaining structure from operational connectivity; local lights and consoles respond | `src/services.ts`, `src/geometry.ts`; month 0/2/4 service readout transition in R10 browser feature QA | Implemented; automated PASS |
| P003 | Month Six former-room realization depends on the player's own previously recorded walk, not a dead person's memory | `src/absence-visual.ts`, `src/main.ts`; real route→former-room browser check and screenshot | Implemented; automated PASS |
| P004 | Four ordinary material fixtures and independently addressable evidence nodes in observation, hydroponics, cryogenic and cargo geometry | `src/forensic.ts`, `src/geometry.ts`; source tests verify each marker/reading, browser smoke verifies scene | Implemented; individual physical-device inspections not exhaustively observed |
| P005 | Optional room-to-exterior camera-only scale comparison with truthful nonphysical route, reduced-motion bypass, reversible interruption and optical viewport shutter | `src/scale-flight.ts`, `src/main.ts`, `src/styles.css`, `index.html`; path and shutter regression tests + actual WebGL screenshots and 5/5 camera QA | Implemented; full subjective motion quality still unverified |
| P006 | Optional witness stillness/aftermath around six existing reconstructed removal windows | `src/witness-cadence.ts`; R10 browser feature QA verified hold, subsequent progression and ordinary playback | Implemented; automated PASS |
| P007 | Opt-in synthesized contact-transmitted stress and service tone, with vacuum silence when uncoupled | `src/acoustics.ts`, `src/sound.ts`; pure sound coupling checks + live opt-in UI state; no third-party audio files | Implemented; physical speaker listening/mix not verified |
| P008 | Instanced visual provenance classification, optionally showing song-order / visual-reference / engineering reconstruction | `src/provenance-visual.ts`, `src/main.ts`; actual scene-toggled browser screenshot and draw-call check | Implemented; automated PASS |
| P009 | Optional quiet-entry and cinematic UI concealment, H restores controls; interior brightness linked to occupation without overriding user visibility | `src/ui.ts`, `src/main.ts`; real browser quiet/hide/restore and full responsive layout | Implemented; experiential editorial review open |
| P010 | Piece-local instanced static boxes, adaptive render tier, no new animation loop, exact moving-piece IDs preserved | `src/geometry.ts`, `src/quality-budget.ts`; matched Big Mac M4 wide-orbit draw-call samples | Implemented; measured draw-call reduction; foreground FPS and thermal headroom unverified |

## Actual verification (Big Mac and independent source copy)

- **Big Mac, Apple M4, macOS arm64, Brave 157 / ANGLE Metal WebGL2**, served using the Vite production preview at private loopback. Source fingerprint matches the exact R10 QA2 code files in this archive. No user files, Drive predecessors, deployment, or Git branch were mutated.
- `npm run check`: **93/93 automated tests PASS**, semantic TypeScript check PASS, Vite production build PASS. Big Mac test log: `R10_20261113/R10_check_final.log`. Independently, global TypeScript 5.8.3 compiled test-only modules in the packaging environment and Node's **93/93** tests passed (bundled `docs/R10_QA2_LOCAL_NODE_TESTS.log`). Production build requires the pinned npm dependency set.
- `qa/R10_BASELINE_BROWSER_QA.json`: **27/27 PASS**, zero browser errors. Rechecked all Month Zero–Six states, original empty coordinates, anchoring/reversal, focused comparison and save/reload, witness playback, visibility, reduced motion, synthetic one-/two-finger touch, cancel/mouse recovery and responsive view.
- `qa/R10_FEATURE_BROWSER_QA.json`: **18/18 PASS**, zero browser exceptions. Two source-based deductions with invalid answer rejection, service state, provenance, scale camera, paced witness, earned absence and route save, sound toggle, quiet controls and renderer counts.
- `qa/R10_CAMERA_FINAL_QA.json`: **5/5 PASS**, with genuine Metal WebGL screenshots: room, shaded viewport transition, exterior reveal and interrupted-flight recovery. The camera is an authored *viewer* transition, not a traversable collision route.
- `qa/R10_SW_QA.json`: Service-worker **v13** activated for 127.0.0.1, production JS/CSS, the HTML shell and local materials cached; forced-offline browser reload initialized Three.js WebGL2 successfully. No CDN required.
- Real draw calls in matched wide-orbit tests: **6,854 (R9 QA1) → 2,354 (R10 Month Zero)**, roughly **66% fewer**; **3,541 → 1,237 (Month Six)**, roughly **65% fewer**. This is a renderer draw-call measurement, **not** a verified FPS improvement. Automated headless requestAnimationFrame was throttled even on a blank page; representative foreground FPS remains UNKNOWN.
- Four repeated prior R9 timeline scrubs had bounded resource counts. The R10 scene initializes and runs all seven checkpoints, but **extended long-session and physical touch thermal tests have not yet passed a target-device gate**.

## Defects found and corrected during R10 integration

1. **Nonphysical scale camera clipped the observation ceiling / ring:** replaced overhead quadratic shortcut with a staged viewport-exit path, a brief viewport shading layer and interruption cleanup. Added structural path, aperture and integration tests; confirmed via real browser screenshots. Source marks traversal as visualization only.
2. **Investigation question navigation left a stale disabled Submit button:** case changes now re-render eligibility immediately without needing another scan or timeline update; source regression added and live wrong/right answer checks pass.
3. **Provenance markers too small to inspect at the wider scene scale:** increased only the optional instanced overlay marker scale, retaining hidden-by-default status. Updated the offline cache v13 to prevent stale predecessor code.

## Evidence and blockers

Big Mac isolated work directory: `/Users/bigmac/Projects/_orbital_tomb_runtime_checks/R10_20261113/`. This remains a **verification workspace**, not a Git repo or deployment target. Source files in the final ZIP were bytewise compared against their Big Mac checked counterparts. The browser reports are available there under `qa/`; source reports and local Node test output are bundled in this ZIP.

**Release gate: OPEN**, not PASS. Required before a premium commercial release: measured foreground desktop and physical mobile frame-time/p95, physical touchscreen interaction and comfort, audio quality in an actually listening session, full exploratory first-to-last journey feedback, and long-session/thermal stability. Headless/automated WebGL checks and a successful build cannot certify an emotionally effective experience or real-world FPS.

**Git:** standalone project source has no configured Git repository, branch, or remote; no commit, push, deployment, or release publication occurred.
