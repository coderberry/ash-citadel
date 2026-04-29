# Playable First Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Block 01 feel like a playable idle-combat loop: deploy, lose or clear, keep earned scrap, buy an upgrade, retry stronger, and avoid dead-end states.

**Architecture:** Keep the existing config-driven engine. Add run lifecycle state to `GameState`, mark `power` and `rations` as run-reset resources in config, and add deterministic engine tests that prove a fresh player can make progress and clear Block 01 after upgrades. Keep UI changes small and functional: status, disabled reasons, retry/clear dialogs, and a run reward summary.

**Tech Stack:** React 19, TypeScript 6, Pixi 8, Vitest, Playwright.

---

### Task 1: Run Lifecycle and Reset Resources

**Files:**
- Modify: `src/config/types.ts`
- Modify: `src/engine/state.ts`
- Modify: `src/engine/simulation.ts`
- Modify: `src/games/ash-citadel/config.ts`
- Test: `tests/engine/simulation.test.ts`

- [ ] Write failing tests for run-reset resources, failed pushes, and retrying a failed push without losing earned scrap.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and confirm the new tests fail.
- [ ] Add `resetOnRun` resources, `runStatus`, and `runStats`.
- [ ] Make `resetZone` restore run resources, clear units, respawn enemies, and preserve persistent resources.
- [ ] Add failed-push detection when enemies remain and no unlocked unit can ever be afforded after passive resources refill.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and commit.

### Task 2: First-Run Balance

**Files:**
- Modify: `src/games/ash-citadel/config.ts`
- Test: `tests/engine/simulation.test.ts`

- [ ] Write failing balance tests proving a fresh run earns scrap and Block 01 clears by run 3 with affordable upgrades.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and confirm the balance tests fail.
- [ ] Tune Block 01 enemy counts, militia cost/stats, rations, and early upgrade costs.
- [ ] Run `npm run test -- tests/engine/simulation.test.ts` and commit.

### Task 3: Playability UI

**Files:**
- Create: `src/components/RunStatusPanel.tsx`
- Create: `src/components/RunOutcomeDialog.tsx`
- Modify: `src/components/DeployBar.tsx`
- Modify: `src/render/drawScene.ts`
- Modify: `src/render/PixiStage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `tests/e2e/mobile.spec.ts`

- [ ] Write failing Playwright checks for visible objective/status text, disabled deployment reason, and failed/cleared outcome controls.
- [ ] Run `npm run e2e` and confirm the new checks fail.
- [ ] Add status panel, run outcome dialog, deploy disabled reason text, and clearer deployment ring rendering.
- [ ] Run `npm run e2e` and commit.

### Task 4: Final Verification

**Files:**
- Verify all changed files.

- [ ] Run `npm run check`.
- [ ] Run `npm run e2e`.
- [ ] Run `git diff --check`.
- [ ] Summarize remaining rough edges.
