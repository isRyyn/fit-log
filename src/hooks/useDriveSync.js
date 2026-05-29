import { useState, useCallback } from 'react';
import { syncToDrive, authorise, clearToken, isAuthorised } from '../sync/driveSync.js';

export function useDriveSync() {
  const [authorised, setAuthorised] = useState(isAuthorised());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(() => {
    const s = localStorage.getItem('last_sync');
    return s ? JSON.parse(s) : null;
  });
  const [error, setSyncError] = useState(null);

  const connect = useCallback(async () => {
    setSyncError(null);
    try {
      await authorise();
      setAuthorised(true);
    } catch (err) {
      setSyncError(err.message);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearToken();
    setAuthorised(false);
    setSyncError(null);
  }, []);

  const exportNow = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const result = await syncToDrive();
      const record = { ...result, syncedAt: new Date().toISOString() };
      setLastSync(record);
      localStorage.setItem('last_sync', JSON.stringify(record));
      return result;
    } catch (err) {
      setSyncError(err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { authorised, syncing, lastSync, error, connect, disconnect, exportNow };
}
