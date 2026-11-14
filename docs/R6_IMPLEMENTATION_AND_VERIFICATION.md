# The Sixth Month — R6 independent implementation and verification

**Verdict: SOURCE UPLIFT VERIFIED; REQUIRED BROWSER RELEASE GATE BLOCKED.** This is a new bounded iteration over the ZIP-delivered R5, not a new game, a museum exhibit, or a claim that the user has experienced awe.

## Source authority and protected experience

Contract reconstructed from the original standalone build request and subsequent corrections: Meridian Station in orbit above Virgil; exact twelve original docking arms and reference proportions; Month Zero through Six; deliberate, source-ordered disassembly (not battle, explosion or rescued characters); traversable full-scale compressed-geometry station, safe handoff to free float, collision, controlled time 0.1x–16x, watch camera, improved visibility and electrical cut arcs; six source-named final physical remains; source-classified, non-supernatural evidence; original observation-room coordinates persist after removal; no museum frame or invented Drakken/Tiger physics. R5's spatial displacement survey and save compatibility remain intact.

## Actual R6 intervention

**Problem:** the seven source checkpoints could be scrubbed or played, but moving among actual physical removal events required guessing when a joint was active, and fast playback could make real effects effectively invisible. A watch camera alone did not select a meaningful **next** event.

**Change:** `src/cut-navigation.ts` derives six bounded event windows from the existing removal model and every one of its 74 removable structural groups. `PREV CUT`, `NEXT CUT`, comma and period invoke a single actual event path: source phase -> model group -> physical separationJoint -> source-significant room choice (hydroponics, cryogenics, then observation for the final three windows) -> wide camera -> 0.5x playback -> deterministic auto-pause while the seam remains active. The real timeline controller updates actual Three.js meshes and existing particles. The instrument exposes its active phase/pause status. Normal seeking, mode, speed and playback override that witness stop. No separate render loop, extra npm dependency, service, data feed, hidden canon event or audio recording was introduced.

**Temporal integrity:** sparks are now sampled from the same reversible modeled time that moves the hull. Paused structure no longer has perpetually flickering cut arcs, and an unchanged pause no longer regenerates/reuploads particle buffers every browser frame. This is source-level resource management, not an FPS benchmark.

**Distinctive result:** rather than fast-forwarding through a general loss montage, the viewer may witness one real connection being severed, examine its separated fragment/empty original coordinates, and compare the model's physical aftermath through the existing displacement tool. It is a controlled environmental revelation, not an exposition dump.

## Bugs found and repaired in source-level verification

1. **Unsupported ES2023 API**: first draft used Array.findLast, while the project's test compiler targets ES2022. It failed the real `npm test` TypeScript compilation. Replaced with a compatible reversed-array search; next run passed.
2. **Stale watch state**: entering route replay, returning to Month Zero, rescuing to the former room or following another selected component could preserve WATCHING state even when no longer using the seam camera. Each transition now clears that state, the stored watch-focus ID, and the witness stop when appropriate; regression assertions guard these paths.
3. **Duplicate station geometry update**: setTime already updated station groups, but the same simulation step called update again after advancing time. The second invocation was removed; deterministic timing and source tests remain intact. This is a source-level reduction of redundant work, **not** a measured frame-rate gain.
4. **Invisible witness status**: the phase witness and automatic pause were initially announced only through screen-reader status. The real timeline now has a compact visible status that clears on ordinary mode/control changes.
5. **Non-deterministic paused sparks:** separation VFX previously animated from wall-clock simulation time even while the time slider paused the station. The effect clock now comes only from modeled time, and unchanged paused frames reuse the existing buffers.
6. **Stale offline cache**: v7 from R5 was bumped to v8 for the actual changed source. Existing test expectations updated.

## Requirement traceability and proof state

| Governing requirement | Evidence | Honest status |
|---|---|---|
| Correct project, standalone, source chronology, deliberate non-combat removal | Original contract + unmodified `src/domain.ts`, `CANON_PROVENANCE.md`, `tests/domain.test.mjs` | Source and pure logic VERIFIED, visual fidelity UNVERIFIED |
| All seven time checkpoints and no invented historical dates | `src/domain.ts`, `src/cut-navigation.ts`, `tests/cut-navigation.test.mjs` | Deterministic logic VERIFIED; source mappings explicitly provisional |
| 12 fixed arms, original geometry, human-scale traversal | Original geometry source, tests, preserved R5 `src/geometry.ts` | Source covered; browser navigation UNVERIFIED |
| Collision, free float, original-room absence, personal route | Preserved `src/collision.ts`, `src/main.ts`, `src/forensic.ts`, baseline tests | Pure logic PASS; real browser behavior UNVERIFIED |
| Visibility, rate controls, seam sparks/visual watch | Existing source + source wiring tests | Implemented; real effect visibility UNVERIFIED |
| R5 displacement and selective evidence, silent named bodies | `src/displacement.ts`, `src/forensic.ts`, baseline tests | Pure logic VERIFIED; appearance UNVERIFIED |
| R6 direct event witness, stop, reversibility, no extra source groups | `src/cut-navigation.ts`, new `tests/cut-navigation.test.mjs`, UI/main wiring | Pure logic and source-level integration VERIFIED; browser interaction UNVERIFIED |
| UI accessibility, mobile/reduced-motion | semantic buttons, shortcuts, styling, preserved settings | Static source covered; real keyboard/touch/focus QA UNVERIFIED |
| Resource lifecycle/efficiency | one animation loop, bounded effects, duplicate update removed | Static ownership VERIFIED; FPS/GPU/leak benchmarks UNVERIFIED |
| Build and actual premium WebGL game | `npm run typecheck`, `npm run build` attempted | **BLOCKED** missing npm dependency packages due DNS EAI_AGAIN |
| Git commit, push, remote verification | extracted ZIP is not a Git repo and has no configured remote | NOT APPLICABLE; no commit/push claimed |

## Executed checks, fresh final pass

- `npm test` — **58/58 PASS** in final fresh pass; see `docs/R6_TESTS_FRESH_FINAL.log` for full output.
- `node` TypeScript AST parse, HTML ID/reference audit, local imports and single-loop inspection — `docs/R6_INTEGRATION_AUDIT.json`.
- `python3 tools/validate_materials.py` — 15 physically decoded PNG maps, `docs/R6_TEXTURE_VALIDATION.log`. The resulting material QA board is **not a WebGL screenshot**.
- `node --check public/sw.js` and `bash -n START_MAC.command` — syntax validated.
- `npm run typecheck` and `npm run build` attempted: `docs/R6_TYPECHECK_ATTEMPT.log`, `docs/R6_BUILD_ATTEMPT.log`. Missing package/type definitions for Three/Vite are environment limitations, not semantic PASS.
- R6 ZIP will be verified with CRC and per-file SHA256, preserving the exact R5 baseline. No remote push or deployment attempted.

## Independent completion gate

The final source pass can reach zero new failures in the checks actually run. The **entire original contract cannot close** without full semantic typecheck, production Vite build, browser WebGL rendering, keyboard/touch/visibility inspection, all seven scene checkpoints, and matched frame-time/lifecycle measurements on a compatible runtime. Those checks are not simulated as if they passed. Git applies only if the project is deliberately placed in a verified repository.

R6 should be run on a dependency-complete Mac with the included launcher. The new event controls provide a concrete first smoke journey: start at Month Zero, press NEXT CUT six times through successive model windows, verify camera framing and active joint arcs, return to the original observation coordinate in Month Six, then inspect the absent room and compare it with its departing physical fragment.


## Transferable precedent scout (read-only)

- Three.js official [WebGLRenderer documentation](https://threejs.org/docs/pages/WebGLRenderer) recommends owning an animation loop through `setAnimationLoop` and exposes renderer information for live performance inspection. R6 preserves the existing single loop and GPU resource ownership rather than adding a new effects framework.
- MDN's [animation frame timing guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) explains refresh-rate-dependent animation pitfalls. R5 already implemented time-based camera settling; R6's newly introduced witness-stop logic is tested with deterministic delta overshoot rather than counting rendered frames.
- Lucas Pope's official [Return of the Obra Dinn project](https://obradinn.com/) establishes a first-person, evidence-driven investigation of an abandoned vessel. The transferable concept is **revisitable, spatially situated evidence**. R6 does not borrow the story, magical death memories, recording mechanics, visuals, or licensed assets, because Orbital Tomb's canon explicitly forbids conscious remnants or invented testimony.

No third-party runtime asset, package or code was imported. These references are architectural/UX analogues, not independent proof of player enjoyment or runtime quality.
