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
