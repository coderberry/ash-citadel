import { beforeEach, describe, expect, it } from "vitest";
import { ashCitadelConfig } from "../../src/games/ash-citadel/config";
import { createInitialGameState } from "../../src/engine/state";
import { exportSave, importSave, loadGameState, saveGameState } from "../../src/persistence/save";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("save persistence", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
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
