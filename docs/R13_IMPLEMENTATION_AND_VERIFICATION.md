# THE SIXTH MONTH / ORBITAL TOMB — R13 Integration and Independent Verification

**Build identity:** standalone source revision `THE_SIXTH_MONTH_ORBITAL_TOMB_R13` (2026-11-14).  
**Source baseline:** `THE_SIXTH_MONTH_ORBITAL_TOMB_R12.zip`, SHA-256 `7b96ce925ccc7257e7c3c286024c98b019dcabaf0aba38e6952e4588e1f04993`.  
**Scope:** implement the approved 20-opportunity ledger P001–P020 in the existing vanilla Three.js 0.185.1 + TypeScript + Vite experience; preserve the purpose, original assets, canon and previous archives.  
**Verdict:** Integrated and *source/build/browser tested in bounded scenarios*; **NOT certified as an AAA release**. Human audio review, representative foreground frame time, physical touchscreen, and lengthy endurance remain open.

## Source and provenance contract

Meridian's Month Zero–Six station is deliberately dismantled, never attacked or exploded; twelve original docking arms, the 74 modeled removable groups and source order are unchanged. Virgil is a desaturated gas giant. The original observation-room coordinates remain a physically absent location at Month Six. Any surviving outline, deduction connection or walking trace is **viewer-authored reconstruction**, not historical footage, departed crew testimony, revenants, new canon, or collision geometry. Original six named physical remains stay inert, unlabeled synthetic extras remain noncanonical, no Drakken/Tiger apparition, no added account/network service, no spiders. The three Rocketbox GLBs and their license/provenance ledger are preserved byte-for-byte.

## Twenty-opportunity integration ledger

Evidence levels: `SOURCE` = direct file/Node tests, `BROWSER` = actual running Big Mac Brave/Metal WebGL2 automated journey, `INHERITED` = existing feature deliberately retained and exercised; `OPEN` = qualitative or representative hardware proof incomplete. An improvement *being integrated* is not equivalent to a user-validated emotional result.

| ID | Improvement | Implemented / preserved interface | Evidence and remaining limit |
|---|---|---|---|
| P001 | A coherent first two minutes | Compact six-step current-action mission follows actual walk, scan, cut and return actions; button invokes existing physical navigation/cut mechanics instead of fake completions | SOURCE + BROWSER new-journey checks; first-time human usability OPEN |
| P002 | Living opening occupants | All three licensed Rocketbox skeletons now receive grounded shoulder-pose correction and restrained 15 Hz upper-body/head/spine idle; imported static 0.1-second clips are not misrepresented as expressive animation | SOURCE + BROWSER three loaded/animated, actual screenshot confirms lowered arms; full artistic animation review OPEN |
| P003 | Environmental interpretation | Five physical, locally attached observation/command/hydro/cryo/cargo service fixtures supplement R10's four room-specific inspection points; light follows existing service logic | SOURCE; room detail aesthetics OPEN |
| P004 | Walkable wayfinding | Six-step route-aware objective, physically anchored amber inspection marker, `FACE FIXTURE` action without teleport, existing collider-preserving walk corridors | SOURCE + BROWSER WASD/first start; extended novice route test OPEN |
| P005 | Infrastructure consequences | Actual piece-state driven lights and service readout for the five authored functional rooms; reverseable on scrub | SOURCE + inherited service browser checks |
| P006 | Physical examination | Noncolliding actual-position inspection ring, source-gated physical evidence, real structure selection; retained existing inspection panel | SOURCE + BROWSER R10 feature checks |
| P007 | Physical evidence linking | Optional `LINK OBSERVED PHYSICAL EVIDENCE` connects only actual inspected `INQUIRIES` nodes and uses existing valid correct inference once prerequisites are observed | SOURCE + BROWSER inherited inquiry flow; visual link subjective readability OPEN |
| P008 | Two discovery entrances | `START INSIDE / WALK` and optional `EXTERIOR SURVEY`, both bound to Month Zero and unchanged source; exterior action returns to interior walk | SOURCE + BROWSER 11/11 new-journey proof |
| P009 | Clear separation stages | Readout `ATTACHED / PREPARING / RELEASING / DEPARTING / AFTERMATH` derives solely from actual source `removalProgress`, alongside existing source-driven sparks and watch | SOURCE + BROWSER witness playback |
| P010 | Ride a fragment | R7 real fragment anchoring, transform/reverse and safe release kept functional; R13 mission explicitly points to `F` after witnessing | INHERITED + BROWSER 27/27 regression |
| P011 | Personally earned absence | Personal Month Zero traversal remains the only source of Month Six footfall trace; added bounded actual route distance and familiar-position instruction; no invented dead crew record | SOURCE + BROWSER 18/18 feature suite |
| P012 | Human-to-orbit comprehension | Existing nonphysical scale camera and original-room geometry comparison are retained, linked to guide/provenance and world-first presentation | INHERITED + BROWSER 18/18; camera aesthetic assessment OPEN |
| P013 | Contact sound | Five room-specific restrained synthesis bases, physical attachment gating and real separation stress; vacuum remains silent without contact | SOURCE + BROWSER audio control; speaker mix OPEN |
| P014 | Chronology through working lights | Real room/piece service-driven emissive fittings updated by physical timeline, not atmospheric fog in vacuum | SOURCE; full manual visual review OPEN |
| P015 | Purposeful camera interactions | Existing source-correct anchored/witness/free-look/orbit/scale behavior retained; `FACE FIXTURE` rotates the view toward real evidence without teleporting | SOURCE + BROWSER legacy camera suite; physical motion comfort OPEN |
| P016 | Lower-chrome contextual interface | New compact context action strip, source relationship status, restored Help-on-demand, cleaner default opening; previous full controls remain recoverable | SOURCE + BROWSER; updated first-frame visual inspection confirms no overlapping large panels |
| P017 | Lower population runtime cost | Three optimized local GLBs retained; no invented remote asset, no shadows; update only while in original chamber, economy skips extra animation, 15 Hz cap; source animation clips judged static and not run unnecessarily | SOURCE + BROWSER rig load/visibility; measured cold-start savings vs R12 OPEN |
| P018 | Camera-aware detail costs | Existing shared mesh geometry and per-fragment instancing retained; additional source-fixture visibility budgets for economy/normal/high against actual camera position | SOURCE + browser renderer counters. Matched R12 foreground gain OPEN |
| P019 | Returning-player continuity | Existing schema-1 saves normalized with optional entry route, physical evidence and player route maintained; Continue now displays evidence and travel recap distinct from New Game | SOURCE + BROWSER save/reload inherited; longitudinal user study OPEN |
| P020 | Verification system | R13 Node/semantic Vite checks, 27+18+11 browser checks, actual screenshots, offline cache v16, and bounded `tools/r13-browser-proof.mjs` reproducible isolated test-profile harness | SOURCE + BROWSER; physical touch/foreground FPS/long sessions OPEN |

## Technical changes from R12

New: `src/experience-r13.ts`, `src/experience-visual-r13.ts`, `tests/r13-journey.test.mjs`, `tools/r13-browser-proof.mjs` and this report. Modified: `index.html`, `src/main.ts`, `src/crew.ts`, `src/ui.ts`, `src/styles.css`, `src/geometry.ts`, `src/save-model.ts`, `src/sound.ts`, `src/acoustics.ts`, `public/sw.js`, `tsconfig.test.json` and five existing test fixtures. Source-corrected duplicate `EVIDENCE_NODES` import from inherited R12. Zero missing files relative to R12; all R12 model bytes preserved.

Two actual browser-driven defects were found and repaired before delivery:
1. The new compact mission strip overlapped the old full-width guidance card. Full guidance now starts hidden but is accessible through **WHAT NEXT?**, preserving all functions.
2. The catalog poses were splayed. First rig adjustment matched space-delimited names, but actual GLTFLoader sanitizes bone names to underscores. Corrected bone matching; visible opening screenshot now shows grounded, lowered arms. Genuine 0.1-second static animation clips are not sold as authored idle animation. Bounded skeleton motion uses no character root translation or AI navigation.

## Independent runtime evidence

- **Machine:** authorized Big Mac, Apple M4 arm64, Node 26.13.1, Vite 7.1.12, Brave 157 headless WebGL2 using ANGLE Metal. Private source in isolated `/Users/bigmac/Projects/_orbital_tomb_runtime_checks/R13_20261114/THE_SIXTH_MONTH_ORBITAL_TOMB_R13`.
- **Build:** `npm install --no-audit --no-fund --prefer-offline` installed 22 locally declared packages, `npm run check` PASS: semantic TypeScript; **118/118 Node tests**; Vite optimized production build PASS. A main JS chunk size advisory (>500 kB raw) is nonfatal and remains an optimization opportunity.
- **Legacy browser QA:** **27/27 PASS**, 0 browser errors. All Month Zero–Six wide views and original-room absence screenshot captured. Actual source-based fragment anchor/reverse, R8 comparison/persistence, witness playback, synthetic touch gestures, pointer-lock fallback, visibility and reduced-motion controls verified within the test's limits.
- **Feature browser QA:** **18/18 PASS**, 0 browser errors; source-grounded deductions, service readouts, provenance, scale, paced witness, earned route, contact audio opt-in and prior resource reductions. One obsolete harness assertion originally sought the R10 sentence `FOOTSTEPS ARE YOURS`, while R13 correctly reports the player’s actual recorded route distance; updated the test expectation without modifying game behavior, then reran.
- **New R13 visitor QA:** **11/11 PASS**, 0 browser errors. Fresh New Game at Month Zero/walk; three real loaded, visible, posed and animated models; detailed Help default hidden and reversibly accessible; evidence objective; actual KeyW moved body 4.0 model units; new exterior route at Month Zero/wide; exterior mission action returned to walk.
- **Actual R13 opening screenshot** captured after the bone fix and reviewed. Two people are within the first viewpoint and a third modeled occupant is present within the room; absence of shadow and lack of root movement are intentional.
- **Offline:** `sixth-month-static-v16` cached current hashed JS/CSS and all three locally bundled Rocketbox GLBs. Real browser network set offline and reload preserved WebGL2 and game initialization. `expectedOnline=false` in the generic proof script represents an asynchronous controller state before its decisive forced-offline reload; the offline reload itself was PASS.
- **Runtime profiling limit:** Headless browser rAF pacing is throttled (~200 ms ticks even in the blank control scene in previous runs). Its recorded p50/p95 is **not reliable device FPS**. R13 wide Month Zero in the 27-assertion scene rendered ~913 calls and Month Six ~811 calls at 1440×763 viewport, normal quality and 1× DPR, but these numbers are not a matched R12 improvement claim. Full physical-device FPS, thermal, long-duration lifecycle and physical touch are still UNVERIFIED.
- **Release:** no Git repository; no commit/push/deploy. R12 and all older source ZIPs remain intact. No paid assets or dependencies added; local files only.

## Repeatable runtime proof (destructive only to disposable browser test profile)

Do **not** attach browser QA to a normal personal profile: it intentionally clears localhost test-origin storage. In an isolated Chromium/Brave profile with remote debug port 9243 and Vite preview bound to 127.0.0.1 port 4183, run from the project root:

```sh
ORBITAL_QA_TEST_PROFILE=1 ORBITAL_QA_CDP_PORT=9243 ORBITAL_QA_URL=http://127.0.0.1:4183/ node tools/r13-browser-proof.mjs
```

It saves `R13_EXPERIENCE_BROWSER_QA.json` in the working directory. The script requires a recent Node runtime with global WebSocket. It is additional to the normal `npm run check`, and cannot substitute for real foreground frame-time / audio / physical touchscreen evaluation.

## Exact Mac launch

Download the complete R13 ZIP to `~/Downloads`, then:

```sh
cd "$HOME/Downloads" && mkdir -p "Orbital-Tomb-R13" && unzip -n "THE_SIXTH_MONTH_ORBITAL_TOMB_R13.zip" -d "Orbital-Tomb-R13" && cd "Orbital-Tomb-R13/THE_SIXTH_MONTH_ORBITAL_TOMB_R13" && bash ./START_MAC.command
```

Choose **START INSIDE MERIDIAN / WALK** (or optional exterior survey). The launcher requires Node >=20.19 and first-install npm network access. `index.html` should not be opened via `file://`.

## Release verdict

**R13 implemented and bounded automated/browser QA verified. Release-quality certification is WITHHELD** until a representative foreground device supplies matched p50/p95 and long-session resource evidence, human checks audio and scene aesthetics, and real touch-device usability is independently tested. Existing R12 source remains an available rollback.
