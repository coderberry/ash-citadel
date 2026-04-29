import { shortZoneName } from "../config/display";
import type { ZoneConfig } from "../config/types";

export function DistrictStrip({
  currentZoneId,
  zones,
  unlockedZoneIds,
  completedZoneIds,
  onSelect,
}: {
  currentZoneId: string;
  zones: ZoneConfig[];
  unlockedZoneIds: string[];
  completedZoneIds: string[];
  onSelect: (zoneId: string) => void;
}) {
  return (
    <nav className="district-strip" aria-label="Districts">
      {zones.map((zone, index) => {
        const unlocked = unlockedZoneIds.includes(zone.id);
        const completed = completedZoneIds.includes(zone.id);
        const active = zone.id === currentZoneId;
        const label = `${shortZoneName(zone.name)} ${!unlocked ? "Locked" : completed ? "Cleared" : active ? "Current" : "Open"}`;

        return (
          <button
            type="button"
            key={zone.id}
            className={active ? "district-button active" : "district-button"}
            disabled={!unlocked}
            aria-label={label}
            onClick={() => onSelect(zone.id)}
          >
            <span>{`0${index + 1}`}</span>
            <strong>{shortZoneName(zone.name)}</strong>
            <small>{!unlocked ? "Locked" : completed ? "Cleared" : active ? "Current" : "Open"}</small>
          </button>
        );
      })}
    </nav>
  );
}
