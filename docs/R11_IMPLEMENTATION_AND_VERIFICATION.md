# Orbital Tomb / The Sixth Month — R11: First-Minute Usability and Catalog Population

## Authority and protected behavior

Created as a NON-DESTRUCTIVE fork of the delivered `THE_SIXTH_MONTH_ORBITAL_TOMB_R10_QA2.zip`. The established Meridian/Virgil identity, 12 docking arms, 74 structural groups, six-month source order, physical collision, time reversal, six-month witness cuts, inspection, spatial comparison, silent deceased landmarks, saved route, and offline architecture remain intact. This is not a canon population manifest or historical reconstruction of what these people specifically did. Three unnamed Rocketbox figures are illustrative station occupants at the Month Zero opening only. They are not the six named deceased landmarks, crew identified by archival evidence, ghosts, or rescued survivors.

## Actual changes

**First action:** Press `START INSIDE MERIDIAN / WALK`. This explicitly sets Month Zero, original observation coordinates, Walk camera, and active WASD. No hidden previous Orbit or Month Six save can override the selected start. Previous progress is preserved and available via a separate `CONTINUE PREVIOUS POSITION` button when storage contains a save. The video-less intro spells out WASD, I, and period. Keyboard control remains browser-focus dependent; the entry action focuses the world canvas.

**Continuous direction:** A concise NEXT ACTION module gives one relevant next step at a time: walk -> inspect -> witness first cut -> compare Month Six -> visit the former room. There is a visible real action button for each phase; it does not fabricate objectives, fake evidence or force an event. Dismiss/reveal remains reversible. Accessibility/touch and the existing full instrument panel remain.

**Catalog population:** Three concrete Microsoft Rocketbox rigged GLBs (`Pilot_Female_01`, `Pilot_Male_01`, `Medical_Female_02`) were fetched from the user's actual private Drive processed-glb catalog, their opaque Drive file IDs and source byte hashes written to `docs/visual/R11_CREW_ASSET_LEDGER.json`. Three independent local render objects are placed at lateral stations in the observation chamber, attached to its real parent transform and hidden outside near-room Month Zero. No external CDN, additional NPC network calls, invented biographies or voice lines. A status line clearly distinguishes modeled occupants from identified crew. Unavailable GLB is reported as a load warning, not replaced with a silently invented avatar.

**Performance-first integration:** Repacked the three original GLBs, preserving their glTF skins, bones, animations, mesh topology and all non-image buffer views. Their total original 71,646,192 bytes became 3,690,240 bytes; the exact manifest records individual hashes and lengths. Idle motion is a single bounded transform update rather than running three complex skeletal mixers. Figure roots are culled when far away, in orbital mode, after Month Zero, and pose updates stop in economy mode. Directional-light shadow mapping is disabled outside populated walk-mode normal quality and in economy quality, removing costly shadow passes from wide-orbit presentation without changing geometry, collision or physics. Existing adaptive pixel-ratio quality remains available.

**Offline/rights:** Versioned service worker `sixth-month-static-v14` includes all three independent GLBs. Original Microsoft Rocketbox copyright and full MIT text are bundled in `docs/MICROSOFT_ROCKETBOX_LICENSE.md`. Third-party original files and authoring notes are not downloaded at runtime.

## Verification ledger

| Requirement | Evidence | State |
| --- | --- | --- |
| Walking is the explicit default entry | `src/main.ts` `beginWalk`, `index.html` start action, `src/ui.ts` wiring, static regression | SOURCE PASS |
| Existing saves are not overwritten at intro | `entered=false` suppresses automatic save; independent Continue action remains | SOURCE PASS; LIVE RELOAD UNTESTED |
| Actions always have an discoverable next step | `src/guidance.ts`, DOM guidance buttons, pure-scenario regressions | SOURCE PASS; HUMAN UX REVIEW OPEN |
| Three real catalog humans included | 3 decoded GLB files, 3 skins, 2 clips each, hashes verified against ledger, scene loaders and parent graph | ASSET/SOURCE PASS; LIVE AVATAR RENDER UNTESTED |
| Optimization of imported assets | Exact source/packed byte counts; no extra CDN; distance and temporal culling | ASSET/SOURCE PASS |
| Rendering overall faster | Conditional shadow map and lightweight population logic | IMPLEMENTED; MATCHED FPS PROOF OPEN |
| Regression preservation | R11 pure/structural Node suite and TS logic compilation | PASS, see bundled `R11_TESTS.log` |
| Semantic full TS and production Vite build | npm packages unavailable from container registry | BLOCKED (not assumed passing) |
| Real WebGL, physical WASD, three rendered avatars and mobile inputs | Must launch built R11 on representative machine | UNVERIFIED |
| Original historical order and canon | No edits to R10 domain station pieces, timeline or named landmarks | STATIC PASS |

**Important:** The original 2026-11-13 R10 QA2 Metal browser tests and FPS/draw-call figures apply to R10 QA2, NOT this revised R11. R11 is source-tested only until the exact archive is built and exercised in a complete browser runtime. A reduced download size is not proof of smoother FPS or better visual quality.

## Minimal real-browser acceptance pass

1. Clear one test profile; start `START INSIDE MERIDIAN / WALK` with an existing old save containing a Month Six orbital view; confirm Month Zero walk and WASD movement. Confirm an explicit Continue recovers the old position.
2. On first render, count **three** distinct legitimate catalog human meshes in the actual room. Check scale, feet, pose, texture color, visibility, layout, and no collisions with the route. Model failure must be visible, not silently substituted.
3. Walk ~3m, verify guidance advances, approach evidence and press `I`, choose `NEXT CUT`, return to Month Six and original observation coordinates. Repeat with touch controls and reduce motion.
4. Verify all three GLBs are present in the service-worker cache and that offline reload works after a warm load.
5. On **the same Mac, browser, resolution and camera positions**, measure cold-load bytes, foreground median/p95 frame time, shadows/draw calls in Month Zero walk, Month Zero wide orbit and Month Six. Run warm repeated timeline loops and verify GPU resource stability. Compare to R10 QA2 with matching conditions, not to headless throttled FPS.
6. Inspect accessibility: focus, keyboard, Escape, high contrast, reduced motion, small viewport, guide hide/reveal, save compatibility. Do not declare RELEASE PASS without these checks.

## Status

**R11 IMPLEMENTED / SOURCE PROVEN / RUNTIME VERIFICATION OPEN.** No Git commit or push: this standalone artifact has no Git worktree. Prior Drive archives and private original Rocketbox assets were not mutated.
