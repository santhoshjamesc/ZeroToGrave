---
name: ztg-event-authoring
description: Use when adding or editing life events, careers, diseases, countries, eras, or any data-driven content in ZeroToGrave. Covers schema, weighting, cascades and variety rules.
---

# Authoring content

## Event schema (src/content/events)
```ts
interface LifeEvent {
  id: string;                    // unique, kebab-case: 'teen-caught-cheating'
  title: string;
  text: string;                  // use {name}, {partner}, {country} tokens
  stage: 'child'|'teen'|'adult'|'senior'|'any';
  minAge?: number; maxAge?: number;
  conditions?: Condition[];      // stat/trait/flag/relationship/country/era checks
  weight: number;                // relative frequency
  cooldownYears?: number;        // avoid repeats
  once?: boolean;
  mandatory?: boolean;           // must be resolved before Age Up
  artKey?: string;               // illustration key
  choices: Choice[];             // 2-5 choices (min 2; never a single "OK")
}
interface Choice {
  id: string; label: string;
  hint?: 'safe'|'risky'|'bold';  // qualitative only, never exact odds
  cost?: { focus?: number; money?: number };
  outcomes: { weight: number; text: string; effects: Effect[] }[]; // randomized outcomes
}
```

## Rules for good content
- Every choice has a real tradeoff; no strictly dominant option.
- Effects can set **flags** (`flag:bullied`) that unlock later events (cascades). Prefer cascades over one-offs.
- Vary tone: funny, tragic, mundane, dramatic. Avoid stat-only filler.
- Respect country/era: use conditions, not copy-paste variants.
- Sensitive topics (abuse, self-harm, etc.): non-graphic, mark `sensitive: true` so users can toggle.
- All text original, no copyrighted material, no real people or brands.
- After editing run `npm run content:validate` (ids unique, referenced flags exist, ages sane, weights >0).
