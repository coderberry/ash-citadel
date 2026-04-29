import { useEffect, useMemo, useRef, useState } from "react";
import type { UnitConfig } from "../config/types";
import { tickResources, type GameState } from "../engine/state";
import { deployUnit, getNextUnlockedZone, getUnlockedZones, resetZone, selectZone, tickCombat } from "../engine/simulation";
import { purchaseUpgrade } from "../engine/upgrades";
import { exportSave, importSave, loadGameState, saveGameState } from "../persistence/save";
import { ashCitadelConfig } from "../games/ash-citadel/config";

function loadControllerState() {
  const loaded = loadGameState(ashCitadelConfig);
  if (!loaded.runStatus || (loaded.runStatus === "active" && loaded.entities.length === 0)) {
    return resetZone(ashCitadelConfig, loaded);
  }

  return loaded;
}

export function useGameController() {
  const config = ashCitadelConfig;
  const [state, setState] = useState<GameState>(loadControllerState);
  const stateRef = useRef(state);
  const [selectedUnitId, setSelectedUnitId] = useState("militia-squad");
  const [sheet, setSheet] = useState<"upgrades" | "settings" | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let previous = performance.now();
    let frame = 0;

    const run = (now: number) => {
      const delta = Math.min(0.2, (now - previous) / 1000);
      previous = now;
      setState((current) => tickCombat(config, tickResources(config, current, delta), delta));
      frame = requestAnimationFrame(run);
    };

    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [config]);

  useEffect(() => {
    const id = window.setInterval(() => saveGameState(stateRef.current), 5000);
    return () => window.clearInterval(id);
  }, []);

  const unlockedUnits = useMemo(
    () => config.units.filter((unit) => state.unlockedUnitIds.includes(unit.id)),
    [config.units, state.unlockedUnitIds],
  );
  const unlockedZones = useMemo(() => getUnlockedZones(config, state), [config, state]);
  const nextZone = useMemo(() => getNextUnlockedZone(config, state), [config, state]);

  function deploy(point: { x: number; y: number }) {
    setState((current) => deployUnit(config, current, selectedUnitId, point));
  }

  function buyUpgrade(upgradeId: string) {
    setState((current) => purchaseUpgrade(config, current, upgradeId));
  }

  function restartZone() {
    setState((current) => resetZone(config, { ...current, zoneCompleted: false }));
  }

  function chooseZone(zoneId: string) {
    setState((current) => selectZone(config, current, zoneId));
  }

  function advanceZone() {
    setState((current) => {
      const next = getNextUnlockedZone(config, current);
      return next ? selectZone(config, current, next.id) : current;
    });
  }

  function exportCurrentSave(): string {
    saveGameState(state);
    return exportSave(state);
  }

  function importEncodedSave(encoded: string) {
    try {
      const imported = resetZone(config, importSave(config, encoded));
      setImportError(null);
      setState(imported);
      saveGameState(imported);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to import save.");
    }
  }

  return {
    config,
    state,
    selectedUnitId,
    setSelectedUnitId,
    sheet,
    setSheet,
    importError,
    unlockedUnits: unlockedUnits as UnitConfig[],
    unlockedZones,
    nextZone,
    deploy,
    buyUpgrade,
    restartZone,
    chooseZone,
    advanceZone,
    exportCurrentSave,
    importEncodedSave,
  };
}
