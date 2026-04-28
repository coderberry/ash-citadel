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
