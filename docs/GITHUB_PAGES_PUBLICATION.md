# GitHub Pages publication state

Scope: dedicated `westkitty/the-sixth-month-orbital-tomb` repository, branch `main`.
Do not change or push to the older `orbital_tomb_tour` or `orbital_tomb_station_sim` repositories.

## Published artifact contract

- The imported R13 source is preserved. Its original SHA-256 manifest is preserved byte-for-byte as `docs/R13_ARCHIVED_SOURCE_MANIFEST.sha256` for checks against the original R13 ZIP. The current root `MANIFEST.sha256` covers this updated Git checkout, including publication workflow files and operational state.
- `.github/workflows/pages.yml` runs source checks, a Vite build and publishes **only `dist/`**.
- `vite.config.ts` uses relative `base: './'`; runtime assets and offline service worker use this base.
- The site includes `THIRD_PARTY_NOTICES.txt` for the three Rocketbox GLBs and Three.js.
- The website is publicly accessible if GitHub Pages deploys, **even if the GitHub repository is private**.
- A private repository needs an eligible GitHub plan to use Pages. On GitHub Free, a Pages-capable repository must be public. Do not switch repository visibility automatically.

## Verified and unverified

- Source R13 Git commit and bundle are local and integrity-verified.
- Source's archived Big Mac R13 typecheck/118-test/Vite/WebGL evidence is documented in `OPERATIONAL_STATE.md` and `docs/R13_BROWSER_QA_SUMMARY.md`.
- **Not verified yet:** GitHub repository creation, GitHub push, Actions workflow execution, Pages activation, live URL, remote content parity, real touch, representative foreground FPS, long-session endurance and human audiovisual acceptance.
- The `npm install` job uses pinned top-level dependency versions in package.json. Because the original R13 source has no `package-lock.json`, the remote workflow resolves transitive dependencies at build time. A verified lockfile should be added when a registry-capable environment is available.

## Activation (when GitHub credentials are available)

1. Create a **new empty private** repository `westkitty/the-sixth-month-orbital-tomb` with no initial README, license or .gitignore. Do not reuse any existing Orbital Tomb repository.
2. Push the verified local `main` branch using normal authenticated Git. Verify the remote SHA matches the local SHA.
3. Open repository **Settings > Pages > Build and deployment > Source: GitHub Actions**. The workflow does not enable Pages automatically, because this would require elevated credentials.
4. Verify successful **Build, verify, and publish The Sixth Month** workflow and live site at `https://westkitty.github.io/the-sixth-month-orbital-tomb/`. That URL is a target, not a confirmed live site.
5. Spot-check Month Zero walk, Month Six absence, offline service worker reload and model loading. Preserve the unresolved hardware/qualitative release gates.
