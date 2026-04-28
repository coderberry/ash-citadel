import type { GameConfig } from "../config/types";
import { createInitialGameState, type GameState } from "../engine/state";

const SAVE_PREFIX = "ash-citadel-save";

function storageKey(configId: string): string {
  return `${SAVE_PREFIX}:${configId}`;
}

function isGameState(value: unknown): value is GameState {
  return Boolean(
    value &&
      typeof value === "object" &&
      "configId" in value &&
      "configVersion" in value &&
      "resources" in value &&
      "upgradeRanks" in value &&
      "entities" in value,
  );
}

export function saveGameState(state: GameState): void {
  const stateToSave: GameState = { ...state, lastSavedAt: Date.now() };
  localStorage.setItem(storageKey(state.configId), JSON.stringify(stateToSave));
}

export function loadGameState(config: GameConfig): GameState {
  const raw = localStorage.getItem(storageKey(config.game.id));
  if (!raw) return createInitialGameState(config);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isGameState(parsed) && parsed.configId === config.game.id) {
      return parsed;
    }
  } catch {
    return createInitialGameState(config);
  }

  return createInitialGameState(config);
}

export function exportSave(state: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(config: GameConfig, encoded: string): GameState {
  const parsed: unknown = JSON.parse(decodeURIComponent(escape(atob(encoded))));
  if (!isGameState(parsed) || parsed.configId !== config.game.id) {
    throw new Error("Save file does not match this game config.");
  }
  return parsed;
}
