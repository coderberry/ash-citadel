import { describe, expect, it } from "vitest";
import { validateGameConfig } from "../../src/config/validate";
import { defaultGameConfigId, gameConfigs, getGameConfig, getGameConfigFromUrl } from "../../src/games/registry";

describe("game config registry", () => {
  it("uses Ash Citadel as the default game", () => {
    expect(defaultGameConfigId).toBe("ash-citadel");
    expect(getGameConfig().game.id).toBe("ash-citadel");
    expect(getGameConfig("missing-game").game.id).toBe("ash-citadel");
  });

  it("resolves a game config from launch URL parameters", () => {
    expect(getGameConfigFromUrl("http://localhost:5173/?game=dust-harbor").game.id).toBe("dust-harbor");
    expect(getGameConfigFromUrl("http://localhost:5173/?config=ash-citadel").game.id).toBe("ash-citadel");
    expect(getGameConfigFromUrl("http://localhost:5173/?game=unknown").game.id).toBe("ash-citadel");
  });

  it("ships unique valid game configs", () => {
    expect(gameConfigs.map((config) => config.game.id)).toEqual(["ash-citadel", "dust-harbor"]);
    expect(new Set(gameConfigs.map((config) => config.game.id)).size).toBe(gameConfigs.length);

    for (const config of gameConfigs) {
      expect(validateGameConfig(config)).toEqual([]);
    }
  });
});
