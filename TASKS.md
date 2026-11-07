# ZeroToGrave: Tasks

Legend: `[ ]` todo · `[~]` in progress · `[x]` done. Size: S (<½d) M (1d) L (2-3d) XL (week+).
Skill hint in brackets, e.g. [arch] = `ztg-architecture`.

## Phase 0: Setup
- [x] T0.1 (S) Init Expo + TypeScript strict project in repo root (`npx create-expo-app`, dev client) [arch] — expo-dev-client added
- [x] T0.2 (S) ESLint, Prettier, path aliases (`@engine`, `@ui`, `@content`), Jest config [arch][test] — aliases resolve in Metro via tsconfig paths
- [x] T0.3 (S) Folder structure: `src/engine`, `src/content`, `src/ui`, `src/store`, `src/assets` [arch]
- [x] T0.4 (S) GitHub Actions CI: typecheck, lint, test [test]
- [ ] T0.5 (S) Design tokens (colors, spacing, type, themes light/dark) [visuals]

## Phase 1: Engine core (pure TS)
- [x] T1.1 (M) Seeded RNG utility + tests [arch][test]
- [x] T1.2 (M) Core types: `Character`, `Stats`, `Trait`, `Relationship`, `Job`, `Asset`, `GameState` [arch] — core types in `src/engine/types.ts`; Relationship/Job/Asset are minimal stubs
- [x] T1.3 (L) Year Loop state machine: Briefing → Focus → Decisions → Commit → AgeUp [pacing]
- [x] T1.4 (M) Focus Points system with diminishing returns and modifiers [pacing]
- [~] T1.5 (L) Event engine: conditions, weights, cooldowns, cascades, effects [events] — basic eligibility + weighted draw + effects + fallback guarantee; TODO conditions union, cooldowns, cascades
- [x] T1.6 (M) Stat system (health, happiness, smarts, looks, karma, energy) with aging curves [arch]
- [x] T1.7 (M) Mortality model (age, health, lifestyle, accidents, diseases) [arch] — Gompertz + health/accident/illness; flat-health median test only
- [ ] T1.8 (M) Life Plans (multi-year goals) engine [pacing]
- [ ] T1.9 (M) Simulation test harness: run 1000 seeded lives, report age-at-death distribution, balance [test]

## Phase 2: Persistence (local only)
- [x] T2.1 (M) MMKV wrapper + Zustand store with persistence [persist] — `src/store` kv (MMKV + memory fallback), settings, meta
- [x] T2.2 (M) Save slots (create/load/delete/rename) [persist] — 3 slots; Load/Pick screens
- [x] T2.3 (M) Autosave at each Year Loop phase transition, crash-safe write (temp key → swap) [persist] — autosave on every state change via App `onChange`; tmp→verify→swap
- [x] T2.4 (M) Save versioning + migration framework + tests [persist][test] — `migrations.ts` (v1→v2) + tests
- [ ] T2.5 (M) Export/import save JSON via share sheet / document picker [persist]

## Phase 3: Content (data-driven)
- [ ] T3.1 (M) Event schema + validator script (`npm run content:validate`) [events]
- [x] T3.2 (L) Childhood events (0-12) ×60 [events] — 69 in `childEvents.ts`
- [x] T3.3 (L) Teen events (13-17) ×60 [events] — 68 in `teenEvents.ts`
- [x] T3.4 (L) Adult events ×100 [events] — 139 in `adultEvents.ts`, with needs/trait gates and flag cascades
- [x] T3.5 (L) Senior events ×50 [events] — 63 in `seniorEvents.ts`
- [x] T3.6 (L) Careers: 100 [events] — 134 careers (`careers.ts` + `moreCareers.ts`)
- [x] T3.7 (M) Diseases, injuries, treatments [events] — 26 diseases/injuries/addictions, hidden diagnosis, treatment + surgery
- [~] T3.8 (M) Countries (20) [events] — 22 countries; `countryProfiles` modifiers written in `moreCountries.ts` but not yet used by the engine
- [ ] T3.9 (M) Eras (4) with modifiers and era-specific events [events]
- [x] T3.10 (M) Names, cities, traits pools [events] — 40+ personality traits in `traits.ts`; hobbies pool todo
- [~] T3.11 (M) Achievements (50) [events] — 40 achievements in `src/content/achievements.ts`; needs 50

## Phase 4: UI & navigation
- [ ] T4.1 (M) React Navigation setup, screen shells [arch]
- [x] T4.2 (M) Main menu + New Life (country/era/family/traits, or random) [arch] — random roll + reroll done (name/gender/country/city/look/family); start screen + back button done; no era/trait pickers
- [~] T4.3 (L) Year Loop UI: Briefing, Focus allocation (sliders/dials), Decisions, Commit [pacing][visuals] — card-based Year Loop (Briefing/Focus/Decisions/Commit) + action slots; no sliders/dials
- [~] T4.4 (M) Age-Up transition (non-skippable minimum duration, haptics) [pacing][visuals] — progress card + haptic; no full-screen animation
- [~] T4.5 (M) Life Feed / timeline ribbon [visuals] — Story tab lists `character.log`; no ribbon yet
- [~] T4.6 (M) Stats screen with animated rings/graphs [visuals] — animated bars; no rings/graphs
- [x] T4.7 (M) Relationships screen + interactions (invest time, conflict, gifts) [arch] — People tab: dating, proposal, wedding, babies, adoption, divorce, exes
- [x] T4.8 (M) Career screen (ladder, branching choices, side-hustle) [arch] — Work tab: job board, raise/promotion/quit/retire, school + degrees
- [x] T4.9 (M) Finance screen (budget, invest, debt, property) [arch] — Money tab: assets, mortgage, investments, debt, cashflow
- [x] T4.10 (M) Health screen (conditions, treatments, lifestyle plan) [arch] — Me > Health: check-ups, treatment, surgery, lifestyle
- [x] T4.11 (M) Achievements + Legacy screens [arch] — Badges panel + Achievements screen; Legacy shown via lineage on People tab + Graveyard
- [~] T4.12 (M) Settings (difficulty, hardcore, pacing, sound, haptics) [arch] — Settings screen (sound/music/haptics/hardcore, wipe data); difficulty/pacing pending
- [~] T4.13 (M) Death/Grave summary screen with stat graph and epitaph [visuals] — death panel with epitaph + stats + heir picker; no stat graph yet

## Phase 5: Visuals & audio
- [x] T5.1 (L) Procedural aging avatar (Skia/SVG) with traits, clothing, health [visuals] — react-native-svg; 7 life stages, mood/health/wrinkles/grey hair; tap reactions + haptics
- [~] T5.2 (L) Layered parallax scenes per life stage (home, school, office, hospital) [visuals] — sky/clouds/skyline per stage; no hospital/parallax yet
- [ ] T5.3 (M) Event illustration system (per-event art key → bundled asset) [visuals]
- [ ] T5.4 (M) Micro-animations: stat deltas, button feedback, card transitions (Reanimated) [visuals]
- [x] T5.5 (M) Haptics + SFX + ambient music (bundled, toggleable) [visuals] — generated WAVs (`scripts/gen-sounds.ts`), `src/ui/audio.ts`, haptics/sfx toggles
- [ ] T5.6 (S) Accessibility: reduce-motion, font scaling, contrast, screen-reader labels [visuals]

## Phase 6: Depth & polish
- [x] T6.1 (L) Legacy / heir system (continue as child) [arch] — `engine/heir.ts` (estate tax 30%, siblings, lineage) + DeathPanel
- [~] T6.2 (M) Hardcore mode (no undo, hidden risk hints) [pacing] — hardcore setting hides risk/odds hints; no-undo is moot (no undo exists)
- [ ] T6.3 (M) Cascading consequence memory (flags, long-term effects) [events]
- [ ] T6.4 (M) Balance pass using simulation harness [test]
- [ ] T6.5 (M) Performance pass (list virtualization, memoization, Skia budget) [visuals]
- [ ] T6.6 (M) E2E tests of full life playthrough [test]
- [ ] T6.7 (M) App icon, splash, store listing assets, EAS build config [arch]

## Definition of done (every task)
Typecheck + lint + tests pass · no network calls added · save migration included if state changed · pacing rules not bypassed · TASKS.md updated.

## Notes
- Added UI deps: react-native-svg, expo-haptics, expo-linear-gradient, react-native-safe-area-context (all need a dev-build rebuild: `npx expo run:ios`). Animations use RN `Animated` for now, not Reanimated.
- `Character` gained `identity` + `log`; save format is now `version: 2` (v1→v2 migration in `src/store/migrations.ts`). Add a migration once T2.4 lands.

## Phase 6: Character depth (added)
- [x] T6.1 Age gates: `ageGates.ts` (focus areas, jobs, college, dating, shop, crime), UI locks + 'unlocks later'
- [x] T6.2 Personality traits (birth + acquired), family wealth, trait-biased events, NPC personalities
- [x] T6.3 Micro-expressions: temperament faces, idle flickers, event reactions; unique face features per person
- [x] T6.4 Event schema: tags, needs, forbidsFlags, requiresTraits, once/cooldown
- [ ] T6.5 Use `countryProfiles` (wealth/healthcare/education) in engine; old saves have no traits (no migration needed)
