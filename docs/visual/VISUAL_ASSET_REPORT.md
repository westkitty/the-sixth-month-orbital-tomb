# The Sixth Month — Visual Asset Uplift (2026-11-13)

## Verdict: PARTIAL (integrated source + material pixels verified; actual WebGL appearance unverified)

This is a continuation of `THE_SIXTH_MONTH_source_and_references.zip`, not a greenfield redesign. The baseline archive remains intact. Only a forked source copy was modified. Original Drive assets and source snapshots remain unchanged.

## Baseline and visual DNA

Baseline source was reviewed before modifications. `src/geometry.ts` originally constructed the entire station mainly from constant-color box and cylinder geometries, with no loaded panel, grated decking, service-door or console textures. The station's architecture and original procedural Virgil planet were already present but had not been independently browser-rendered in this environment. Therefore these comparisons are **source/asset comparisons**, not a claim of screenshot-verified improvement.

Drive-derived source anchors: geometry lock sheet (12 fixed docking arms, primary ring, upper and lower axial spire), approved corridor and observation room concept art, approved late-stage Meridian view. These user-provided photos are reference-only and are NOT republished as in-game image planes or copied into the new texture pixels. New materials are intentionally muted: worn titanium, blue-gray steel, dark deck grille, sparse amber utility markers, low-luminance cyan diagnostics, dark oxidized red and selective viewport frost. No rainbow neon, generic glowing fog, battle damage, or terrestrial weather in vacuum.

## Physical assets created and how they are integrated

`public/textures/` contains **13 new, original PNG maps** (1,747,701 bytes total):

- Painted titanium panel albedo + roughness, inserted as repeatable structural armor with instanced meshes on the inhabited ring, hub-associated rooms, spire hardware and docking details.
- Deck grille albedo + roughness, instanced into floor modules at approximately 3.5-unit spacing without stretching a single grille over an entire corridor.
- One low-luminance instrumentation face, deployed on independently modeled observation/control consoles.
- Five authored service-door families (observation, hydroponics, cryogenics, logistics, pressure/service), installed as local 3D faceplates.
- Caution band, used sparingly at interfaces and accessible bulkheads.
- MERIDIAN identification stencil, attached to architecture rather than to a HUD.
- Transparent viewport rime/frost strip, anchored to observation-room glass only, not atmospheric precipitation in orbital vacuum.

`tools/generate_materials.py` deterministically rebuilds the source maps; it requires Python + Pillow + NumPy *only for regeneration*. The shipped PNG files do not require Python at runtime. `tools/validate_materials.py` decodes the physical files, verifies dimensions and pixel variance, writes SHA-256 provenance, and creates a **pixel-only** material review image. The review image explicitly is not a gameplay screenshot.

## Structural and runtime integration changes

- Ring sectors gained panel-armored exterior rhythm without changing their identity, names, timeline or removals.
- Source-proportion upper/lower spire silhouette corrected from the existing reconstruction to reference ratios (~120% upper, ~80% lower of ring diameter).
- All twelve docking arms retained their stable IDs while receiving modeled mechanical docking interfaces.
- The observation room now has fitted metal mullions, front-facing frost, low-profile banks of instruments, local service panels, and tighter window geometry; its original world coordinate and original-month departure remain unchanged.
- Corridors gained actual repeated bulkhead geometry, paired service conduits, readable pressure/access panels and floor grilles.
- Original render shell double-occupancy at `hab-19` / observation was corrected: the ring sector is now an exterior load-bearing cage, not a second overlapping room.
- Interior rooms now have side walls and a real centered entrance gap rather than a solid rear wall that contradicts walking topology. The illustrated room plan remains noncanonical reconstruction.
- Added a small number of **station-attached** practical lamps that fade with structural departure; lamps are deliberately added AFTER geometry ghosts are cloned so Month Six ghosts never emit light.
- Added camera-distance culling for subpixel instanced details and local-lamp visibility, without changing simulation, collision, time, persistence, player controls, story beats, original geometry ghosts, comparison transforms or component IDs.
- Updated service-worker cache generation and same-origin precaching to include all 13 runtime PNGs. No CDNs, telemetry, login or new runtime dependency.

## Before -> after evidence

| Family | Original source | New source and physical evidence | Proof state |
|---|---|---|---|
| Corridor | Solid panels and basic lamps | Repeating pressure frames, painted doors, ceiling conduits, instanced deck grilles | Source-present, PNG-validated; browser visual UNKNOWN |
| Observation | Basic glass and rectangular console blocks | Fitted faceted frame, frost decal, console face art, service doors, local lamps | Source-present, PNG-validated; browser visual UNKNOWN |
| Meridian silhouette | Ring and spire; inaccurate axial tips | Primary 12 arms preserved; upper/lower spire proportions tested | Deterministic topology tests passing; browser visual UNKNOWN |
| Industrial surfaces | Constant-color PBR primitives | Authored albedo/roughness/stencil assets with runtime TextureLoader and disposal | Physical PNGs verified, loader wired; actual runtime appearance UNKNOWN |
| Performance budget | No detail culling | Instanced repeated surfaces and subpixel distance culling, limited active lamps | Code checked; frame times NOT measured |

## Canon locks and protected behavior

Seven deterministic temporal checkpoints, twelve fixed docking-arm IDs, source-ordered removal, unchanged player/route memory and save format, reversible debris trajectories, the Month Six vanished-room coordinate, physical (not ghost-conscious) named body landmarks and bounded Virgil weather are retained. No new Tiger visual, named victim identity, death count, story beat or canonical station infrastructure is invented. The six existing landmark silhouettes were **not** altered: a physical identity-accurate upgrade requires a separate verified reference-to-model workflow.

## Actual validation this run

- `python tools/validate_materials.py`: **PASS** — 13/13 source image files decoded, nonblank and SHA-256-indexed; material pixel QA image inspected.
- `npm test`: **PASS, 22/22** — 19 inherited deterministic/structural tests plus 3 new asset/lifecycle/renderer-source guards. One existing geometry test now enforces source-reference spire proportions.
- `node --check public/sw.js`: **PASS**.
- Global TypeScript `transpileModule`: 7 runtime `.ts` modules parse without syntax diagnostics. This is **not** a semantic typecheck.
- `npm run typecheck`: **BLOCKED**, `three` and `vite/client` modules unavailable. The env and context-dependent errors are consequences of absent dependencies. Logs saved to `docs/visual/typecheck-unavailable.log`.
- `npm run build`: **BLOCKED** on identical dependency resolution. Log: `docs/visual/build-unavailable.log`.
- Actual Three.js WebGL render, screenshots of Month Zero/Month Six, pointer/touch user paths, mobile performance and lighting outcome: **NOT RUN / UNKNOWN**. In particular **no measured FPS, no claimed in-game improvement** is asserted.

## Bounded next verification in a package-enabled runtime

`npm install && npm run check && npm run preview`. Inspect matched viewpoints (Month Zero observation camera / corridor / wide orbital / Month Six exact former-room camera), toggle original-geometry and comparison, follow a departing arm and inspect removal, verify texture fetching in DevTools and offline caching. Use `__orbitalTomb.getStats()` at fixed viewpoint/month before and after to quantify new draw calls, geometry count and shading overhead. If typecheck or scene render fails, repair only the first concrete error and rerun the affected checks. Do not publish until required scenes pass.
