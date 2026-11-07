# ZeroToGrave

A BitLife-style life-simulation game. React Native + TypeScript (Expo). **Fully frontend, offline, local storage only. No backend, no accounts, no network calls.**

## Differentiators (every feature must serve one of these)
1. **More engaging + visual**: animated scenes, illustrated avatar, life timeline, haptics, sound.
2. **More variety**: large data-driven content pools (events, careers, diseases, relationships, countries, eras).
3. **More control**: player chooses actions, allocates yearly time/energy, sets life plans, and picks among event responses (not one-tap outcomes).
4. **Cannot be rush-played**: aging is gated by a per-year "Year Loop" (see `docs/GAME_DESIGN.md` and the `ztg-anti-rush-pacing` skill). No infinite tap-to-age.

## Stack
Expo (dev build) · TypeScript strict · Zustand · react-native-mmkv · React Navigation · Reanimated 3 + Skia · Jest + React Native Testing Library.

## Rules
- Game logic lives in `src/engine` as pure TS (no React imports). UI lives in `src/ui`. Content is data in `src/content`.
- Engine must be deterministic given a seed (seeded RNG) so it is testable.
- No network libs, analytics, or remote assets. All assets bundled.
- Save format is versioned; any state-shape change needs a migration (`ztg-local-persistence`).
- Tasks are tracked in `TASKS.md`. Update checkboxes when work lands.

## Skills
See `.claude/skills/ztg-*`. Use them before touching the related area.
