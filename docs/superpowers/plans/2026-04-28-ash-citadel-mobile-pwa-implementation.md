# Ash Citadel Mobile PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable `Ash Citadel` installable mobile web app: one configurable idle-combat zone, local save/load, import/export, Pixi map, React mobile UI, and PWA install/offline support.

**Architecture:** Use a TypeScript config-driven engine where `src/games/ash-citadel/config.ts` defines content and engine modules simulate resources, deployment, combat, upgrades, saves, and zone completion. React owns the mobile shell and Pixi owns the animated map view, with both reading state through a small app controller.

**Tech Stack:** Vite, React, TypeScript, PixiJS, Vitest, Playwright, custom service worker.

---

## File Structure

- Create `package.json`: scripts and dependencies.
- Create `index.html`: Vite app root and mobile viewport metadata.
- Create `vite.config.ts`: React plugin and Vitest config.
- Create `tsconfig.json`, `tsconfig.node.json`: TypeScript settings.
- Create `src/main.tsx`: React entrypoint and service worker registration.
- Create `src/App.tsx`: top-level game shell.
- Create `src/styles.css`: mobile-first layout and Ash Citadel visual language.
- Create `src/config/types.ts`: config type definitions.
- Create `src/config/formulas.ts`: typed formula evaluation.
- Create `src/config/validate.ts`: config validator that returns exact error messages.
- Create `src/games/ash-citadel/config.ts`: first game config.
- Create `src/engine/state.ts`: initial state and derived stat helpers.
- Create `src/engine/simulation.ts`: deterministic game loop, deployment, combat, rewards, and zone completion.
- Create `src/engine/upgrades.ts`: affordability and upgrade purchase logic.
- Create `src/persistence/save.ts`: local save, load, export, and import.
- Create `src/app/useGameController.ts`: React controller hook for ticking, deploying, upgrades, sheets, save/export/import.
- Create `src/components/ResourceStrip.tsx`: top resource UI.
- Create `src/components/DeployBar.tsx`: bottom deploy buttons.
- Create `src/components/UpgradeSheet.tsx`: upgrade purchase sheet.
- Create `src/components/SettingsSheet.tsx`: save/export/import/settings sheet.
- Create `src/components/ZoneCompleteDialog.tsx`: completed-zone prompt.
- Create `src/render/PixiStage.tsx`: Pixi canvas lifecycle.
- Create `src/render/drawScene.ts`: draw map, base, units, enemies, effects.
- Create `public/manifest.webmanifest`: install metadata.
- Create `public/icon.svg`: app icon.
- Create `public/sw.js`: offline cache service worker.
- Create `tests/config/validate.test.ts`: config validation tests.
- Create `tests/engine/simulation.test.ts`: engine simulation tests.
- Create `tests/persistence/save.test.ts`: save/import/export tests.
- Create `tests/e2e/mobile.spec.ts`: mobile Playwright smoke test.
- Create `playwright.config.ts`: Playwright server and viewport config.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create package and toolchain files**

Create `package.json`:

```json
{
  "name": "ash-citadel",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "check": "npm run test && npm run build"
  }
}
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install react react-dom pixi.js
npm install -D @vitejs/plugin-react @playwright/test @testing-library/jest-dom @testing-library/react @types/react @types/react-dom jsdom typescript vite vitest
```

Expected: `package-lock.json` is created, `package.json` now contains dependency versions selected by npm, and both commands exit with code `0`.

- [ ] **Step 3: Create the minimal app shell**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#181512" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>Ash Citadel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
```

Create `src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <section className="map-layer" aria-label="Ash Citadel map">
        <div className="boot-card">
          <p className="eyebrow">Ash Citadel</p>
          <h1>Block 01: Broken Market</h1>
          <p>Engine scaffold ready.</p>
        </div>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #f6efe4;
  background: #181512;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --panel: rgba(24, 21, 18, 0.88);
  --line: rgba(246, 239, 228, 0.16);
  --accent: #d97706;
  --good: #84cc16;
  --danger: #ef4444;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
  width: 100%;
  margin: 0;
}

body {
  min-height: 100dvh;
  overflow: hidden;
  touch-action: manipulation;
  overscroll-behavior: none;
}

button,
input,
textarea {
  font: inherit;
}

button {
  min-height: 44px;
}

.app-shell {
  position: relative;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 18%, rgba(217, 119, 6, 0.22), transparent 28%),
    linear-gradient(160deg, #1c1917, #292524 48%, #451a03);
}

.map-layer {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
}

.boot-card {
  width: min(360px, 100%);
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 8px;
  padding: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #fbbf24;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

h1,
p {
  margin-top: 0;
}
```

- [ ] **Step 4: Verify the scaffold**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite finish successfully and `dist/` is created.

- [ ] **Step 5: Commit the scaffold**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/App.tsx src/styles.css
git commit -m "chore: scaffold Ash Citadel PWA"
```

Expected: commit succeeds with only scaffold files staged.

## Task 2: Config Types, Formulas, And Validation

**Files:**
- Create: `src/config/types.ts`
- Create: `src/config/formulas.ts`
- Create: `src/config/validate.ts`
- Test: `tests/config/validate.test.ts`

- [ ] **Step 1: Write config validation tests**

Create `tests/config/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { GameConfig } from "../../src/config/types";
import { validateGameConfig } from "../../src/config/validate";

const validConfig: GameConfig = {
  game: {
    id: "test-game",
    title: "Test Game",
    version: 1,
    theme: { background: "#111111", panel: "#222222", accent: "#ff9900" },
  },
  resources: [
    { id: "power", name: "Power", startingValue: 10, cap: 20, passiveRate: { type: "constant", value: 1 } },
    { id: "scrap", name: "Scrap", startingValue: 0 },
  ],
  units: [
    {
      id: "militia",
      name: "Militia",
      role: "fighter",
      cost: { power: 5 },
      health: { type: "constant", value: 20 },
      damage: { type: "constant", value: 5 },
      attackRate: { type: "constant", value: 1 },
      speed: { type: "constant", value: 30 },
      targetPriority: "nearest",
      unlock: { type: "always" },
    },
  ],
  enemies: [
    {
      id: "raider",
      name: "Raider",
      health: { type: "constant", value: 15 },
      damage: { type: "constant", value: 3 },
      attackRate: { type: "constant", value: 0.8 },
      speed: { type: "constant", value: 15 },
      rewards: { scrap: 2 },
      behavior: "melee",
    },
  ],
  zones: [
    {
      id: "block-01",
      name: "Block 01",
      size: { width: 900, height: 700 },
      base: { x: 100, y: 350 },
      enemyClusters: [{ enemyId: "raider", count: 2, x: 650, y: 350, radius: 60 }],
      unlock: { type: "always" },
      completion: { type: "allEnemiesDefeated" },
    },
  ],
  upgrades: [
    {
      id: "trained-fighters",
      name: "Trained Fighters",
      description: "Militia deal more damage.",
      cost: { scrap: { type: "linear", base: 10, perRank: 5 } },
      effect: { type: "statMultiplier", target: "unit:militia:damage", value: { type: "additivePercent", percentPerRank: 10 } },
      maxRank: 5,
      unlock: { type: "always" },
    },
  ],
};

describe("validateGameConfig", () => {
  it("accepts a complete config with valid references", () => {
    expect(validateGameConfig(validConfig)).toEqual([]);
  });

  it("rejects duplicate resource IDs", () => {
    const config: GameConfig = {
      ...validConfig,
      resources: [...validConfig.resources, { id: "power", name: "Power Copy", startingValue: 0 }],
    };

    expect(validateGameConfig(config)).toContain("Duplicate resource id: power");
  });

  it("rejects unit costs that reference missing resources", () => {
    const config: GameConfig = {
      ...validConfig,
      units: [{ ...validConfig.units[0], cost: { fuel: 1 } }],
    };

    expect(validateGameConfig(config)).toContain("Unit militia cost references missing resource: fuel");
  });

  it("rejects zone clusters that reference missing enemies", () => {
    const config: GameConfig = {
      ...validConfig,
      zones: [{ ...validConfig.zones[0], enemyClusters: [{ enemyId: "ghost", count: 1, x: 1, y: 1, radius: 1 }] }],
    };

    expect(validateGameConfig(config)).toContain("Zone block-01 cluster references missing enemy: ghost");
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm run test -- tests/config/validate.test.ts
```

Expected: fails because `src/config/types.ts` and `src/config/validate.ts` do not exist.

- [ ] **Step 3: Add formula and config types**

Create `src/config/types.ts`:

```ts
export type Formula =
  | { type: "constant"; value: number }
  | { type: "linear"; base: number; perRank: number }
  | { type: "exponential"; base: number; multiplier: number }
  | { type: "additivePercent"; percentPerRank: number }
  | { type: "multiplicativePercent"; multiplierPerRank: number };

export type UnlockCondition =
  | { type: "always" }
  | { type: "upgradeRank"; upgradeId: string; rank: number }
  | { type: "resourceTotal"; resourceId: string; amount: number }
  | { type: "zoneCompleted"; zoneId: string };

export type ResourceConfig = {
  id: string;
  name: string;
  icon?: string;
  startingValue: number;
  cap?: number;
  passiveRate?: Formula;
};

export type UnitConfig = {
  id: string;
  name: string;
  role: "fighter" | "collector" | "heavy";
  cost: Record<string, number>;
  health: Formula;
  damage: Formula;
  attackRate: Formula;
  speed: Formula;
  targetPriority: "nearest" | "weakest" | "strongest";
  unlock: UnlockCondition;
};

export type EnemyConfig = {
  id: string;
  name: string;
  health: Formula;
  damage: Formula;
  attackRate: Formula;
  speed: Formula;
  rewards: Record<string, number>;
  behavior: "melee" | "ranged" | "stationary";
};

export type ZoneConfig = {
  id: string;
  name: string;
  size: { width: number; height: number };
  base: { x: number; y: number };
  enemyClusters: Array<{ enemyId: string; count: number; x: number; y: number; radius: number }>;
  unlock: UnlockCondition;
  completion: { type: "allEnemiesDefeated" };
};

export type UpgradeEffect =
  | { type: "statMultiplier"; target: string; value: Formula }
  | { type: "resourcePassiveRate"; resourceId: string; value: Formula }
  | { type: "resourceStartingValue"; resourceId: string; value: Formula }
  | { type: "unlock"; targetId: string };

export type UpgradeConfig = {
  id: string;
  name: string;
  description: string;
  cost: Record<string, Formula>;
  effect: UpgradeEffect;
  maxRank: number;
  unlock: UnlockCondition;
};

export type GameConfig = {
  game: {
    id: string;
    title: string;
    version: number;
    theme: { background: string; panel: string; accent: string };
  };
  resources: ResourceConfig[];
  units: UnitConfig[];
  enemies: EnemyConfig[];
  zones: ZoneConfig[];
  upgrades: UpgradeConfig[];
};
```

Create `src/config/formulas.ts`:

```ts
import type { Formula } from "./types";

export function evaluateFormula(formula: Formula, rank = 0): number {
  switch (formula.type) {
    case "constant":
      return formula.value;
    case "linear":
      return formula.base + formula.perRank * rank;
    case "exponential":
      return formula.base * Math.pow(formula.multiplier, rank);
    case "additivePercent":
      return 1 + (formula.percentPerRank * rank) / 100;
    case "multiplicativePercent":
      return Math.pow(formula.multiplierPerRank, rank);
  }
}

export function isPositiveFormula(formula: Formula): boolean {
  return evaluateFormula(formula, 1) >= 0 && evaluateFormula(formula, 2) >= 0;
}
```

- [ ] **Step 4: Add config validator**

Create `src/config/validate.ts`:

```ts
import type { GameConfig, UnlockCondition } from "./types";
import { isPositiveFormula } from "./formulas";

function duplicateIds(items: Array<{ id: string }>, label: string): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`Duplicate ${label} id: ${item.id}`);
    }
    seen.add(item.id);
  }

  return errors;
}

function validateUnlock(
  unlock: UnlockCondition,
  context: string,
  resourceIds: Set<string>,
  upgradeIds: Set<string>,
  zoneIds: Set<string>,
): string[] {
  if (unlock.type === "always") return [];
  if (unlock.type === "resourceTotal" && !resourceIds.has(unlock.resourceId)) {
    return [`${context} unlock references missing resource: ${unlock.resourceId}`];
  }
  if (unlock.type === "upgradeRank" && !upgradeIds.has(unlock.upgradeId)) {
    return [`${context} unlock references missing upgrade: ${unlock.upgradeId}`];
  }
  if (unlock.type === "zoneCompleted" && !zoneIds.has(unlock.zoneId)) {
    return [`${context} unlock references missing zone: ${unlock.zoneId}`];
  }
  return [];
}

export function validateGameConfig(config: GameConfig): string[] {
  const errors: string[] = [
    ...duplicateIds(config.resources, "resource"),
    ...duplicateIds(config.units, "unit"),
    ...duplicateIds(config.enemies, "enemy"),
    ...duplicateIds(config.zones, "zone"),
    ...duplicateIds(config.upgrades, "upgrade"),
  ];

  const resourceIds = new Set(config.resources.map((resource) => resource.id));
  const unitIds = new Set(config.units.map((unit) => unit.id));
  const enemyIds = new Set(config.enemies.map((enemy) => enemy.id));
  const zoneIds = new Set(config.zones.map((zone) => zone.id));
  const upgradeIds = new Set(config.upgrades.map((upgrade) => upgrade.id));

  for (const unit of config.units) {
    for (const resourceId of Object.keys(unit.cost)) {
      if (!resourceIds.has(resourceId)) {
        errors.push(`Unit ${unit.id} cost references missing resource: ${resourceId}`);
      }
    }
    for (const [label, formula] of Object.entries({ health: unit.health, damage: unit.damage, speed: unit.speed })) {
      if (!isPositiveFormula(formula)) {
        errors.push(`Unit ${unit.id} has negative ${label} formula`);
      }
    }
  }

  for (const enemy of config.enemies) {
    for (const resourceId of Object.keys(enemy.rewards)) {
      if (!resourceIds.has(resourceId)) {
        errors.push(`Enemy ${enemy.id} reward references missing resource: ${resourceId}`);
      }
    }
  }

  for (const zone of config.zones) {
    for (const cluster of zone.enemyClusters) {
      if (!enemyIds.has(cluster.enemyId)) {
        errors.push(`Zone ${zone.id} cluster references missing enemy: ${cluster.enemyId}`);
      }
      if (cluster.count < 1) {
        errors.push(`Zone ${zone.id} cluster ${cluster.enemyId} count must be at least 1`);
      }
    }
  }

  for (const upgrade of config.upgrades) {
    for (const resourceId of Object.keys(upgrade.cost)) {
      if (!resourceIds.has(resourceId)) {
        errors.push(`Upgrade ${upgrade.id} cost references missing resource: ${resourceId}`);
      }
    }
    if (upgrade.effect.type === "resourcePassiveRate" && !resourceIds.has(upgrade.effect.resourceId)) {
      errors.push(`Upgrade ${upgrade.id} effect references missing resource: ${upgrade.effect.resourceId}`);
    }
    if (upgrade.effect.type === "resourceStartingValue" && !resourceIds.has(upgrade.effect.resourceId)) {
      errors.push(`Upgrade ${upgrade.id} effect references missing resource: ${upgrade.effect.resourceId}`);
    }
    if (upgrade.effect.type === "unlock" && !unitIds.has(upgrade.effect.targetId)) {
      errors.push(`Upgrade ${upgrade.id} unlocks missing unit: ${upgrade.effect.targetId}`);
    }
  }

  for (const unit of config.units) {
    errors.push(...validateUnlock(unit.unlock, `Unit ${unit.id}`, resourceIds, upgradeIds, zoneIds));
  }
  for (const zone of config.zones) {
    errors.push(...validateUnlock(zone.unlock, `Zone ${zone.id}`, resourceIds, upgradeIds, zoneIds));
  }
  for (const upgrade of config.upgrades) {
    errors.push(...validateUnlock(upgrade.unlock, `Upgrade ${upgrade.id}`, resourceIds, upgradeIds, zoneIds));
  }

  return errors;
}
```

- [ ] **Step 5: Verify config tests pass**

Run:

```bash
npm run test -- tests/config/validate.test.ts
```

Expected: all tests in `validate.test.ts` pass.

- [ ] **Step 6: Commit config foundations**

Run:

```bash
git add src/config/types.ts src/config/formulas.ts src/config/validate.ts tests/config/validate.test.ts
git commit -m "feat: add typed game config validation"
```

Expected: commit succeeds with config files and validation tests.

## Task 3: Ash Citadel Config

**Files:**
- Create: `src/games/ash-citadel/config.ts`
- Modify: `tests/config/validate.test.ts`

- [ ] **Step 1: Add a test proving the shipped config is valid**

Append to `tests/config/validate.test.ts`:

```ts
import { ashCitadelConfig } from "../../src/games/ash-citadel/config";

describe("ashCitadelConfig", () => {
  it("ships with no validation errors", () => {
    expect(validateGameConfig(ashCitadelConfig)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the failing config test**

Run:

```bash
npm run test -- tests/config/validate.test.ts
```

Expected: fails because `src/games/ash-citadel/config.ts` does not exist.

- [ ] **Step 3: Add the Ash Citadel config**

Create `src/games/ash-citadel/config.ts`:

```ts
import type { GameConfig } from "../../config/types";

export const ashCitadelConfig: GameConfig = {
  game: {
    id: "ash-citadel",
    title: "Ash Citadel",
    version: 1,
    theme: {
      background: "#181512",
      panel: "#29211c",
      accent: "#d97706",
    },
  },
  resources: [
    { id: "power", name: "Power", icon: "bolt", startingValue: 20, cap: 30, passiveRate: { type: "constant", value: 1.5 } },
    { id: "scrap", name: "Scrap", icon: "gear", startingValue: 0 },
    { id: "rations", name: "Rations", icon: "crate", startingValue: 4, cap: 12 },
    { id: "intel", name: "Intel", icon: "signal", startingValue: 0 },
  ],
  units: [
    {
      id: "militia-squad",
      name: "Militia Squad",
      role: "fighter",
      cost: { power: 8, rations: 1 },
      health: { type: "constant", value: 32 },
      damage: { type: "constant", value: 6 },
      attackRate: { type: "constant", value: 1 },
      speed: { type: "constant", value: 42 },
      targetPriority: "nearest",
      unlock: { type: "always" },
    },
    {
      id: "scrap-drone",
      name: "Scrap Drone",
      role: "collector",
      cost: { power: 12, scrap: 15 },
      health: { type: "constant", value: 18 },
      damage: { type: "constant", value: 2 },
      attackRate: { type: "constant", value: 0.7 },
      speed: { type: "constant", value: 58 },
      targetPriority: "weakest",
      unlock: { type: "upgradeRank", upgradeId: "drone-bay", rank: 1 },
    },
    {
      id: "siege-rig",
      name: "Siege Rig",
      role: "heavy",
      cost: { power: 24, scrap: 60, rations: 2 },
      health: { type: "constant", value: 110 },
      damage: { type: "constant", value: 18 },
      attackRate: { type: "constant", value: 0.45 },
      speed: { type: "constant", value: 22 },
      targetPriority: "strongest",
      unlock: { type: "upgradeRank", upgradeId: "rig-foundry", rank: 1 },
    },
  ],
  enemies: [
    {
      id: "raider",
      name: "Raider",
      health: { type: "constant", value: 24 },
      damage: { type: "constant", value: 4 },
      attackRate: { type: "constant", value: 0.8 },
      speed: { type: "constant", value: 26 },
      rewards: { scrap: 4 },
      behavior: "melee",
    },
    {
      id: "mutant",
      name: "Mutant",
      health: { type: "constant", value: 48 },
      damage: { type: "constant", value: 7 },
      attackRate: { type: "constant", value: 0.55 },
      speed: { type: "constant", value: 20 },
      rewards: { scrap: 8, rations: 1 },
      behavior: "melee",
    },
    {
      id: "auto-turret",
      name: "Auto Turret",
      health: { type: "constant", value: 72 },
      damage: { type: "constant", value: 10 },
      attackRate: { type: "constant", value: 0.7 },
      speed: { type: "constant", value: 0 },
      rewards: { scrap: 14, intel: 1 },
      behavior: "stationary",
    },
  ],
  zones: [
    {
      id: "block-01-broken-market",
      name: "Block 01: Broken Market",
      size: { width: 920, height: 680 },
      base: { x: 110, y: 340 },
      enemyClusters: [
        { enemyId: "raider", count: 6, x: 550, y: 260, radius: 95 },
        { enemyId: "mutant", count: 3, x: 670, y: 440, radius: 80 },
        { enemyId: "auto-turret", count: 2, x: 790, y: 340, radius: 60 },
      ],
      unlock: { type: "always" },
      completion: { type: "allEnemiesDefeated" },
    },
  ],
  upgrades: [
    {
      id: "trained-militia",
      name: "Trained Militia",
      description: "Militia squads deal more damage.",
      cost: { scrap: { type: "linear", base: 10, perRank: 8 } },
      effect: { type: "statMultiplier", target: "unit:militia-squad:damage", value: { type: "additivePercent", percentPerRank: 12 } },
      maxRank: 10,
      unlock: { type: "always" },
    },
    {
      id: "reinforced-kit",
      name: "Reinforced Kit",
      description: "All deployed crews survive longer.",
      cost: { scrap: { type: "linear", base: 12, perRank: 10 } },
      effect: { type: "statMultiplier", target: "unit:*:health", value: { type: "additivePercent", percentPerRank: 10 } },
      maxRank: 10,
      unlock: { type: "always" },
    },
    {
      id: "generator-overdrive",
      name: "Generator Overdrive",
      description: "The citadel generates power faster.",
      cost: { scrap: { type: "linear", base: 18, perRank: 14 } },
      effect: { type: "resourcePassiveRate", resourceId: "power", value: { type: "additivePercent", percentPerRank: 15 } },
      maxRank: 8,
      unlock: { type: "always" },
    },
    {
      id: "salvage-charters",
      name: "Salvage Charters",
      description: "Enemy wreckage yields more scrap.",
      cost: { scrap: { type: "linear", base: 20, perRank: 18 } },
      effect: { type: "statMultiplier", target: "reward:scrap", value: { type: "additivePercent", percentPerRank: 15 } },
      maxRank: 8,
      unlock: { type: "always" },
    },
    {
      id: "ration-vault",
      name: "Ration Vault",
      description: "Begin each run with more rations.",
      cost: { scrap: { type: "linear", base: 22, perRank: 16 } },
      effect: { type: "resourceStartingValue", resourceId: "rations", value: { type: "constant", value: 1 } },
      maxRank: 5,
      unlock: { type: "always" },
    },
    {
      id: "drone-bay",
      name: "Drone Bay",
      description: "Unlock Scrap Drones.",
      cost: { scrap: { type: "constant", value: 30 } },
      effect: { type: "unlock", targetId: "scrap-drone" },
      maxRank: 1,
      unlock: { type: "always" },
    },
    {
      id: "rig-foundry",
      name: "Rig Foundry",
      description: "Unlock Siege Rigs.",
      cost: { scrap: { type: "constant", value: 80 }, intel: { type: "constant", value: 2 } },
      effect: { type: "unlock", targetId: "siege-rig" },
      maxRank: 1,
      unlock: { type: "upgradeRank", upgradeId: "drone-bay", rank: 1 },
    },
  ],
};
```

- [ ] **Step 4: Verify the shipped config**

Run:

```bash
npm run test -- tests/config/validate.test.ts
```

Expected: all config tests pass, including `ashCitadelConfig ships with no validation errors`.

- [ ] **Step 5: Commit Ash Citadel config**

Run:

```bash
git add src/games/ash-citadel/config.ts tests/config/validate.test.ts
git commit -m "feat: add Ash Citadel game config"
```

Expected: commit succeeds with config and test changes.

## Task 4: Engine State, Resources, And Upgrades

**Files:**
- Create: `src/engine/state.ts`
- Create: `src/engine/upgrades.ts`
- Test: `tests/engine/simulation.test.ts`

- [ ] **Step 1: Write resource and upgrade tests**

Create `tests/engine/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ashCitadelConfig } from "../../src/games/ash-citadel/config";
import { createInitialGameState, tickResources } from "../../src/engine/state";
import { canAffordUpgrade, purchaseUpgrade } from "../../src/engine/upgrades";

describe("engine resources and upgrades", () => {
  it("creates initial state from config resources and zone", () => {
    const state = createInitialGameState(ashCitadelConfig);

    expect(state.configId).toBe("ash-citadel");
    expect(state.currentZoneId).toBe("block-01-broken-market");
    expect(state.resources.power).toBe(20);
    expect(state.resources.scrap).toBe(0);
  });

  it("ticks passive power without exceeding its cap", () => {
    const state = createInitialGameState(ashCitadelConfig);

    const next = tickResources(ashCitadelConfig, state, 20);

    expect(next.resources.power).toBe(30);
  });

  it("buys an affordable upgrade and deducts cost", () => {
    const state = createInitialGameState(ashCitadelConfig);
    state.resources.scrap = 20;

    expect(canAffordUpgrade(ashCitadelConfig, state, "trained-militia")).toBe(true);
    const next = purchaseUpgrade(ashCitadelConfig, state, "trained-militia");

    expect(next.resources.scrap).toBe(10);
    expect(next.upgradeRanks["trained-militia"]).toBe(1);
  });

  it("keeps locked upgrades unavailable until their unlock condition is met", () => {
    const state = createInitialGameState(ashCitadelConfig);
    state.resources.scrap = 100;
    state.resources.intel = 3;

    expect(canAffordUpgrade(ashCitadelConfig, state, "rig-foundry")).toBe(false);
  });

  it("applies ration vault as an immediate ration increase", () => {
    const state = createInitialGameState(ashCitadelConfig);
    state.resources.scrap = 40;

    const next = purchaseUpgrade(ashCitadelConfig, state, "ration-vault");

    expect(next.resources.rations).toBe(5);
    expect(next.upgradeRanks["ration-vault"]).toBe(1);
  });
});
```

- [ ] **Step 2: Run failing engine tests**

Run:

```bash
npm run test -- tests/engine/simulation.test.ts
```

Expected: fails because `src/engine/state.ts` and `src/engine/upgrades.ts` do not exist.

- [ ] **Step 3: Implement engine state and resource ticking**

Create `src/engine/state.ts`:

```ts
import type { GameConfig } from "../config/types";
import { evaluateFormula } from "../config/formulas";

export type EntityState = {
  id: string;
  configId: string;
  side: "unit" | "enemy";
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attackCooldown: number;
};

export type GameState = {
  configId: string;
  configVersion: number;
  currentZoneId: string;
  resources: Record<string, number>;
  totals: Record<string, number>;
  upgradeRanks: Record<string, number>;
  unlockedUnitIds: string[];
  completedZoneIds: string[];
  entities: EntityState[];
  nextEntityId: number;
  zoneCompleted: boolean;
  lastSavedAt: number;
};

export function createInitialGameState(config: GameConfig): GameState {
  const resources = Object.fromEntries(config.resources.map((resource) => [resource.id, resource.startingValue]));
  const totals = Object.fromEntries(config.resources.map((resource) => [resource.id, resource.startingValue]));

  return {
    configId: config.game.id,
    configVersion: config.game.version,
    currentZoneId: config.zones[0].id,
    resources,
    totals,
    upgradeRanks: {},
    unlockedUnitIds: config.units.filter((unit) => unit.unlock.type === "always").map((unit) => unit.id),
    completedZoneIds: [],
    entities: [],
    nextEntityId: 1,
    zoneCompleted: false,
    lastSavedAt: Date.now(),
  };
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    resources: { ...state.resources },
    totals: { ...state.totals },
    upgradeRanks: { ...state.upgradeRanks },
    unlockedUnitIds: [...state.unlockedUnitIds],
    completedZoneIds: [...state.completedZoneIds],
    entities: state.entities.map((entity) => ({ ...entity })),
  };
}

export function getUpgradeRank(state: GameState, upgradeId: string): number {
  return state.upgradeRanks[upgradeId] ?? 0;
}

export function getResourceCap(config: GameConfig, resourceId: string): number | undefined {
  return config.resources.find((resource) => resource.id === resourceId)?.cap;
}

export function tickResources(config: GameConfig, state: GameState, deltaSeconds: number): GameState {
  const next = cloneState(state);

  for (const resource of config.resources) {
    if (!resource.passiveRate) continue;

    const rateMultiplier = config.upgrades
      .filter((upgrade) => upgrade.effect.type === "resourcePassiveRate" && upgrade.effect.resourceId === resource.id)
      .reduce((multiplier, upgrade) => multiplier * evaluateFormula(upgrade.effect.value, getUpgradeRank(next, upgrade.id)), 1);

    const gained = evaluateFormula(resource.passiveRate) * rateMultiplier * deltaSeconds;
    const cap = getResourceCap(config, resource.id);
    next.resources[resource.id] = Math.min(cap ?? Number.POSITIVE_INFINITY, next.resources[resource.id] + gained);
    next.totals[resource.id] = (next.totals[resource.id] ?? 0) + gained;
  }

  return next;
}
```

- [ ] **Step 4: Implement upgrade purchasing**

Create `src/engine/upgrades.ts`:

```ts
import type { GameConfig, UnlockCondition, UpgradeConfig } from "../config/types";
import { evaluateFormula } from "../config/formulas";
import { cloneState, getResourceCap, getUpgradeRank, type GameState } from "./state";

export function getUpgradeCost(upgrade: UpgradeConfig, rank: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(upgrade.cost).map(([resourceId, formula]) => [resourceId, Math.ceil(evaluateFormula(formula, rank))]),
  );
}

export function canAffordCost(state: GameState, cost: Record<string, number>): boolean {
  return Object.entries(cost).every(([resourceId, amount]) => (state.resources[resourceId] ?? 0) >= amount);
}

export function isUnlockSatisfied(state: GameState, unlock: UnlockCondition): boolean {
  switch (unlock.type) {
    case "always":
      return true;
    case "upgradeRank":
      return getUpgradeRank(state, unlock.upgradeId) >= unlock.rank;
    case "resourceTotal":
      return (state.totals[unlock.resourceId] ?? 0) >= unlock.amount;
    case "zoneCompleted":
      return state.completedZoneIds.includes(unlock.zoneId);
  }
}

export function isUpgradeUnlocked(config: GameConfig, state: GameState, upgradeId: string): boolean {
  const upgrade = config.upgrades.find((item) => item.id === upgradeId);
  return Boolean(upgrade && isUnlockSatisfied(state, upgrade.unlock));
}

export function canAffordUpgrade(config: GameConfig, state: GameState, upgradeId: string): boolean {
  const upgrade = config.upgrades.find((item) => item.id === upgradeId);
  if (!upgrade) return false;

  const rank = getUpgradeRank(state, upgradeId);
  if (rank >= upgrade.maxRank) return false;
  if (!isUnlockSatisfied(state, upgrade.unlock)) return false;

  return canAffordCost(state, getUpgradeCost(upgrade, rank));
}

export function purchaseUpgrade(config: GameConfig, state: GameState, upgradeId: string): GameState {
  const upgrade = config.upgrades.find((item) => item.id === upgradeId);
  if (!upgrade || !canAffordUpgrade(config, state, upgradeId)) return state;

  const next = cloneState(state);
  const rank = getUpgradeRank(next, upgradeId);
  const cost = getUpgradeCost(upgrade, rank);

  for (const [resourceId, amount] of Object.entries(cost)) {
    next.resources[resourceId] -= amount;
  }

  next.upgradeRanks[upgradeId] = rank + 1;

  if (upgrade.effect.type === "unlock" && !next.unlockedUnitIds.includes(upgrade.effect.targetId)) {
    next.unlockedUnitIds.push(upgrade.effect.targetId);
  }
  if (upgrade.effect.type === "resourceStartingValue") {
    const resourceId = upgrade.effect.resourceId;
    const cap = getResourceCap(config, resourceId);
    const gained = evaluateFormula(upgrade.effect.value, rank);
    next.resources[resourceId] = Math.min(cap ?? Number.POSITIVE_INFINITY, (next.resources[resourceId] ?? 0) + gained);
    next.totals[resourceId] = (next.totals[resourceId] ?? 0) + gained;
  }

  return next;
}
```

- [ ] **Step 5: Verify engine foundations**

Run:

```bash
npm run test -- tests/engine/simulation.test.ts
```

Expected: all tests in `simulation.test.ts` pass.

- [ ] **Step 6: Commit state and upgrades**

Run:

```bash
git add src/engine/state.ts src/engine/upgrades.ts tests/engine/simulation.test.ts
git commit -m "feat: add engine state and upgrades"
```

Expected: commit succeeds with engine state files and tests.

## Task 5: Deployment, Combat, Rewards, And Zone Completion

**Files:**
- Create: `src/engine/simulation.ts`
- Modify: `src/engine/state.ts`
- Modify: `tests/engine/simulation.test.ts`

- [ ] **Step 1: Add simulation behavior tests**

Append to `tests/engine/simulation.test.ts`:

```ts
import { deployUnit, resetZone, tickCombat } from "../../src/engine/simulation";

describe("combat simulation", () => {
  it("spawns enemies for the current zone", () => {
    const state = resetZone(ashCitadelConfig, createInitialGameState(ashCitadelConfig));

    expect(state.entities.filter((entity) => entity.side === "enemy")).toHaveLength(11);
  });

  it("deploys a unit when resources are available", () => {
    const state = resetZone(ashCitadelConfig, createInitialGameState(ashCitadelConfig));
    const next = deployUnit(ashCitadelConfig, state, "militia-squad", { x: 180, y: 340 });

    expect(next.entities.some((entity) => entity.configId === "militia-squad" && entity.side === "unit")).toBe(true);
    expect(next.resources.power).toBe(12);
    expect(next.resources.rations).toBe(3);
  });

  it("clears the zone and awards enemy resources", () => {
    let state = resetZone(ashCitadelConfig, createInitialGameState(ashCitadelConfig));
    state.resources.power = 500;
    state.resources.rations = 500;

    for (let index = 0; index < 8; index += 1) {
      state = deployUnit(ashCitadelConfig, state, "militia-squad", { x: 140, y: 340 });
    }

    for (let tick = 0; tick < 90 && !state.zoneCompleted; tick += 1) {
      state = tickCombat(ashCitadelConfig, state, 1);
    }

    expect(state.zoneCompleted).toBe(true);
    expect(state.completedZoneIds).toContain("block-01-broken-market");
    expect(state.resources.scrap).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run failing combat tests**

Run:

```bash
npm run test -- tests/engine/simulation.test.ts
```

Expected: fails because `src/engine/simulation.ts` does not exist.

- [ ] **Step 3: Implement deployment and combat**

Create `src/engine/simulation.ts`:

```ts
import type { EnemyConfig, GameConfig, UnitConfig } from "../config/types";
import { evaluateFormula } from "../config/formulas";
import { canAffordCost } from "./upgrades";
import { cloneState, getUpgradeRank, type EntityState, type GameState } from "./state";

type Point = { x: number; y: number };

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function statMultiplier(config: GameConfig, state: GameState, target: string): number {
  return config.upgrades
    .filter((upgrade) => upgrade.effect.type === "statMultiplier")
    .filter((upgrade) => upgrade.effect.target === target || upgrade.effect.target === target.replace(/unit:[^:]+:/, "unit:*:"))
    .reduce((multiplier, upgrade) => multiplier * evaluateFormula(upgrade.effect.value, getUpgradeRank(state, upgrade.id)), 1);
}

function rewardMultiplier(config: GameConfig, state: GameState, resourceId: string): number {
  return config.upgrades
    .filter((upgrade) => upgrade.effect.type === "statMultiplier" && upgrade.effect.target === `reward:${resourceId}`)
    .reduce((multiplier, upgrade) => multiplier * evaluateFormula(upgrade.effect.value, getUpgradeRank(state, upgrade.id)), 1);
}

function makeUnitEntity(config: GameConfig, state: GameState, unit: UnitConfig, point: Point): EntityState {
  const health = evaluateFormula(unit.health) * statMultiplier(config, state, `unit:${unit.id}:health`);

  return {
    id: `entity-${state.nextEntityId}`,
    configId: unit.id,
    side: "unit",
    x: point.x,
    y: point.y,
    health,
    maxHealth: health,
    attackCooldown: 0,
  };
}

function makeEnemyEntity(state: GameState, enemy: EnemyConfig, point: Point): EntityState {
  const health = evaluateFormula(enemy.health);

  return {
    id: `entity-${state.nextEntityId}`,
    configId: enemy.id,
    side: "enemy",
    x: point.x,
    y: point.y,
    health,
    maxHealth: health,
    attackCooldown: 0,
  };
}

export function resetZone(config: GameConfig, state: GameState): GameState {
  const next = cloneState(state);
  const zone = config.zones.find((item) => item.id === next.currentZoneId) ?? config.zones[0];
  next.entities = [];
  next.zoneCompleted = false;

  for (const cluster of zone.enemyClusters) {
    const enemy = config.enemies.find((item) => item.id === cluster.enemyId);
    if (!enemy) continue;

    for (let index = 0; index < cluster.count; index += 1) {
      const angle = (Math.PI * 2 * index) / cluster.count;
      const radius = cluster.radius * (0.35 + (index % 3) * 0.2);
      const point = { x: cluster.x + Math.cos(angle) * radius, y: cluster.y + Math.sin(angle) * radius };
      next.entities.push(makeEnemyEntity(next, enemy, point));
      next.nextEntityId += 1;
    }
  }

  return next;
}

export function deployUnit(config: GameConfig, state: GameState, unitId: string, point: Point): GameState {
  const unit = config.units.find((item) => item.id === unitId);
  if (!unit || !state.unlockedUnitIds.includes(unitId) || !canAffordCost(state, unit.cost)) return state;

  const next = cloneState(state);
  for (const [resourceId, amount] of Object.entries(unit.cost)) {
    next.resources[resourceId] -= amount;
  }
  next.entities.push(makeUnitEntity(config, next, unit, point));
  next.nextEntityId += 1;
  return next;
}

function nearestTarget(entity: EntityState, candidates: EntityState[]): EntityState | undefined {
  return candidates.slice().sort((a, b) => distance(entity, a) - distance(entity, b))[0];
}

function moveToward(entity: EntityState, target: EntityState, speed: number, deltaSeconds: number): void {
  const gap = distance(entity, target);
  if (gap <= 36 || speed <= 0) return;

  const step = Math.min(gap - 36, speed * deltaSeconds);
  entity.x += ((target.x - entity.x) / gap) * step;
  entity.y += ((target.y - entity.y) / gap) * step;
}

function applyRewards(config: GameConfig, state: GameState, enemyId: string): void {
  const enemy = config.enemies.find((item) => item.id === enemyId);
  if (!enemy) return;

  for (const [resourceId, amount] of Object.entries(enemy.rewards)) {
    const gained = amount * rewardMultiplier(config, state, resourceId);
    state.resources[resourceId] = (state.resources[resourceId] ?? 0) + gained;
    state.totals[resourceId] = (state.totals[resourceId] ?? 0) + gained;
  }
}

export function tickCombat(config: GameConfig, state: GameState, deltaSeconds: number): GameState {
  const next = cloneState(state);
  const unitsById = new Map(config.units.map((unit) => [unit.id, unit]));
  const enemiesById = new Map(config.enemies.map((enemy) => [enemy.id, enemy]));

  for (const entity of next.entities) {
    entity.attackCooldown = Math.max(0, entity.attackCooldown - deltaSeconds);
    const targets = next.entities.filter((target) => target.side !== entity.side && target.health > 0);
    const target = nearestTarget(entity, targets);
    if (!target) continue;

    if (entity.side === "unit") {
      const unit = unitsById.get(entity.configId);
      if (!unit) continue;
      moveToward(entity, target, evaluateFormula(unit.speed), deltaSeconds);
      if (distance(entity, target) <= 40 && entity.attackCooldown <= 0) {
        target.health -= evaluateFormula(unit.damage) * statMultiplier(config, next, `unit:${unit.id}:damage`);
        entity.attackCooldown = 1 / evaluateFormula(unit.attackRate);
      }
    } else {
      const enemy = enemiesById.get(entity.configId);
      if (!enemy) continue;
      moveToward(entity, target, evaluateFormula(enemy.speed), deltaSeconds);
      if (distance(entity, target) <= 40 && entity.attackCooldown <= 0) {
        target.health -= evaluateFormula(enemy.damage);
        entity.attackCooldown = 1 / evaluateFormula(enemy.attackRate);
      }
    }
  }

  for (const defeated of next.entities.filter((entity) => entity.side === "enemy" && entity.health <= 0)) {
    applyRewards(config, next, defeated.configId);
  }

  next.entities = next.entities.filter((entity) => entity.health > 0);

  if (!next.zoneCompleted && next.entities.every((entity) => entity.side !== "enemy")) {
    next.zoneCompleted = true;
    if (!next.completedZoneIds.includes(next.currentZoneId)) {
      next.completedZoneIds.push(next.currentZoneId);
    }
  }

  return next;
}
```

- [ ] **Step 4: Verify combat behavior**

Run:

```bash
npm run test -- tests/engine/simulation.test.ts
```

Expected: all resource, upgrade, deployment, combat, reward, and zone completion tests pass.

- [ ] **Step 5: Commit simulation**

Run:

```bash
git add src/engine/simulation.ts src/engine/state.ts tests/engine/simulation.test.ts
git commit -m "feat: simulate deployment and combat"
```

Expected: commit succeeds with simulation code and tests.

## Task 6: Save, Load, Export, And Import

**Files:**
- Create: `src/persistence/save.ts`
- Test: `tests/persistence/save.test.ts`

- [ ] **Step 1: Write save tests**

Create `tests/persistence/save.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { ashCitadelConfig } from "../../src/games/ash-citadel/config";
import { createInitialGameState } from "../../src/engine/state";
import { exportSave, importSave, loadGameState, saveGameState } from "../../src/persistence/save";

describe("save persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads state for the config", () => {
    const state = createInitialGameState(ashCitadelConfig);
    state.resources.scrap = 42;

    saveGameState(state);
    const loaded = loadGameState(ashCitadelConfig);

    expect(loaded.resources.scrap).toBe(42);
    expect(loaded.configId).toBe("ash-citadel");
  });

  it("exports and imports a save string", () => {
    const state = createInitialGameState(ashCitadelConfig);
    state.resources.intel = 3;

    const encoded = exportSave(state);
    const imported = importSave(ashCitadelConfig, encoded);

    expect(imported.resources.intel).toBe(3);
  });

  it("falls back to a fresh state when config id does not match", () => {
    const state = createInitialGameState(ashCitadelConfig);
    saveGameState({ ...state, configId: "wrong-game" });

    const loaded = loadGameState(ashCitadelConfig);

    expect(loaded.configId).toBe("ash-citadel");
    expect(loaded.resources.power).toBe(20);
  });
});
```

- [ ] **Step 2: Run failing save tests**

Run:

```bash
npm run test -- tests/persistence/save.test.ts
```

Expected: fails because `src/persistence/save.ts` does not exist.

- [ ] **Step 3: Implement save helpers**

Create `src/persistence/save.ts`:

```ts
import type { GameConfig } from "../config/types";
import { createInitialGameState, type GameState } from "../engine/state";

const SAVE_PREFIX = "ash-citadel-save";

function storageKey(configId: string): string {
  return `${SAVE_PREFIX}:${configId}`;
}

function isGameState(value: unknown): value is GameState {
  return Boolean(
    value &&
      typeof value === "object" &&
      "configId" in value &&
      "configVersion" in value &&
      "resources" in value &&
      "upgradeRanks" in value &&
      "entities" in value,
  );
}

export function saveGameState(state: GameState): void {
  const stateToSave: GameState = { ...state, lastSavedAt: Date.now() };
  localStorage.setItem(storageKey(state.configId), JSON.stringify(stateToSave));
}

export function loadGameState(config: GameConfig): GameState {
  const raw = localStorage.getItem(storageKey(config.game.id));
  if (!raw) return createInitialGameState(config);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isGameState(parsed) && parsed.configId === config.game.id) {
      return parsed;
    }
  } catch {
    return createInitialGameState(config);
  }

  return createInitialGameState(config);
}

export function exportSave(state: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(config: GameConfig, encoded: string): GameState {
  const parsed: unknown = JSON.parse(decodeURIComponent(escape(atob(encoded))));
  if (!isGameState(parsed) || parsed.configId !== config.game.id) {
    throw new Error("Save file does not match this game config.");
  }
  return parsed;
}
```

- [ ] **Step 4: Verify save tests**

Run:

```bash
npm run test -- tests/persistence/save.test.ts
```

Expected: all persistence tests pass.

- [ ] **Step 5: Commit persistence**

Run:

```bash
git add src/persistence/save.ts tests/persistence/save.test.ts
git commit -m "feat: add local save import and export"
```

Expected: commit succeeds with persistence code and tests.

## Task 7: React Game Controller And Mobile UI

**Files:**
- Create: `src/app/useGameController.ts`
- Create: `src/components/ResourceStrip.tsx`
- Create: `src/components/DeployBar.tsx`
- Create: `src/components/UpgradeSheet.tsx`
- Create: `src/components/SettingsSheet.tsx`
- Create: `src/components/ZoneCompleteDialog.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add the controller hook**

Create `src/app/useGameController.ts`:

```ts
import { useEffect, useMemo, useState } from "react";
import type { UnitConfig } from "../config/types";
import { ashCitadelConfig } from "../games/ash-citadel/config";
import { tickResources, type GameState } from "../engine/state";
import { deployUnit, resetZone, tickCombat } from "../engine/simulation";
import { purchaseUpgrade } from "../engine/upgrades";
import { exportSave, importSave, loadGameState, saveGameState } from "../persistence/save";

export function useGameController() {
  const config = ashCitadelConfig;
  const [state, setState] = useState<GameState>(() => resetZone(config, loadGameState(config)));
  const [selectedUnitId, setSelectedUnitId] = useState("militia-squad");
  const [sheet, setSheet] = useState<"upgrades" | "settings" | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    let previous = performance.now();
    let frame = 0;

    const run = (now: number) => {
      const delta = Math.min(0.2, (now - previous) / 1000);
      previous = now;
      setState((current) => tickCombat(config, tickResources(config, current, delta), delta));
      frame = requestAnimationFrame(run);
    };

    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [config]);

  useEffect(() => {
    const id = window.setInterval(() => saveGameState(state), 5000);
    return () => window.clearInterval(id);
  }, [state]);

  const unlockedUnits = useMemo(
    () => config.units.filter((unit) => state.unlockedUnitIds.includes(unit.id)),
    [config.units, state.unlockedUnitIds],
  );

  function deploy(point: { x: number; y: number }) {
    setState((current) => deployUnit(config, current, selectedUnitId, point));
  }

  function buyUpgrade(upgradeId: string) {
    setState((current) => purchaseUpgrade(config, current, upgradeId));
  }

  function restartZone() {
    setState((current) => resetZone(config, { ...current, zoneCompleted: false }));
  }

  function exportCurrentSave(): string {
    saveGameState(state);
    return exportSave(state);
  }

  function importEncodedSave(encoded: string) {
    try {
      const imported = resetZone(config, importSave(config, encoded));
      setImportError(null);
      setState(imported);
      saveGameState(imported);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to import save.");
    }
  }

  return {
    config,
    state,
    selectedUnitId,
    setSelectedUnitId,
    sheet,
    setSheet,
    importError,
    unlockedUnits: unlockedUnits as UnitConfig[],
    deploy,
    buyUpgrade,
    restartZone,
    exportCurrentSave,
    importEncodedSave,
  };
}
```

- [ ] **Step 2: Add UI components**

Create `src/components/ResourceStrip.tsx`:

```tsx
import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function ResourceStrip({ config, state }: { config: GameConfig; state: GameState }) {
  return (
    <header className="resource-strip">
      {config.resources.map((resource) => (
        <div className="resource-pill" key={resource.id}>
          <span>{resource.name}</span>
          <strong>{Math.floor(state.resources[resource.id] ?? 0)}</strong>
        </div>
      ))}
    </header>
  );
}
```

Create `src/components/DeployBar.tsx`:

```tsx
import type { UnitConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function DeployBar({
  units,
  state,
  selectedUnitId,
  onSelect,
  onOpenUpgrades,
  onOpenSettings,
}: {
  units: UnitConfig[];
  state: GameState;
  selectedUnitId: string;
  onSelect: (unitId: string) => void;
  onOpenUpgrades: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <nav className="deploy-bar" aria-label="Deployment controls">
      <button type="button" className="icon-command" onClick={onOpenUpgrades}>Upgrades</button>
      <div className="unit-row">
        {units.map((unit) => {
          const affordable = Object.entries(unit.cost).every(([resourceId, amount]) => (state.resources[resourceId] ?? 0) >= amount);
          return (
            <button
              type="button"
              key={unit.id}
              className={unit.id === selectedUnitId ? "unit-button active" : "unit-button"}
              disabled={!affordable}
              onClick={() => onSelect(unit.id)}
            >
              <span>{unit.name}</span>
              <small>{Object.entries(unit.cost).map(([id, amount]) => `${amount} ${id}`).join(" / ")}</small>
            </button>
          );
        })}
      </div>
      <button type="button" className="icon-command" onClick={onOpenSettings}>Save</button>
    </nav>
  );
}
```

Create `src/components/UpgradeSheet.tsx`:

```tsx
import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";
import { getUpgradeRank } from "../engine/state";
import { canAffordUpgrade, getUpgradeCost, isUpgradeUnlocked } from "../engine/upgrades";

export function UpgradeSheet({
  config,
  state,
  onBuy,
  onClose,
}: {
  config: GameConfig;
  state: GameState;
  onBuy: (upgradeId: string) => void;
  onClose: () => void;
}) {
  return (
    <section className="sheet" aria-label="Upgrades">
      <div className="sheet-header">
        <div>
          <p className="eyebrow">Citadel Systems</p>
          <h2>Upgrades</h2>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div className="upgrade-list">
        {config.upgrades.map((upgrade) => {
          const rank = getUpgradeRank(state, upgrade.id);
          const cost = getUpgradeCost(upgrade, rank);
          const maxed = rank >= upgrade.maxRank;
          const unlocked = isUpgradeUnlocked(config, state, upgrade.id);
          return (
            <article className="upgrade-card" key={upgrade.id}>
              <div>
                <h3>{upgrade.name}</h3>
                <p>{upgrade.description}</p>
                <small>{unlocked ? `Rank ${rank} / ${upgrade.maxRank}` : "Locked"}</small>
              </div>
              <button
                type="button"
                disabled={!unlocked || maxed || !canAffordUpgrade(config, state, upgrade.id)}
                onClick={() => onBuy(upgrade.id)}
              >
                {!unlocked ? "Locked" : maxed ? "Maxed" : Object.entries(cost).map(([id, amount]) => `${amount} ${id}`).join(" / ")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
```

Create `src/components/SettingsSheet.tsx`:

```tsx
import { useState } from "react";

export function SettingsSheet({
  exportSave,
  importSave,
  importError,
  onClose,
}: {
  exportSave: () => string;
  importSave: (encoded: string) => void;
  importError: string | null;
  onClose: () => void;
}) {
  const [exportedSave, setExportedSave] = useState("");
  const [incomingSave, setIncomingSave] = useState("");

  return (
    <section className="sheet" aria-label="Save settings">
      <div className="sheet-header">
        <div>
          <p className="eyebrow">Vault</p>
          <h2>Save</h2>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div className="settings-stack">
        <button type="button" onClick={() => setExportedSave(exportSave())}>Export Save</button>
        {exportedSave && <textarea readOnly value={exportedSave} aria-label="Exported save" />}
        <label className="save-label">
          Paste exported save
          <textarea
            value={incomingSave}
            onChange={(event) => setIncomingSave(event.target.value)}
            aria-label="Import save"
          />
        </label>
        <button type="button" disabled={!incomingSave.trim()} onClick={() => importSave(incomingSave.trim())}>
          Import Save
        </button>
        {importError && <p className="error-text">{importError}</p>}
      </div>
    </section>
  );
}
```

Create `src/components/ZoneCompleteDialog.tsx`:

```tsx
export function ZoneCompleteDialog({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="zone-dialog" aria-label="Zone complete">
      <p className="eyebrow">District Secured</p>
      <h2>Broken Market Cleared</h2>
      <p>The citadel crews stripped the block and pushed the perimeter forward.</p>
      <button type="button" onClick={onRestart}>Run Block Again</button>
    </section>
  );
}
```

- [ ] **Step 3: Wire the app shell**

Replace `src/App.tsx` with:

```tsx
import { DeployBar } from "./components/DeployBar";
import { ResourceStrip } from "./components/ResourceStrip";
import { SettingsSheet } from "./components/SettingsSheet";
import { UpgradeSheet } from "./components/UpgradeSheet";
import { ZoneCompleteDialog } from "./components/ZoneCompleteDialog";
import { useGameController } from "./app/useGameController";

export function App() {
  const controller = useGameController();

  return (
    <main className="app-shell">
      <section className="map-layer" aria-label="Ash Citadel map">
        <div className="map-fallback">Tap the district to deploy the selected unit.</div>
      </section>
      <ResourceStrip config={controller.config} state={controller.state} />
      <DeployBar
        units={controller.unlockedUnits}
        state={controller.state}
        selectedUnitId={controller.selectedUnitId}
        onSelect={controller.setSelectedUnitId}
        onOpenUpgrades={() => controller.setSheet("upgrades")}
        onOpenSettings={() => controller.setSheet("settings")}
      />
      {controller.sheet === "upgrades" && (
        <UpgradeSheet
          config={controller.config}
          state={controller.state}
          onBuy={controller.buyUpgrade}
          onClose={() => controller.setSheet(null)}
        />
      )}
      {controller.sheet === "settings" && (
        <SettingsSheet
          exportSave={controller.exportCurrentSave}
          importSave={controller.importEncodedSave}
          importError={controller.importError}
          onClose={() => controller.setSheet(null)}
        />
      )}
      {controller.state.zoneCompleted && <ZoneCompleteDialog onRestart={controller.restartZone} />}
    </main>
  );
}
```

- [ ] **Step 4: Add mobile UI styles**

Append to `src/styles.css`:

```css
.resource-strip {
  position: absolute;
  top: max(8px, env(safe-area-inset-top));
  left: 8px;
  right: 8px;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.resource-pill,
.deploy-bar,
.sheet,
.zone-dialog {
  border: 1px solid var(--line);
  background: var(--panel);
  backdrop-filter: blur(10px);
}

.resource-pill {
  border-radius: 8px;
  padding: 6px 8px;
  min-width: 0;
}

.resource-pill span,
.resource-pill strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-pill span {
  color: #d6c7b3;
  font-size: 0.68rem;
}

.deploy-bar {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 3;
  display: grid;
  grid-template-columns: 72px 1fr 72px;
  gap: 8px;
  border-radius: 8px;
  padding: 8px;
}

.unit-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(94px, 1fr);
  gap: 8px;
  overflow-x: auto;
}

.unit-button,
.icon-command,
.sheet button,
.zone-dialog button {
  border: 1px solid var(--line);
  border-radius: 8px;
  color: #f6efe4;
  background: rgba(255, 255, 255, 0.06);
}

.upgrade-list,
.settings-stack {
  display: grid;
  gap: 10px;
}

.upgrade-card {
  display: grid;
  grid-template-columns: 1fr minmax(110px, 34%);
  gap: 10px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.upgrade-card h3,
.upgrade-card p {
  margin: 0 0 4px;
}

.settings-stack textarea {
  width: 100%;
  min-height: 96px;
  resize: vertical;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: #f6efe4;
  background: rgba(0, 0, 0, 0.24);
  padding: 10px;
}

.save-label {
  display: grid;
  gap: 6px;
  color: #d6c7b3;
}

.error-text {
  color: var(--danger);
}

.unit-button.active {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.unit-button span,
.unit-button small {
  display: block;
}

.unit-button small {
  color: #d6c7b3;
  font-size: 0.68rem;
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  max-height: 72dvh;
  overflow: auto;
  border-radius: 8px 8px 0 0;
  padding: 14px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.zone-dialog {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 50%;
  width: min(340px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
  border-radius: 8px;
  padding: 16px;
}
```

- [ ] **Step 5: Verify UI build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit React UI**

Run:

```bash
git add src/app src/components src/App.tsx src/styles.css
git commit -m "feat: add mobile game UI"
```

Expected: commit succeeds with controller and UI files.

## Task 8: Pixi Renderer And Tap-To-Deploy

**Files:**
- Create: `src/render/PixiStage.tsx`
- Create: `src/render/drawScene.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Create the scene drawing helper**

Create `src/render/drawScene.ts`:

```ts
import { Container, Graphics } from "pixi.js";
import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";

export function drawScene(stage: Container, config: GameConfig, state: GameState): void {
  stage.removeChildren();
  const zone = config.zones.find((item) => item.id === state.currentZoneId) ?? config.zones[0];

  const background = new Graphics();
  background.rect(0, 0, zone.size.width, zone.size.height).fill(0x292524);
  background.rect(40, 60, 170, 90).fill(0x3f3f46);
  background.rect(620, 160, 120, 180).fill(0x44403c);
  background.rect(420, 460, 220, 80).fill(0x3b2f25);
  stage.addChild(background);

  const base = new Graphics();
  base.circle(zone.base.x, zone.base.y, 44).fill(0x92400e).stroke({ color: 0xfbbf24, width: 4 });
  stage.addChild(base);

  for (const entity of state.entities) {
    const shape = new Graphics();
    if (entity.side === "unit") {
      shape.circle(entity.x, entity.y, entity.configId === "siege-rig" ? 15 : 10).fill(0x84cc16);
    } else {
      const color = entity.configId === "auto-turret" ? 0xf97316 : entity.configId === "mutant" ? 0x7c3aed : 0xef4444;
      shape.circle(entity.x, entity.y, entity.configId === "auto-turret" ? 14 : 10).fill(color);
    }
    stage.addChild(shape);

    const bar = new Graphics();
    const width = 24;
    const pct = Math.max(0, entity.health / entity.maxHealth);
    bar.rect(entity.x - width / 2, entity.y - 19, width, 3).fill(0x111111);
    bar.rect(entity.x - width / 2, entity.y - 19, width * pct, 3).fill(entity.side === "unit" ? 0x84cc16 : 0xef4444);
    stage.addChild(bar);
  }
}
```

- [ ] **Step 2: Create Pixi stage component**

Create `src/render/PixiStage.tsx`:

```tsx
import { Application, Container } from "pixi.js";
import { useEffect, useRef } from "react";
import type { GameConfig } from "../config/types";
import type { GameState } from "../engine/state";
import { drawScene } from "./drawScene";

export function PixiStage({
  config,
  state,
  onDeploy,
}: {
  config: GameConfig;
  state: GameState;
  onDeploy: (point: { x: number; y: number }) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);

  useEffect(() => {
    let disposed = false;

    async function boot() {
      if (!hostRef.current || appRef.current) return;

      const app = new Application();
      await app.init({
        resizeTo: hostRef.current,
        backgroundColor: 0x181512,
        antialias: false,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (disposed || !hostRef.current) {
        app.destroy();
        return;
      }

      const world = new Container();
      app.stage.addChild(world);
      app.canvas.className = "pixi-canvas";
      hostRef.current.appendChild(app.canvas);
      appRef.current = app;
      worldRef.current = world;
    }

    void boot();

    return () => {
      disposed = true;
      appRef.current?.destroy(true);
      appRef.current = null;
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!worldRef.current) return;
    drawScene(worldRef.current, config, state);
  }, [config, state]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const zone = config.zones.find((item) => item.id === state.currentZoneId) ?? config.zones[0];
    onDeploy({
      x: ((event.clientX - bounds.left) / bounds.width) * zone.size.width,
      y: ((event.clientY - bounds.top) / bounds.height) * zone.size.height,
    });
  }

  return <div ref={hostRef} className="pixi-host" onPointerDown={handlePointerDown} />;
}
```

- [ ] **Step 3: Mount Pixi in the app**

In `src/App.tsx`, replace the `.map-layer` fallback content with:

```tsx
<section className="map-layer" aria-label="Ash Citadel map">
  <PixiStage config={controller.config} state={controller.state} onDeploy={controller.deploy} />
</section>
```

Add this import:

```ts
import { PixiStage } from "./render/PixiStage";
```

- [ ] **Step 4: Style the Pixi host**

Append to `src/styles.css`:

```css
.pixi-host,
.pixi-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pixi-host {
  touch-action: manipulation;
}

.pixi-canvas {
  display: block;
  image-rendering: pixelated;
}
```

- [ ] **Step 5: Verify renderer build**

Run:

```bash
npm run build
```

Expected: build succeeds and Pixi types resolve.

- [ ] **Step 6: Commit Pixi renderer**

Run:

```bash
git add src/render src/App.tsx src/styles.css
git commit -m "feat: render playable district with Pixi"
```

Expected: commit succeeds with renderer files.

## Task 9: PWA Manifest, Icon, And Offline Cache

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/icon.svg`
- Create: `public/sw.js`
- Modify: `src/main.tsx`

- [ ] **Step 1: Add manifest and icon**

Create `public/manifest.webmanifest`:

```json
{
  "name": "Ash Citadel",
  "short_name": "Ash Citadel",
  "description": "A mobile idle-combat game about reclaiming a ruined city block.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#181512",
  "theme_color": "#181512",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

Create `public/icon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#181512"/>
  <path d="M96 376h320v56H96z" fill="#d97706"/>
  <path d="M136 376V216l120-96 120 96v160z" fill="#292524" stroke="#fbbf24" stroke-width="20"/>
  <path d="M204 376V264h104v112z" fill="#451a03"/>
  <path d="M166 194h180l-90-72z" fill="#ef4444"/>
</svg>
```

- [ ] **Step 2: Add service worker**

Create `public/sw.js`:

```js
const CACHE_NAME = "ash-citadel-v1";
const CORE_ASSETS = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/"))),
  );
});
```

- [ ] **Step 3: Verify production build includes PWA files**

Run:

```bash
npm run build
test -f dist/manifest.webmanifest
test -f dist/icon.svg
test -f dist/sw.js
```

Expected: all commands exit with code `0`.

- [ ] **Step 4: Commit PWA assets**

Run:

```bash
git add public/manifest.webmanifest public/icon.svg public/sw.js src/main.tsx
git commit -m "feat: add installable PWA support"
```

Expected: commit succeeds with public PWA files.

## Task 10: Mobile And PWA Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/mobile.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Add Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari-shape",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
```

- [ ] **Step 2: Add mobile smoke test**

Create `tests/e2e/mobile.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("mobile layout renders core controls and nonblank canvas", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Power")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Deployment controls" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Militia Squad/i })).toBeVisible();

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(200);
  expect(box?.height).toBeGreaterThan(300);

  await page.mouse.click((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2);
  await expect(page.getByText("Power")).toBeVisible();
});

test("manifest is available", async ({ page }) => {
  const response = await page.goto("/manifest.webmanifest");
  expect(response?.ok()).toBe(true);
  expect(await response?.json()).toMatchObject({ name: "Ash Citadel", display: "standalone" });
});
```

- [ ] **Step 3: Install browser runtime**

Run:

```bash
npx playwright install chromium
```

Expected: Chromium browser downloads or is already installed.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run check
npm run e2e
```

Expected: unit tests, build, and Playwright tests pass.

- [ ] **Step 5: Manual mobile smoke**

Run:

```bash
npm run dev -- --host 0.0.0.0
```

Open the printed local-network URL on a phone. Verify:

- app opens directly into the game screen
- resource strip fits without text overlap
- deploy buttons are tappable
- tap on map deploys the selected unit
- upgrades sheet opens and closes
- save/export sheet opens and closes
- reload keeps progress
- browser offers Add to Home Screen or equivalent install action

- [ ] **Step 6: Commit verification**

Run:

```bash
git add playwright.config.ts tests/e2e/mobile.spec.ts package.json package-lock.json
git commit -m "test: add mobile PWA smoke coverage"
```

Expected: commit succeeds with verification files.

## Final Verification

- [ ] Run:

```bash
npm run check
npm run e2e
git status --short
```

Expected:

- `npm run check` exits with code `0`
- `npm run e2e` exits with code `0`
- `git status --short` shows no uncommitted implementation changes

## Spec Coverage Review

- PWA scaffold: Task 1 and Task 9
- TypeScript + Pixi + React stack: Task 1, Task 7, Task 8
- `src/games/ash-citadel` config location: Task 3
- config validation: Task 2 and Task 3
- one playable zone: Task 3 and Task 5
- three unit types and three enemy types: Task 3
- engine loop for resources, units, enemies, combat, rewards, and zone completion: Task 4 and Task 5
- local save/load and import/export: Task 6 and Task 7
- installable manifest and service worker: Task 9
- mobile viewport smoke verification: Task 10
- first-pass simple Pixi/CSS shape art: Task 8 and Task 9
