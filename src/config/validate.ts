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
