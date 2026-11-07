---
name: ztg-anti-rush-pacing
description: Use when touching the Year Loop, Age Up flow, Focus Points, Life Plans, or anything that affects how fast a player can progress. Ensures the game cannot be rush-played.
---

# Anti-rush pacing

ZeroToGrave's core promise: you can't tap through a life.

## Year Loop state machine (src/engine/yearLoop)
`BRIEFING → FOCUS → DECISIONS → COMMIT → AGING → BRIEFING (next year)`

Gates (enforced in the **engine**, not only the UI):
- `FOCUS → DECISIONS` requires all Focus Points allocated (or explicitly banked as Rest).
- `DECISIONS → COMMIT` requires every `mandatory` event resolved. No auto-resolve, no "random pick" button.
- `COMMIT → AGING` requires a confirm action; AGING has a minimum transition duration (≥2s) and ignores input during it.
- Engine rejects out-of-order actions (`reducer` returns an error, never skips phases).

## Design rules
- No multi-year skip, no auto-play, no idle-progress.
- Each year must present at least 1 meaningful decision (guarantee via event engine fallback pool).
- Choices have lasting consequences (flags/cascades) so reading matters.
- Decision buttons get a brief input guard (~400ms) after a new card appears to defeat spam-tapping.
- Early childhood is milestone chapters (richer, not skipped).
- Hardcore mode: no undo, no risk hints.

## Tests required
Unit tests proving each gate rejects bypass attempts (dispatching AGE_UP in wrong phase, with unresolved mandatory events, with unspent Focus).
