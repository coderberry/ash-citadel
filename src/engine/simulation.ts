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
