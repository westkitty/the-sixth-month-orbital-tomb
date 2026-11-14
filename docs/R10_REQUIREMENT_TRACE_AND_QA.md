# R10 — Requirement traceability & runtime QA

Baseline: delivered and independently tested `THE_SIXTH_MONTH_ORBITAL_TOMB_R9_QA1.zip`, source SHA-256 maintained outside this revision. Source identity and operating constraints are in `CANON_PROVENANCE.md`.

| ID | User-selected opportunity | Implementation and proof route | Current evidence |
|---|---|---|---|
| P001 | Player-performed source deductions | `inquiry.ts` / new controls / persisted `inferred`; wrong/right and prerequisites in `r10-logic.test.mjs` | Source verified; browser needed |
| P002 | Reversible infrastructure dependencies | `services.ts` / `geometry.ts` room lighting and telemetry / controls | Deterministic suite; visible behavior pending |
| P003 | Earned original-coordinate revelation | `absence-visual.ts` / real recorded route / former coordinates / personalized status | Source tests; camera QA pending |
| P004 | Room-specific environmental evidence | Four fixtures and scanner nodes / `forensic.ts`, `geometry.ts` | Source tests; visual QA pending |
| P005 | Physical sense of scale | `scale-flight.ts` + integrated room-to-orbit camera / cancellable, reduced-motion bypass | Math and wiring tests; camera QA pending |
| P006 | Deliberately paced witness beats | `witness-cadence.ts` + original six cut events, optional hold | Math and wiring tests; playback QA pending |
| P007 | Structural contact-acoustic signature | `acoustics.ts`, `sound.ts` with actual physical coupling | Deterministic tests; audio QA pending |
| P008 | Source vs reconstruction perceivable in-world | `provenance-visual.ts` 3 instanced evidence layers; UI legend | Source tests; WebGL QA pending |
| P009 | World-first entry and clear exposure | quiet entry, H restore, interior exposure preference-preserving | Markup/runtime tests pending |
| P010 | Verified performance-first rendering | per-piece instanced boxes, reversible clone ownership, adaptive pixel-ratio tier | Original R9: ~6854 draw calls wide / ~3541 at Month Six; matched R10 browser measurement pending |

## Protected invariants

- Exact Meridian/Virgil universe identity, 12 dock arms, coherent seven checkpoints (Month 0–6), 74 existing modeled removed groups, exact absence, all six named inert dead, no new fictional lore.
- All R9 QA1 controls (collision, float, anchoring, reverse timeline, witness cut, saved state, geometric source clones, focus comparison, touch, audio opt-in, offline support, visibility) must remain functional.
- Original R9 QA1 and all prior ZIPs must remain unchanged; no remote repository push, no forced publish, no hidden paid service.

## Acceptance level

`npm run check` must pass semantic TypeScript, full deterministic tests, and production build. Real WebGL QA should inspect Months 0–6, new case progression and save/reload, room service lights, earned absence with and without actual prior path, sound contact/vacuum, provenance overlay, continuous scale camera, paced witness, quiet-mode reversal, collision, touch, capture real screenshots and compare source draw calls. Representative device FPS, physical touch, and longer-session memory remain distinct proof gates. **No production release PASS without those.**


## R10 QA2 verified closure (2026-11-14)

The table above describes initial source-only RC1 evidence. The final tested result is **R10 QA2**. All P001-P010 now have actual source implementations and are traced in `R10_QA2_RUNTIME_VERIFICATION.md`. Big Mac's semantic typecheck + Vite build and 93/93 source tests PASS; 27/27 legacy WebGL interaction assertions, 18/18 R10 feature assertions, five camera assertions, and forced-offline WebGL reload PASS. The only proven source defect found in the final fresh interaction pass (inquiry case change left submission disabled) is fixed and regression-protected. The eye-level scale transition was also visually corrected and shuttered. Device-level FPS, real touch, audio subjective quality and long-session resource proof remain openly UNVERIFIED. This is an implemented and automated-verified candidate, **not release certification**.
