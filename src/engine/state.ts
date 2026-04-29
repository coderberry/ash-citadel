import type { GameConfig } from "../config/types";
import { evaluateFormula } from "../config/formulas";

export type RunStatus = "active" | "cleared" | "failed";

export type RunStats = {
  defeatedEnemies: number;
  earned: Record<string, number>;
};

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
  runStatus: RunStatus;
  runStats: RunStats;
  lastSavedAt: number;
};

export function createRunStats(): RunStats {
  return {
    defeatedEnemies: 0,
    earned: {},
  };
}

export function getRunResourceStartingValue(config: GameConfig, state: GameState, resourceId: string): number {
  const resource = config.resources.find((item) => item.id === resourceId);
  if (!resource) return 0;

  const bonus = config.upgrades.reduce((total, upgrade) => {
    if (upgrade.effect.type !== "resourceStartingValue" || upgrade.effect.resourceId !== resourceId) {
      return total;
    }

    const rank = getUpgradeRank(state, upgrade.id);
    let gained = 0;
    for (let index = 0; index < rank; index += 1) {
      gained += evaluateFormula(upgrade.effect.value, index);
    }
    return total + gained;
  }, 0);

  const cap = getResourceCap(config, resourceId);
  return Math.min(cap ?? Number.POSITIVE_INFINITY, resource.startingValue + bonus);
}

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
    runStatus: "active",
    runStats: createRunStats(),
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
    runStatus: state.runStatus ?? (state.zoneCompleted ? "cleared" : "active"),
    runStats: {
      defeatedEnemies: state.runStats?.defeatedEnemies ?? 0,
      earned: { ...(state.runStats?.earned ?? {}) },
    },
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
      .reduce((multiplier, upgrade) => {
        if (upgrade.effect.type !== "resourcePassiveRate" || upgrade.effect.resourceId !== resource.id) {
          return multiplier;
        }
        return multiplier * evaluateFormula(upgrade.effect.value, getUpgradeRank(next, upgrade.id));
      }, 1);

    const gained = evaluateFormula(resource.passiveRate) * rateMultiplier * deltaSeconds;
    const cap = getResourceCap(config, resource.id);
    next.resources[resource.id] = Math.min(cap ?? Number.POSITIVE_INFINITY, next.resources[resource.id] + gained);
    next.totals[resource.id] = (next.totals[resource.id] ?? 0) + gained;
  }

  return next;
}
