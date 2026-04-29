# Multi-District Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Ash Citadel from one repeatable encounter into a short district chain with unlocks, current-zone switching, and visible advance/replay controls.

**Architecture:** Keep zones fully config-driven. The engine exposes small helpers for unlocked zones, next available zone, and selecting a zone. React shows a compact district strip and lets the player advance after clearing a district. Existing save state continues to store `currentZoneId` and `completedZoneIds`.

**Tech Stack:** React 19, TypeScript 6, Pixi 8, Vitest, Playwright.

---

### Task 1: Engine Zone Progression

**Files:**
- Modify: `src/engine/simulation.ts`
- Modify: `tests/engine/simulation.test.ts`

- [ ] Write failing tests for locked zone selection, unlocked zone selection, and advancing to the next unlocked district.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and confirm the new tests fail.
- [ ] Add `getUnlockedZones`, `selectZone`, and `getNextUnlockedZone` helpers.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and commit.

### Task 2: Ash Citadel District Chain

**Files:**
- Modify: `src/games/ash-citadel/config.ts`
- Modify: `tests/engine/simulation.test.ts`

- [ ] Write failing tests proving Ash Citadel has three districts and each unlocks from the previous completed district.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and confirm the new tests fail.
- [ ] Add `Block 02: Transit Spine` and `Block 03: Signal Yard` with tougher enemy clusters and useful rewards.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and commit.

### Task 3: District Progression UI

**Files:**
- Create: `src/components/DistrictStrip.tsx`
- Modify: `src/components/RunOutcomeDialog.tsx`
- Modify: `src/app/useGameController.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `tests/e2e/mobile.spec.ts`

- [ ] Write failing Playwright checks for visible district buttons, locked district state, and advancing after a clear.
- [ ] Run `PLAYWRIGHT_PORT=5176 npm run e2e -- --workers=1` and confirm the new checks fail.
- [ ] Add district strip, selected-zone actions, and an `Advance` button when a next district is available.
- [ ] Run `PLAYWRIGHT_PORT=5176 npm run e2e -- --workers=1` and commit.

### Task 4: Final Verification and Push

**Files:**
- Verify all changed files.

- [ ] Run `npm run check`.
- [ ] Run `PLAYWRIGHT_PORT=5176 npm run e2e -- --workers=1`.
- [ ] Run `git diff --check`.
- [ ] Merge to local `main`, rerun verification, and push `main`.
