# R3 — Collision & Observability Uplift

**Intent:** Fix the existing R2 prototype, not replace the Meridian/Virgil project, or introduce canon events.

## Implemented changes
- `src/collision.ts`: Pure deterministic world collision catalogue, including live hulls, pressure walls, front observation pane, ceilings/decks, command consoles, cryo pods, hydroponic planters, freight crates, spires, trusses. Swept substeps <=0.38 world units; wall sliding; safe floor-loss transition to float. Ghost and departed geometry are excluded. Collision is a purpose-specific approximation of visible primitives, not a general 3D rigid-body physics engine.
- `src/geometry.ts`: radial spokes translated to a structural under-deck plane, central command's -Z portal opened, center aisle through observation consoles widened, matching physical collision catalogue. Historical silhouette and twelve docking arms untouched.
- `src/save-model.ts`, `src/ui.ts`, `src/main.ts`, `index.html`, `src/styles.css`: visible 0.1x, 0.25x, 0.5x, 1x, 2x, 4x, 8x and 16x reversible time control; BRIGHTEN shortcut (L) and variable exposure/ambient/local inspection light; event-tracking orbital watch (J). Settings normalize existing schema-1 saves safely. One render loop remains.
- `src/separation-vfx.ts`: bounded procedural electrical cut sparks, line streaks and seam halos at attachment joints, including reversals and time scrubs. Up to twelve joints active in a frame. No explosion, smoke, souls, combat, or debris generation unrelated to existing removal transforms. VFX materials and geometry are disposed.
- `public/sw.js`: cache version 5; prevents stale R2 JavaScript or CSS after a rebuild.

## Verified in this execution environment
- Node deterministic/domain/static suite: **31 / 31 passed** (`tsc -p tsconfig.test.json && node --test tests/*.test.mjs`).
- **9 / 9** runtime TypeScript module files passed syntax-only transpilation.
- Actual numeric movement checks demonstrated: former-room starting position unblocked; observation -> radial corridor -> command passage traversable, solid window stops attempted traversal, adjacent walls stop sprint tunnelling, floor stops free-float descent, absent Month Six structure does not leave a phantom collider.
- Original 15 PNG runtime textures unchanged and validated by existing test suite.
- Shell syntax of Mac launcher validated with `bash -n`.

## Explicit limits
- npm registry DNS still failed (`EAI_AGAIN`) from source container; full semantic TS typecheck, Vite build and WebGL browser rendering not verified.
- Visual quality, camera composition of effects, input feel, scene brightness, mobile performance and frame-time budgets need matched desktop-browser proof. Do not use **release verified** status before real checks.
- Month-to-effect mapping is the original R2 reconstruction; only the effects and controls changed. Do not imply exact real-world historical months.
- Collision shapes are explicitly bounded approximations of existing visible meshes, not pixel/triangle perfect collisions.

## Browser acceptance path (on Mac after startup)
1. At Month Zero walk the observation room; confirm hull, viewport and console block contact and the radial doorway leads to command.
2. Switch to FLOAT, move toward the floor and side hull; confirm collision and sliding; switch to ORBIT and verify stable exterior silhouette.
3. BRIGHTEN and inspect both station interior and exterior, ensure no nearly black important architecture.
4. WATCH SEPARATIONS, play at .1x; verify several sparks at dock attachment seams, then 2x, 8x, 16x.
5. Reverse across a cut, scrub directly to fractional months, confirm sparks follow the visible seam and no stale effects persist at endpoints.
6. Stand on a late-departing supported floor, advance time; verify safe release into float rather than falling through non-existent wall.
7. Month Six, return to former-room coordinates; verify no phantom collision and the original void reveal.
8. Test reduced motion and effects=0, pause/play persistence, pointer lock, touch, resize, repeated open/close and FPS on intended hardware.

## Preservation
No museum integration, no canon registry writes, no source images modified, no R2 ZIP overwritten, no deployment.
