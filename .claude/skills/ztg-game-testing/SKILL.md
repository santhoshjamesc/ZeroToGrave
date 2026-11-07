---
name: ztg-game-testing
description: Use when writing or running tests for ZeroToGrave: engine unit tests, seeded simulations and balance checks, content validation, component tests, CI.
---

# Testing

## Layers
1. **Engine unit tests** (Jest, no RN): deterministic via seeded RNG. Test reducers, gates, effects, mortality, focus math.
2. **Content validation**: `npm run content:validate` (unique ids, valid refs, age ranges, weights > 0, every event has ≥2 choices, flags set before they are read).
3. **Simulation harness** (`scripts/simulate.ts`): run N=1000 seeded lives with random-but-legal policies. Report: age-at-death distribution (median ~70-80 default), event frequency, unreachable events, dominant-choice detection, stat extremes. Fail CI if thresholds break.
4. **Component tests** (React Native Testing Library): Year Loop gating UI, focus allocation, decision cards.
5. **E2E** (Maestro or Detox) for one full life playthrough, including save/kill/reload.

## Rules
- Fix the seed in any test that involves randomness; print the seed on failure.
- New engine feature = tests in the same change. Pacing gates and save migrations are mandatory-test areas.
- CI (`.github/workflows/ci.yml`): `tsc --noEmit`, `eslint`, `jest`, `content:validate`.
