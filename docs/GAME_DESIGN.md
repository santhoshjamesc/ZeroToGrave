# ZeroToGrave: Game Design

## Core loop: the Year Loop (anti-rush)
BitLife = tap "Age". ZeroToGrave = each year has phases that must be completed before aging:

1. **Season Briefing**: animated summary of the last year (stat deltas, news).
2. **Focus Allocation**: player has 10 *Focus Points* per year (reduced by illness, kids, job). Spend on: Study, Work, Fitness, Social, Hobby, Rest, Family, Side-hustle. Each has diminishing returns and visible effects.
3. **Mandatory Decisions**: 1-3 life events per year the player must resolve (no skip, no auto-resolve). Each has 2-5 choices with tradeoffs, risk shown as qualitative hints (not exact odds).
4. **Reflection / Commit**: review the year's choices; "Age Up" unlocks only here, with a short animated transition (min ~2s, not skippable by spam tapping).

Additional anti-rush mechanics:
- Age Up button disabled until Focus is allocated and mandatory events resolved.
- Life Plans (multi-year goals) need ongoing choices; they do not complete automatically.
- Decisions have memory: actions earlier change later event pools (cascading consequences).
- No "skip 10 years" feature. Early childhood years are compressed into richer milestone chapters, not skipped.
- Optional Hardcore mode: no undo, no peeking at risk hints.

## Control
- Choose country/era/family/starting traits (or random).
- Per-year Focus allocation, relationship management (invest time), career paths with branching choices, health plans, finance (budget, invest, debt), legal choices.
- Settings for difficulty, content toggles, pacing.

## Variety
- Eras (e.g. 1950s, 1990s, modern, near-future), 20+ countries with different systems.
- 100+ careers with ladders, 300+ events at launch (data-driven), diseases, crimes, hobbies, relationships, personality traits, random "life chapters".
- Multiple endings; Legacy system (descendants / heirs continue).

## Visuals
- Layered illustrated scenes per life stage (home, school, office, hospital) with parallax and ambient animation.
- Procedural avatar that ages and reflects traits, clothing, health.
- Life timeline (scrollable ribbon of milestones), stat rings, animated transitions, haptics, music/SFX.
- Final "Grave" screen: life summary, graph of stats, epitaph.

## Persistence (local only)
MMKV storage. Multiple save slots, autosave at each phase transition, versioned schema with migrations, export/import save as local JSON file (via share sheet, no server).

## Screens
Main Menu · New Life · Year Loop (Briefing/Focus/Decisions/Commit) · Life Feed · Stats · Relationships · Career · Finance · Health · Achievements · Legacy · Settings · Death/Grave summary.
