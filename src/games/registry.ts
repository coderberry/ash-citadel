import type { GameConfig } from "../config/types";
import { ashCitadelConfig } from "./ash-citadel/config";
import { dustHarborConfig } from "./dust-harbor/config";

export const defaultGameConfigId = "ash-citadel";

export const gameConfigs: GameConfig[] = [ashCitadelConfig, dustHarborConfig];

export function getGameConfig(configId?: string | null): GameConfig {
  return gameConfigs.find((config) => config.game.id === configId) ?? gameConfigs.find((config) => config.game.id === defaultGameConfigId) ?? gameConfigs[0];
}

export function getGameConfigFromUrl(url?: string): GameConfig {
  const href = url ?? (typeof window === "undefined" ? "" : window.location.href);
  const parsed = new URL(href || "/", "http://localhost");
  return getGameConfig(parsed.searchParams.get("game") ?? parsed.searchParams.get("config"));
}
