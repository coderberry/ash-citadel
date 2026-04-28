import { describe, expect, it } from "vitest";
import { ashCitadelConfig } from "../../src/games/ash-citadel/config";
import { createInitialGameState, tickResources } from "../../src/engine/state";
import { canAffordUpgrade, purchaseUpgrade } from "../../src/engine/upgrades";
import { deployUnit, resetZone, tickCombat } from "../../src/engine/simulation";

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
