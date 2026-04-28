import { useGameController } from "./app/useGameController";
import { DeployBar } from "./components/DeployBar";
import { ResourceStrip } from "./components/ResourceStrip";
import { SettingsSheet } from "./components/SettingsSheet";
import { UpgradeSheet } from "./components/UpgradeSheet";
import { ZoneCompleteDialog } from "./components/ZoneCompleteDialog";

export function App() {
  const controller = useGameController();

  return (
    <main className="app-shell">
      <section className="map-layer" aria-label="Ash Citadel map">
        <div className="map-fallback">Tap the district to deploy the selected unit.</div>
      </section>
      <ResourceStrip config={controller.config} state={controller.state} />
      <DeployBar
        units={controller.unlockedUnits}
        state={controller.state}
        selectedUnitId={controller.selectedUnitId}
        onSelect={controller.setSelectedUnitId}
        onOpenUpgrades={() => controller.setSheet("upgrades")}
        onOpenSettings={() => controller.setSheet("settings")}
      />
      {controller.sheet === "upgrades" && (
        <UpgradeSheet
          config={controller.config}
          state={controller.state}
          onBuy={controller.buyUpgrade}
          onClose={() => controller.setSheet(null)}
        />
      )}
      {controller.sheet === "settings" && (
        <SettingsSheet
          exportSave={controller.exportCurrentSave}
          importSave={controller.importEncodedSave}
          importError={controller.importError}
          onClose={() => controller.setSheet(null)}
        />
      )}
      {controller.state.zoneCompleted && <ZoneCompleteDialog onRestart={controller.restartZone} />}
    </main>
  );
}
