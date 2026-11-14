# The Sixth Month — R7 source uplift and verification

**Verdict: Source/Pure Logic PASS; mandatory release verification BLOCKED.** This is a separate successive revision of the exact Orbital Tomb standalone project, not a museum exhibit or canon rewrite.

## Experience change

**Ride the Remains — physical attachment to moving station geometry**

Anchor now follows the actual reversible translation and XYZ rotation of a living station component, including after the deck becomes non-navigable. Release preserves world position and allows free float. Anchor never attaches to original ghost geometry or an empty former coordinate; fixed original-room camera remains fixed. Movement while attached does not write false walked-footstep evidence.

## Defects found and repaired in this uplift pass

Old anchor held the player at an absolute world coordinate and released exactly when its compartment detached; the initial redesign picked an overlapping outer ring frame instead of the inhabited observation room. Both behaviors are corrected, covered by local/frame, reversal, and overlap tests.

## Original and amended contracts rechecked

- Seven reversible Month Zero through Month Six states with source-ordered deliberate disassembly, and no battle, explosive destruction, supernatural voices or new characters.
- Canon Meridian ring / spire proportion constraints and exactly 12 fixed docking arms in Month Zero; stable piece IDs and no added timeline event/date.
- Actual traversable corridors, collision, free float, safe displacement, observation-room absence at original coordinates, saved personal route, six silent named physical remains.
- Functional old time controls (0.1×–16×), separation watch, six existing witness windows, VFX tied to timeline, visibility controls, reduced motion and texture provenance.
- Existing sample-only atmosphere probe for Virgil; no vacuum weather or sound.
- Original source/canon reference snapshots preserved without edits. Earlier ZIP revisions remain recoverable.
- A previous version remains on Drive; a new upload requires separate connector readback and cannot be asserted by this report alone.

## Final source checks against this exact revision

- `npm test`: **62/62 PASS**. Full output: `docs/R7_TESTS_FRESH_FINAL.log`.
- TypeScript AST parse: **15/15 source modules** without parsing diagnostics. This does not typecheck Three.js.
- All **66** statically referenced interface IDs present in **71** HTML IDs; all local TypeScript module references resolve.
- `node --check public/sw.js`, `bash -n START_MAC.command`: PASS.
- PNG signature check: **15/15** authored runtime images.
- One animation loop retained. Physical shader, WebGL runtime, save interaction, mobile rendering and GPU memory NOT observed in browser.
- `npm run typecheck` and `npm run build`: see specific attempt logs; unavailable `three` and Vite/npm package types prevent semantic build proof in this sandbox. Reconstruct on a dependency-complete Mac with the existing launcher. Do not count source parsing as a build PASS.

## Changed files, deliberate scope

src/attachment.ts, src/main.ts, tests/attachment.test.mjs, tests/cut-navigation.test.mjs, tests/visual-assets.test.mjs, tsconfig.test.json, public/sw.js, README.md, QUICK_START_MAC.md, OPERATIONAL_STATE.md, docs/R7_IMPLEMENTATION_AND_VERIFICATION.md

## Release and Git

R7/R8/R9 are separate downloadable ZIP artifacts, not a Git checkout. No branch, commit SHA, CI run or remote push exists in this local source. Earlier packages are intentionally preserved. No desktop/mobile FPS or AAA finish claim can be verified without a real Vite/WebGL browser execution on target hardware.

**Recursive completion gate:** BLOCKED by unavailable npm package dependencies and missing actual browser/visual/performance proof. No clean full original-contract PASS is claimed.
