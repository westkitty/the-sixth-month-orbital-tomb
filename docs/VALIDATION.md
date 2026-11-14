# Implementation & Validation Record — 2026-11-13

## Evidence levels

- `source-present`: main UI, complete modular TS source, reference-grounded world geometry, temporal model, path memory, procedural planet, weather, audio, accessibility and persistence modules written to disk.
- `syntax-checked`: all seven `.ts` application source modules parsed successfully with TypeScript `transpileModule` (syntax test; **not** a strict typecheck).
- `unit-test-passing`: after one bounded correction to tie-break anchoring and exact final-position rounding, 19/19 deterministic model, save and static structural tests passed via global `tsc` and `node --test`.
- `full-typecheck`: **blocked** because `three` and `vite/client` dependencies could not be fetched or resolved; local build `tsc` errors cannot prove a valid or invalid package-installed application. Full `npm run typecheck` must be repeated once dependencies are installed.
- `production build`: **attempted and BLOCKED**: `npm run build` exited 2 during TypeScript module resolution because the pinned Three/Vite dependencies were not installable; npm registry DNS failure (`EAI_AGAIN`). See `docs/build-output.txt`.
- `browser-runtime`: **not observed**. No actual WebGL screenshots, rendering metrics, touch-controller test or ten-interaction end-to-end pass is claimed.
- `desktop/mobile performance`: **unknown**, requires representative running browser and hardware.

## Exact tests performed

1. `tsc -p tsconfig.test.json` — PASS (pure `domain.ts` and `save-model.ts`, global TypeScript compiler).
2. `npm run test` — PASS, 19 model and structural tests after correcting two first-pass assertion failures. See `docs/test-output.txt`.
3. TypeScript compiler API `transpileModule` with diagnostics for each actual app `.ts` source — PASS, 7/7 parse checks.
4. `tsc -p tsconfig.json --noEmit` — BLOCKED by missing `three` module/types and `vite/client`. The source-only error in `ExplorationUI` was corrected; pending repeat in dependency-complete environment.
5. `npm run build` — BLOCKED on missing `three` module and its types; underlying `EAI_AGAIN` from registry, not evidence of renderer correctness. See `docs/build-output.txt`.
6. `curl -I https://registry.npmjs.org/three/-/three-0.185.1.tgz` — DNS failure, so no package install.
7. `curl -I https://unpkg.com/three@0.185.1/build/three.core.js` — DNS failure, no alternative local vendoring.

## Must-pass manual scenes (pending)

A. Month Zero: stand inside observation room; walk connecting corridor; look at huge Virgil sphere.

B. First removal: at a fixed orbital position scrub 0→1; all 12 original docking-arm IDs separate gradually, return to exact original transform when scrubbed to zero.

C. Vanishing corridor: move inside a structurally removed passage, advance timeline, confirm user remains at a recoverable position in free float; original mesh wireframe overlays align with original floors/walls/portals.

D. Wide orbital: inspect Meridian's near-intact to near-empty silhouette; choose a segment and follow it; ensure six physical named corpse-landmark positions are stable and there is no supernatural movement or body consciousness.

E. Month Six: press `4`; camera precisely occupies `[0,1.72,-80]`; show original wireframe; show your own trace through absent architecture; hide both and all UI. Confirm Virgil and the open void remain legible.

F. Open six Virgil weather modes in probe camera and return to orbit; confirm no weather particles appear in vacuum.

G. Scrub repeatedly, play/reverse/replay, save and restore, record and archive two routes; compare two months without collision side effects.

H. Keyboard-only, keyboard focus, touch drag/look, 6DOF rise/sink, anchored vibration sound in contact (optional), silence in vacuum, reduced-motion mode, viewport resize and dispose/restart resource counters.

## Known limitations and repair path

The first implementation is a **procedural production prototype**: visual reference likeness beyond the primary shape, near-million-meter seamless scale, detailed engineering topology, precise human pose fidelity, and all interactive browser states are not independently verified. Missing packages are the immediate validation blocker. Once installed, run the exact commands in the README and record browser evidence, screenshots and renderer stats. A failed full-typecheck/build should receive a narrow correction to the actual error rather than a broad rewrite. Do not deploy or archive as a completed release before the browser path succeeds.

## Follow-up visual asset uplift — 2026-11-13

The follow-up fork includes 13 physical source-generated PNG maps and source-level integration. `npm test` now **22/22 PASS** (inherited 19 plus three asset/camera-budget/static source checks). All 13 PNGs decode and have nontrivial pixel data; see `docs/visual/ASSET_MANIFEST.json` and `MATERIAL_PIXEL_QA.png`. Service worker syntax passes. `npm run typecheck` and `npm run build` remain **BLOCKED** with missing `three` / `vite` dependencies; actual WebGL gameplay, mobile input and frame-rate effects remain unverified. Full evidence ledger: `docs/visual/VISUAL_ASSET_REPORT.md`.
