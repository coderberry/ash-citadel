import { useState } from "react";

export function SettingsSheet({
  exportSave,
  importSave,
  importError,
  onClose,
}: {
  exportSave: () => string;
  importSave: (encoded: string) => void;
  importError: string | null;
  onClose: () => void;
}) {
  const [exportedSave, setExportedSave] = useState("");
  const [incomingSave, setIncomingSave] = useState("");

  return (
    <section className="sheet" aria-label="Save settings">
      <div className="sheet-header">
        <div>
          <p className="eyebrow">Vault</p>
          <h2>Save</h2>
        </div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="settings-stack">
        <button type="button" onClick={() => setExportedSave(exportSave())}>
          Export Save
        </button>
        {exportedSave && <textarea readOnly value={exportedSave} aria-label="Exported save" />}
        <label className="save-label">
          Paste exported save
          <textarea value={incomingSave} onChange={(event) => setIncomingSave(event.target.value)} aria-label="Import save" />
        </label>
        <button type="button" disabled={!incomingSave.trim()} onClick={() => importSave(incomingSave.trim())}>
          Import Save
        </button>
        {importError && <p className="error-text">{importError}</p>}
      </div>
    </section>
  );
}
