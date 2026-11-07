---
name: ztg-local-persistence
description: Use when saving/loading game state, save slots, autosave, save migrations, or import/export in ZeroToGrave. Local storage only, no backend.
---

# Local persistence

## Storage
- `react-native-mmkv` (sync, fast). One MMKV instance; keys namespaced `ztg:slot:<id>`, `ztg:meta`, `ztg:settings`.
- Zustand `persist` with a custom MMKV storage adapter, or manual save/load via `src/store/saves.ts`.
- No cloud, no network. Export/import = local JSON file via share sheet / document picker.

## Save format
```ts
interface SaveFile { version: number; slotId: string; savedAt: number; seed: string; state: GameState }
```
- Increment `CURRENT_SAVE_VERSION` on ANY change to persisted state shape.
- Add `migrations[n]: (old) => new` in `src/store/migrations.ts`; run sequentially on load. Never edit old migrations.
- Validate loaded data (zod or hand-written guards); on failure, keep a backup under `ztg:backup:<slot>` and show a recoverable error, never crash.

## Autosave
Save at every Year Loop phase transition. Crash-safe write: write to `…:tmp`, verify parse, then swap to the real key.

## Tests
Each migration has a fixture of the older version and a test that it loads. Round-trip export/import test.
