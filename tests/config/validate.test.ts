import { describe, expect, it } from "vitest";
import type { GameConfig } from "../../src/config/types";
import { validateGameConfig } from "../../src/config/validate";
import { ashCitadelConfig } from "../../src/games/ash-citadel/config";

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

describe("ashCitadelConfig", () => {
  it("ships with no validation errors", () => {
    expect(validateGameConfig(ashCitadelConfig)).toEqual([]);
  });
});
