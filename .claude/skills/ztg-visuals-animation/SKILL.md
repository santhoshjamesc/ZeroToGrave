---
name: ztg-visuals-animation
description: Use when building UI screens, animations, the aging avatar, scenes, haptics/sound, theming, or accessibility in ZeroToGrave to make it more visual and engaging than BitLife.
---

# Visuals and animation

## Toolkit
- **Reanimated 3** for UI animation (worklets, shared values, layout animations).
- **@shopify/react-native-skia** for the avatar, parallax scenes, stat rings/graphs.
- **expo-haptics**, **expo-av** (or expo-audio) for feedback; all bundled and toggleable.

## Principles
- Every state change is visible: stat deltas float/count up, cards slide, relationships react.
- Scenes change by life stage and context (home, school, office, hospital); layered parallax, subtle ambient loops.
- Avatar is procedural: age, traits, health, clothing, mood feed the renderer; single `renderAvatar(character)` entry.
- Design tokens in `src/ui/theme` (color, spacing, type, radius, motion durations); no hardcoded colors in components. Support light/dark.
- Keep 60fps: animate on UI thread, memoize list items, virtualize feeds (FlashList), cap Skia layers, test on a low-end device.
- Assets: bundled only (no remote URLs). Prefer vector/Skia/Lottie JSON; optimize images.

## Accessibility (required)
Honor reduce-motion (swap animations for fades), font scaling, 4.5:1 contrast, `accessibilityLabel`s on all controls, haptics/sound toggles.

## Pacing interplay
Animations must not become a skip-bypass. The Age-Up transition is non-skippable for its minimum duration (see `ztg-anti-rush-pacing`).
