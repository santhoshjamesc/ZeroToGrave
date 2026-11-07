# Progress / Handoff

_Last updated: 2026-11-08. Source of truth for task status is `TASKS.md`; this file is the narrative handoff._

## Where we are
The full BitLife-style loop is built end to end: title screen → new life → Year Loop → life systems → death → heir or new life, with autosave to 3 slots, cross-life achievements and a graveyard.
Verified: `npm run typecheck`, `npm run lint`, `npm test` (all green), and `expo export --platform ios` (bundles, sounds included).
**Not verified on a device/simulator**: audio playback, MMKV, haptics, animations, layout on real screen sizes. Do `npx expo run:ios` first thing and click through a life.

## What exists
- **Engine (`src/engine`, pure TS, seeded):**
  - `yearLoop/reducer.ts` — Briefing → Focus → Decisions → Commit → Aging. `finishYear` runs the life systems in order: school → work → money → health → people → law → death roll.
  - `game.ts` — `reduceGame(state, action, content)`: the one entry point for the UI. An open `prompt` blocks everything but `RESOLVE_PROMPT`.
  - `actions.ts` — `LifeAction`s. Time-costing ones (activities, crime, job hunt, raise/promotion, study application, meeting people, relationship interactions, check-up, treatment) spend one of 4 yearly **action slots** (`yearLoop.actionsLeft`); money moves are free. Slots refill on age-up. This is the anti-rush rule for the new systems.
  - Systems: `education.ts`, `careers.ts`, `romance.ts` (dating, proposal, wedding, babies, adoption, divorce, exes, NPC deaths, inheritance), `crime.ts` (catch odds, court prompt: plead / fight / bribe, prison, heat), `finance.ts` (tax, rent, mortgage via global debt, investments, asset returns, pension), `health.ts` (hidden → diagnosed conditions, check-up, treatment, surgery), `activities.ts`, `achievements.ts`, `heir.ts`, `meta.ts` (graveyard + cross-life merge).
  - `content.ts` — types for the content registries. The engine never imports `@content`; callers inject a `GameContent`.
  - Choices can carry a `gamble` (win/lose effects resolved by the seeded RNG), so risky options are never pre-rolled.
- **Content (`src/content`):** 36 careers + 10 majors, 26 diseases/injuries/addictions, 45 activities (incl. 6 prison-only), 10 crimes, 18 asset offers, 40 achievements, ~37 events. `gameContent` in `index.ts` is the full registry (`eventPools` is an alias).
- **Persistence (`src/store`):** MMKV (in-memory fallback), 3 slots, crash-safe tmp-swap writes, corrupt-save backup, versioned migrations (`CURRENT_SAVE_VERSION = 2`), meta store (achievements, graveyard), settings (sound, music, haptics, hardcore).
- **UI:** `App.tsx` is a small state router. Screens: Start, NewLife, Game, Slots, Achievements, Graveyard, Settings. In-game tabs: Life, Do, Work, Money, People, Me (Health / Stats / Story / Badges). `PromptModal`, `Toast`, `DeathPanel`.
- **Sound:** `scripts/gen-sounds.ts` synthesises the WAVs in `assets/sounds/`; `src/ui/audio.ts` plays them via `expo-audio`.

## Design decisions worth knowing
- Save shape is v2 (added education, conditions, crime, debt, prompt, lineage, achievements, action slots). v1 saves upgrade through `engine/migrate.ts`.
- Debt is a single global balance (6% interest, 10% auto minimum payment). A financed home adds to it; selling the home does not repay it.
- Addictions need a lifestyle flag (`smoker`, `drinker`, `gambler`, `drugs`) set by activities/events.
- Heirs inherit cash after debts and 30% estate tax, all assets, and siblings; they start at the child's current age.
- `README`-level caveat: tab components get `{ game, act, guarded }`; `act` toasts engine rejections.

## Known gaps / next steps
1. **Run it on a device** and fix whatever layout/audio issues appear (never run in this session).
2. T1.8 Life Plans, T1.9 simulation harness (the bot-life test in `systems.test.ts` is a start), T6.4 balance pass (economy and lifespan are only sanity-checked).
3. Content volume is well short of the targets in TASKS.md (events especially: ~37 of 270; careers 36 of 100; achievements 40 of 50), no eras, country modifiers or traits.
4. T2.5 export/import saves; T4.4 full-screen age-up animation; T5.4 Reanimated micro-animations; T5.6 accessibility pass.
5. Ex-partner/child interactions are basic; no pets, no travel, no school clubs/grades actions.
6. `npm audit` advisories from the Expo toolchain are untriaged. Project is still not a git repo.

## Resume
```
cd /Users/sathosh/Sant/ZeroToGrave
npm test && npm run typecheck && npm run lint   # confirm green
npx expo run:ios                                # dev build (MMKV + audio need it, not Expo Go)
```
