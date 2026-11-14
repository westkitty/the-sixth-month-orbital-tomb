# THE SIXTH MONTH / Orbital Tomb — R12 Monumental Industrial Elegy

**Status: implemented source candidate, not browser-certified or commercial-release-ready.**
**Basis:** an isolated copy of complete R11 ZIP, unchanged R11 and earlier archives. Three.js 0.185.1, TypeScript, Vite. New ZIP must be distributed as a separate revision.

## Source and AWE decision

The existing world is a deliberate six-month dismantling of Meridian in orbit around Virgil, **not combat, not an explosion**, and not an official reconstruction of exact month assignments. R12 selects the signature **"The Coordinates Remember Only You"** over the already implemented service-failure and orbital-scale contenders. The original lost room remains physically absent at Month Six. The only additional trace comes from the actual user's saved Month Zero movement (0 to 180 points, up to 72 actual sampled footfall marker instances). On explicit request, the player may isolate the existing *observation room original-geometry wireframe*, but no solid or walkable floor is restored, and a later G toggle or leaving the location clears the focus.

See `docs/R12_AWE_CONTRACT.md` for three challengers, falsification and continuity locks. **A design hypothesis about the player's emotions is not a human playtest.**

## Implemented, not merely proposed

1. **Monumental industrial elegy:** coherent restrained bronze/champagne and cold structural materials; a plausible gasket, sill, fasteners and maintenance fittings around the observation viewport; original source-proportioned silhouette and three actual Microsoft Rocketbox illustrative occupants preserved without identifying them as historical dead.
2. **Actual-action guidance:** only actionable steps offered. Instead of permitting an ineffective scan while far from evidence, the first objective points at a single physical source-node fitting. An opt-in `FACE SURVEY MARKER` action rotates the camera toward the node without teleporting the player, bypassing collisions, or inventing walkable paths. The diamond marker derives from the actual world-coordinate inspection node and is disposed with the scene.
3. **Signature spatial trace:** Month Six former-room view adds at most 72 tiny instanced, translucent, non-solid marks at *recorded player positions* only; the actual route line is retained. A player without genuine earlier route receives **no** invented footfalls or recovered memories.
4. **Bounded source comparison:** at Month Six the contextual guide can reveal *only* the original observation room's existing ghost mesh; all broader ghost/temporal comparison tools are preserved independently and the outline is explicitly non-colliding.
5. **More efficient geometry:** identical cylinder geometries are cached and reused, beams scale the unit cylinder, and opaque repeated sub-meshes sharing geometry and material are instanced **within their own independent structural fragment**. No mixing between differently drifting or separately inspectable pieces.
6. **Lower recurring GPU work:** contact-trace vertex storage is preallocated once instead of replaced per recorded change. Source-classification overlays don't upload matrices repeatedly while chronology is unchanged. Shadow-map updates are event-driven while the modeled station is static; illustrative population never casts station-size shadows. Visual-distance culling budget runs at a bounded cadence rather than every rendering frame.
7. **Selectable render quality:** high/standard/economy resolution ceilings with bounded hysteresis; choice persists via an additive optional property in the unchanged v1 save schema. Existing saves safely normalize to standard. Reduced-motion and accessibility controls remain functional.
8. **Visual and interface craft:** stronger editorial start composition, consistent readable instrument surfaces, accessible focus and touch layout, quieter context-sensitive guidance, and explicit reduced-motion CSS. No new CDN, runtime dependency, crew voice, canon event, or empty spectacle effect.
9. **Measurement hooks:** actual render-loop `frameP50Ms`/`frameP95Ms` and sample count plus existing `renderer.info` metrics exposed in the local QA hook. These are **measurement capabilities, not measured performance claims**.
10. **Offline freshness:** cache key bumped to `sixth-month-static-v15`, preserving all bundled textures and the exact same three optimized GLBs for cached playback after a successful online install.

## Protected invariants and acceptance matrix

| User journey / constraint | Evidence currently available | Status |
| --- | --- | --- |
| Month Zero walk and WASD start, separate Continue | R11 implementation retained, R12 source assertions | SOURCE-VERIFIED; live browser not rerun |
| All seven months, 12 docks, 74 removable structural groups, original coordinate absent | deterministic `domain` suite and R12 checks | PASS in pure tests |
| Collision, free float, anchor/release, reverse and temporal comparison | source contracts and carried-forward existing tests | PASS in pure/source tests, R12 live browser NOT VERIFIED |
| Evidence inquiry, source classifications, six witnessed cut windows | inherited deterministic suite | PASS in source tests |
| Three actual Rocketbox MIT human GLBs, unchanged checksums and embedded skin/animations | exact R11 original files, binary/hash/GLB tests retained | PASS structural; R12 rendered appearance NOT VERIFIED |
| True earned spatial memory, no fictitious ghosts or surfaces | guide/route tests; nonphysical scene source guards | PASS logic/source; live visual readability NOT VERIFIED |
| Scene GPU resource lifecycle and real draw-call improvement | caching/batching/disposal tests only; no matching browser metrics | IMPLEMENTED-UNVERIFIED performance impact |
| Persisted manual quality and backward-compatible old saves | new `r12-uplift.test.mjs` tests | PASS pure tests |
| Source parse / test suite | global TypeScript 5.8.3 syntax transpilation, `npm test` | **27/27 TS files parse; 107/107 tests PASS** |
| Semantic TypeScript check and Vite production bundle | `npm install` returned `EAI_AGAIN`; `three`, Vite packages not installed | BLOCKED (not PASS) |
| Real WebGL browser screenshots and matched foreground FPS p50/p95 | DEX//REACH unavailable (internal tool failure); Remote Desktop Commander Mac offline | UNKNOWN / REQUIRED FOR RELEASE |
| Physical touchscreen, long-session resource and speaker-level audio proof | no physical-device run | UNKNOWN / REQUIRED FOR RELEASE |
| Offline reload on R12 v15 | source precache test; no service-worker controlled browser replay | SOURCE-VERIFIED ONLY |

## Proof limitations

The previously verified R10 QA2 Metal browser screenshots and matched R9 draw-call reduction belong **only to their exact older binaries** and cannot be promoted to R11 or R12. A valid browser build, opening-avatar visibility and floor contact, thermal behavior, visual comparative screenshots, and objective AAA-quality claim require a true live R12 pass. At present `npm run check` cannot succeed locally because an npm registry DNS outage blocks the pinned packages; no semantic typecheck/build pass is claimed. `npm test` uses the global TypeScript test-target compilation and Node tests, while the source-transpilation scan checks syntax but **not types**. There is no Git checkout; no commit/push is appropriate.

## Files and impact radius

Direct R12 source changes: `src/main.ts`, `src/geometry.ts`, `src/guidance.ts`, `src/wayfinding.ts` (new), `src/absence-visual.ts`, `src/provenance-visual.ts`, `src/quality-budget.ts`, `src/ui.ts`, `src/save-model.ts`, `src/styles.css`, `index.html`, `public/sw.js`, R10/R11 source-wiring tests updating expected contracts, new `tests/r12-uplift.test.mjs`, project README and `OPERATIONAL_STATE.md`. Protected unchanged original GLBs, screenshots/reference captures, canon, time data, collision domain, physics/input system and launcher.

## Exact launch path

Download `THE_SIXTH_MONTH_ORBITAL_TOMB_R12.zip` to `~/Downloads`, then run:

```bash
cd "$HOME/Downloads" && mkdir -p "Orbital-Tomb-R12" && unzip -n "THE_SIXTH_MONTH_ORBITAL_TOMB_R12.zip" -d "Orbital-Tomb-R12" && cd "Orbital-Tomb-R12/THE_SIXTH_MONTH_ORBITAL_TOMB_R12" && bash ./START_MAC.command
```

Requires Node.js ≥20.19 and a working npm registry for the first dependency install. The launcher serves localhost; never open `index.html` with `file://`. No browser deployment or public sharing was performed.

## Exact live validation still needed

On an authorized machine with Node/dependencies: `npm run check`, then start the built Vite production preview and verify Month 0 start, 3 crew glTF models, WASD/collision, physical inspector beacon, 6 cut windows, Months 0-6, source ghost comparison, visitor-earned Month 6 former-room outline/absence, quality tiers, offline reload and 390x844 viewport. Capture before/after R11 and R12 at **matched** viewport, DPR, quality tier and browser with true foreground frame p50/p95, render calls and GPU resource counts; repeat several chronology scrubs and check all CPU/GPU resources settle. Physical-touch and speaker listening remain separately required.
