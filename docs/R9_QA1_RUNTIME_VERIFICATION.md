# The Sixth Month / Orbital Tomb R9 QA1 - independent runtime verification

**Date:** 2026-11-13 America/Detroit (2026-11-14 UTC). **Verdict:** Source and automated browser paths verified; full release gate remains **OPEN** pending foreground-device FPS and physical mobile touch evaluation.

## Source and execution identity

Original R9 Google Drive object: `1PeZHBCowXtQOGMzu9hgueYDX5n6mpdzs`, in Orbital Tomb folder `1A16leSvHIcYCk9ToNk-T21NVz8snjUyw`. Original ZIP SHA256 `0e0a8d374fd2c1b357bb36dc025c351273234ef91e16dda6594e3d302b9a30fd`, 14,561,711 bytes. Verified byte-for-byte across Drive to an isolated Big Mac work directory via authenticated MacBook Drive access and pinned SSH host identity. All prior versions and original R9 remain untouched. No Git repository, no commit, no push, no publication.

Machine: DEX//REACH `bigmac` node, Apple M4, Darwin arm64, user `bigmac`, Node 26.13.1, npm 11.20.0. Isolated build path `/Users/bigmac/Projects/_orbital_tomb_runtime_checks/R9_20261113/THE_SIXTH_MONTH_ORBITAL_TOMB_R9`.

## Two bounded source repairs, exact remote SHA256 matches

1. `index.html` - one original inline SVG favicon declaration, removing reproducible browser 404 for `/favicon.ico`. Repaired source SHA256: `42b4113c85dd01418d93f6ce11df06655b57b4b3e5c2c967afb5f01923b11847`.
2. `src/main.ts` - include `location.hostname==='127.0.0.1'` in the existing secure-origin service-worker registration guard, so the documented localhost preview works offline. Repaired source SHA256: `dac63860334b6b2bb3ffa2982dfbc96bb133a7644602936bf8bdcfe756329179`.

Both files in this QA1 package are byte-identical to their built-and-tested repaired copies on Big Mac. Everything else in the runtime source was preserved. There are no added runtime dependencies, gameplay features, fictional events or canon changes.

## Actually executed tests

- `npm install --no-audit --no-fund --prefer-offline` - 22 declared project dependencies installed in isolated extraction.
- `npm run check` - **PASS**, includes semantic `tsc --noEmit`, **73/73 Node tests**, and Vite 7.1.12 production build. Main JS output approximately 638.09 kB (166.64 kB gzipped); Vite emitted a non-fatal >500 kB chunk advisory.
- Real Brave 157 (headless private profile) production WebGL2: **PASS**; ANGLE Apple Metal on M4, context not lost, original authored textures render.
- Automated CDP browser suite: **27/27 PASS**, **0** console/resource errors, after repair. Tested months 0–6, census 74 components in place at Month0 and 0 in place at Month6, original-room coordinates, R7 anchored fragment departure/reversal, R8 selected focused comparison/save/reload, R9 synthetic one/two-touch, pinch, pointercancel, mouse recovery and void pointer-lock fallback, witness pacing, visibility and reduced-motion controls, mobile 390x844 layout, and genuine viewport captures.
- Additional browser probes: **5/5 PASS**. Real Shift+W walked and stopped at the observation window (Z roughly -87.7), late free-float recovery, and four timeline scrub cycles did not show continuing growth of observed GPU geometry or texture resource counts after initial allocation.
- Service-worker proof: registration active under `127.0.0.1`; cached current hashed JS, CSS, index and 15 local textures; CDP forced OFFLINE; on reload `window.__orbitalTomb` and WebGL2 reinitialized, service-worker controller present. **PASS**.
- 17 real WebGL PNG screenshots saved in the separately delivered R9 runtime QA evidence ZIP: all months 0–6, Month0 interior, Month6 former-room absence, focused comparison, witness, sparks, visibility, and four mobile states. Screenshot evidence is a single rendered instant, not proof of continuous fluidity.

## Limitations preventing release PASS

- The headless browser throttles `requestAnimationFrame` to a roughly 200 ms interval even on **about:blank**. Its measured ~5–9 callbacks/sec are NOT a valid estimate of game FPS. Attempted headed browser was a background window, with animation suspended; representative **foreground desktop frame time and long-session thermal behavior not verified**.
- GPU draw calls are high: about 6,854 in Month0 wide orbit and 3,541 in Month6 wide orbit; this is a likely optimization opportunity, not itself proof of inadequate frame rate.
- Browser touch input was simulated using CDP and delivered genuine pointer events. **No physical tablet/phone was tested.** Usability, touch affordances and real-device frame time remain unverified.
- Visual screenshots were inspected for major spatial state changes; detailed screen-by-screen aesthetic/canon acceptance and prolonged runtime remain unverified.

**Release verdict: PARTIAL / GATE OPEN.** Do not present this package as AAA-certified. It contains the two independently verified fixes and complete original source. Original R9 and all prior revisions remain preserved.
