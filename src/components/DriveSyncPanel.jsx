import React, { useState } from 'react';
import { useDriveSync } from '../hooks/useDriveSync.js';
import '../styles/DriveSyncPanel.css';

export default function DriveSyncPanel() {
  const { authorised, syncing, lastSync, error, connect, disconnect, exportNow } = useDriveSync();
  const [result, setResult] = useState(null);

  const handleExport = async () => {
    setResult(null);
    try {
      const r = await exportNow();
      setResult(r);
    } catch (_) {}
  };

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : null;

  return (
    <div className="drive-sync-panel">
      <p className="drive-sync-panel__title">
        Google Drive backup
      </p>

      {!authorised ? (
        <button onClick={connect} className="drive-sync-panel__btn-primary">
          Connect Google Drive
        </button>
      ) : (
        <div className="drive-sync-panel__btn-group">
          <div className="drive-sync-panel__btn-row">
            <button onClick={handleExport} disabled={syncing} className="drive-sync-panel__btn-primary drive-sync-panel__backup-btn">
              {syncing ? 'Uploading…' : '↑ Backup to Drive'}
            </button>
            <button onClick={disconnect} className="drive-sync-panel__btn-secondary">
              Disconnect
            </button>
          </div>

          {lastSync && !result && (
            <p className="drive-sync-panel__last-sync">
              Last backup: {fmtDate(lastSync.syncedAt)} · {lastSync.workoutCount} workouts
            </p>
          )}

          {result && (
            <div className="drive-sync-panel__success">
              <p className="drive-sync-panel__success-text">✓ Backed up {result.workoutCount} workouts</p>
              <p className="drive-sync-panel__success-info">{result.fileName}</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="drive-sync-panel__error">{error}</p>}
    </div>
  );
}
