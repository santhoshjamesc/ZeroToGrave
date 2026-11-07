---
name: ztg-architecture
description: Use when creating or changing project structure, engine/state types, navigation, or deciding where code belongs in ZeroToGrave (React Native + TypeScript, offline-only).
---

# ZeroToGrave architecture

## Layout
```
src/
  engine/    pure TS game logic, NO react / react-native imports
  content/   data: events, careers, diseases, countries, eras (typed objects/JSON)
  store/     Zustand store + MMKV persistence glue
  ui/        screens/, components/, theme/, animations/
  assets/    bundled images, audio, fonts
  utils/     rng, ids, math
```

## Rules
- Engine functions are pure: `(state, input, rng) => newState`. No Date.now()/Math.random(); use injected seeded RNG and game-clock.
- Content is data validated by `npm run content:validate`; engine reads it via registries, never hardcodes events.
- TypeScript `strict: true`; no `any` (use `unknown` + narrowing). Discriminated unions for effects/conditions.
- UI reads state via selectors; UI never mutates engine state directly, only dispatches engine actions.
- Absolutely no network access: no fetch/axios/analytics/remote fonts or images. Flag any PR adding a networking dependency.
- Prefer Expo modules; use a dev build (not Expo Go) because of MMKV/Skia.
- Naming: files `camelCase.ts`, components `PascalCase.tsx`, tests `*.test.ts` next to source.

## Checklist before finishing a change
Typecheck, lint, tests; engine still React-free; state-shape change has a migration.
