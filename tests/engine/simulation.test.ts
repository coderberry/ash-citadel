import { describe, expect, it } from "vitest";
import { ashCitadelConfig } from "../../src/games/ash-citadel/config";
import { createInitialGameState, tickResources } from "../../src/engine/state";
import { canAffordCost, canAffordUpgrade, getUpgradeCost, purchaseUpgrade } from "../../src/engine/upgrades";
import { deployUnit, getNextUnlockedZone, getUnlockedZones, resetZone, selectZone, tickCombat } from "../../src/engine/simulation";

const progressionConfig = {
  ...ashCitadelConfig,
  zones: [
    ashCitadelConfig.zones[0],
    {
      id: "test-locked-district",
      name: "Test Locked District",
      size: { width: 920, height: 680 },
      base: { x: 110, y: 340 },
      enemyClusters: [{ enemyId: "raider", count: 1, x: 520, y: 340, radius: 20 }],
      unlock: { type: "zoneCompleted", zoneId: ashCitadelConfig.zones[0].id },
      completion: { type: "allEnemiesDefeated" },
    },
  ],
} satisfies typeof ashCitadelConfig;

function runMilitiaPush(state = resetZone(ashCitadelConfig, createInitialGameState(ashCitadelConfig))) {
  const militia = ashCitadelConfig.units.find((unit) => unit.id === "militia-squad");
  const zone = ashCitadelConfig.zones[0];
  if (!militia) throw new Error("Militia Squad config is required for balance tests.");

  for (let tick = 0; tick < 240 && state.runStatus === "active"; tick += 1) {
    if (canAffordCost(state, militia.cost)) {
      state = deployUnit(ashCitadelConfig, state, "militia-squad", { x: zone.base.x + 48, y: zone.base.y });
    }

    state = tickResources(ashCitadelConfig, state, 0.5);
    state = tickCombat(ashCitadelConfig, state, 0.5);
  }

  return state;
}

function buyEarlyUpgrades(state: ReturnType<typeof createInitialGameState>) {
  const priority = ["trained-militia", "reinforced-kit", "generator-overdrive", "ration-vault"];
  let next = state;
  let purchased = true;

  while (purchased) {
    purchased = false;
    for (const upgradeId of priority) {
      if (canAffordUpgrade(ashCitadelConfig, next, upgradeId)) {
        next = purchaseUpgrade(ashCitadelConfig, next, upgradeId);
        purchased = true;
      }
    }
  }

  return next;
}

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
    const upgrade = ashCitadelConfig.upgrades.find((item) => item.id === "trained-militia");
    if (!upgrade) throw new Error("trained-militia upgrade must exist.");
    const cost = getUpgradeCost(upgrade, 0);

    expect(canAffordUpgrade(ashCitadelConfig, state, "trained-militia")).toBe(true);
    const next = purchaseUpgrade(ashCitadelConfig, state, "trained-militia");

    expect(next.resources.scrap).toBe(20 - cost.scrap);
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
    const rations = ashCitadelConfig.resources.find((resource) => resource.id === "rations");
    if (!rations) throw new Error("rations resource must exist.");
    state.resources.scrap = 40;

    const next = purchaseUpgrade(ashCitadelConfig, state, "ration-vault");

    expect(next.resources.rations).toBe(rations.startingValue + 1);
    expect(next.upgradeRanks["ration-vault"]).toBe(1);
  });
});

describe("combat simulation", () => {
  it("only includes zones whose unlock conditions are satisfied", () => {
    const state = createInitialGameState(progressionConfig);

    expect(getUnlockedZones(progressionConfig, state).map((zone) => zone.id)).toEqual(["block-01-broken-market"]);

    state.completedZoneIds.push("block-01-broken-market");

    expect(getUnlockedZones(progressionConfig, state).map((zone) => zone.id)).toEqual([
      "block-01-broken-market",
      "test-locked-district",
    ]);
  });

  it("does not select a locked zone", () => {
    const state = resetZone(progressionConfig, createInitialGameState(progressionConfig));
    const next = selectZone(progressionConfig, state, "test-locked-district");

    expect(next.currentZoneId).toBe("block-01-broken-market");
    expect(next.entities.filter((entity) => entity.side === "enemy")).toHaveLength(7);
  });

  it("selects and resets an unlocked zone", () => {
    const state = resetZone(progressionConfig, createInitialGameState(progressionConfig));
    state.completedZoneIds.push("block-01-broken-market");

    const next = selectZone(progressionConfig, state, "test-locked-district");

    expect(next.currentZoneId).toBe("test-locked-district");
    expect(next.runStatus).toBe("active");
    expect(next.entities.filter((entity) => entity.side === "enemy")).toHaveLength(1);
  });

  it("finds the next unlocked zone after the current district", () => {
    const state = createInitialGameState(progressionConfig);

    expect(getNextUnlockedZone(progressionConfig, state)?.id).toBeUndefined();

    state.completedZoneIds.push("block-01-broken-market");

    expect(getNextUnlockedZone(progressionConfig, state)?.id).toBe("test-locked-district");
  });

  it("resets run resources while preserving persistent rewards", () => {
    const state = createInitialGameState(ashCitadelConfig);
    const power = ashCitadelConfig.resources.find((resource) => resource.id === "power");
    const rations = ashCitadelConfig.resources.find((resource) => resource.id === "rations");

    expect(power?.resetOnRun).toBe(true);
    expect(rations?.resetOnRun).toBe(true);

    state.resources.power = 0;
    state.resources.rations = 0;
    state.resources.scrap = 13;
    state.resources.intel = 2;

    const next = resetZone(ashCitadelConfig, state);

    expect(next.resources.power).toBe(power?.startingValue);
    expect(next.resources.rations).toBe(rations?.startingValue);
    expect(next.resources.scrap).toBe(13);
    expect(next.resources.intel).toBe(2);
    expect(next.runStatus).toBe("active");
    expect(next.runStats.earned.scrap ?? 0).toBe(0);
  });

  it("spawns enemies for the current zone", () => {
    const state = resetZone(ashCitadelConfig, createInitialGameState(ashCitadelConfig));

    expect(state.entities.filter((entity) => entity.side === "enemy")).toHaveLength(7);
  });

  it("uses forgiving first-run costs for the mobile opening loop", () => {
    const militia = ashCitadelConfig.units.find((unit) => unit.id === "militia-squad");
    const rations = ashCitadelConfig.resources.find((resource) => resource.id === "rations");
    const trainedMilitia = ashCitadelConfig.upgrades.find((upgrade) => upgrade.id === "trained-militia");

    if (!militia || !rations || !trainedMilitia) throw new Error("Opening loop config is incomplete.");

    expect(militia.cost.power).toBeLessThanOrEqual(6);
    expect(militia.cost.rations).toBe(1);
    expect(rations.startingValue).toBeGreaterThanOrEqual(5);
    expect(getUpgradeCost(trainedMilitia, 0).scrap).toBeLessThanOrEqual(8);
  });

  it("defines a three-district Ash Citadel progression chain", () => {
    expect(ashCitadelConfig.zones.map((zone) => zone.id)).toEqual([
      "block-01-broken-market",
      "block-02-transit-spine",
      "block-03-signal-yard",
    ]);

    expect(ashCitadelConfig.zones[0].unlock).toEqual({ type: "always" });
    expect(ashCitadelConfig.zones[1].unlock).toEqual({ type: "zoneCompleted", zoneId: "block-01-broken-market" });
    expect(ashCitadelConfig.zones[2].unlock).toEqual({ type: "zoneCompleted", zoneId: "block-02-transit-spine" });
  });

  it("unlocks Ash Citadel districts as previous districts are cleared", () => {
    const state = createInitialGameState(ashCitadelConfig);

    expect(getUnlockedZones(ashCitadelConfig, state).map((zone) => zone.id)).toEqual(["block-01-broken-market"]);

    state.completedZoneIds.push("block-01-broken-market");

    expect(getUnlockedZones(ashCitadelConfig, state).map((zone) => zone.id)).toEqual([
      "block-01-broken-market",
      "block-02-transit-spine",
    ]);
    expect(getNextUnlockedZone(ashCitadelConfig, state)?.id).toBe("block-02-transit-spine");

    state.currentZoneId = "block-02-transit-spine";
    state.completedZoneIds.push("block-02-transit-spine");

    expect(getUnlockedZones(ashCitadelConfig, state).map((zone) => zone.id)).toEqual([
      "block-01-broken-market",
      "block-02-transit-spine",
      "block-03-signal-yard",
    ]);
    expect(getNextUnlockedZone(ashCitadelConfig, state)?.id).toBe("block-03-signal-yard");
  });

  it("deploys a unit when resources are available", () => {
    const state = resetZone(ashCitadelConfig, createInitialGameState(ashCitadelConfig));
    const militia = ashCitadelConfig.units.find((unit) => unit.id === "militia-squad");
    if (!militia) throw new Error("Militia Squad config is required.");

    const next = deployUnit(ashCitadelConfig, state, "militia-squad", { x: 180, y: 340 });

    expect(next.entities.some((entity) => entity.configId === "militia-squad" && entity.side === "unit")).toBe(true);
    expect(next.resources.power).toBe(state.resources.power - militia.cost.power);
    expect(next.resources.rations).toBe(state.resources.rations - militia.cost.rations);
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

  it("marks a push failed when no crews remain and no unlocked unit can be afforded after waiting", () => {
    let state = resetZone(ashCitadelConfig, createInitialGameState(ashCitadelConfig));
    state.resources.power = 0;
    state.resources.rations = 0;

    state = tickCombat(ashCitadelConfig, state, 1);

    expect(state.runStatus).toBe("failed");
    expect(state.zoneCompleted).toBe(false);
  });

  it("retries a failed push without losing earned scrap", () => {
    const state = createInitialGameState(ashCitadelConfig);
    state.resources.scrap = 9;
    state.resources.power = 0;
    state.resources.rations = 0;
    state.runStatus = "failed";
    state.runStats.earned.scrap = 9;

    const next = resetZone(ashCitadelConfig, state);

    expect(next.runStatus).toBe("active");
    expect(next.resources.scrap).toBe(9);
    expect(next.resources.power).toBe(ashCitadelConfig.resources.find((resource) => resource.id === "power")?.startingValue);
    expect(next.resources.rations).toBe(ashCitadelConfig.resources.find((resource) => resource.id === "rations")?.startingValue);
    expect(next.runStats.earned.scrap ?? 0).toBe(0);
    expect(next.entities.filter((entity) => entity.side === "enemy")).toHaveLength(7);
  });

  it("fresh militia push reaches an outcome and earns scrap", () => {
    const state = runMilitiaPush();

    expect(["failed", "cleared"]).toContain(state.runStatus);
    expect(state.runStats.defeatedEnemies).toBeGreaterThan(0);
    expect(state.runStats.earned.scrap ?? 0).toBeGreaterThanOrEqual(8);
    expect(state.resources.scrap).toBeGreaterThanOrEqual(8);
  });

  it("Block 01 clears by the third push after buying early upgrades", () => {
    let state = createInitialGameState(ashCitadelConfig);

    for (let run = 0; run < 3 && state.runStatus !== "cleared"; run += 1) {
      state = runMilitiaPush(resetZone(ashCitadelConfig, state));
      state = buyEarlyUpgrades(state);
    }

    expect(state.runStatus).toBe("cleared");
    expect(state.completedZoneIds).toContain("block-01-broken-market");
  });
});
