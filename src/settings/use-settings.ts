import { useCallback, useEffect, useState } from 'react';
import { DEBOUNCE_MS } from '@/config/constants';
import { normalizeSettings } from './normalize';
import type { Settings, UpdateSettings } from './settings.types';
import { loadSettings, modeFromHash, saveSettings } from './storage';

/** App settings with validation on every update, URL-hash sync and debounced persistence. */
export function useSettings(): [Settings, UpdateSettings] {
  const [settings, setSettings] = useState(loadSettings);

  const update = useCallback<UpdateSettings>(
    patch => setSettings(s => normalizeSettings({ ...s, ...patch, print: { ...s.print, ...patch.print } })),
    [],
  );

  // Keep the open workspace in the URL (#graphic / #print) so it can be linked to.
  useEffect(() => {
    // A shared ?text= link has done its job once loaded; drop it so edits survive a reload.
    const url = `${location.pathname}#${settings.mode}`;
    if (location.search || location.hash !== `#${settings.mode}`) history.replaceState(null, '', url);
  }, [settings.mode]);

  useEffect(() => {
    const onHash = () => {
      const mode = modeFromHash();
      if (mode) setSettings(s => (s.mode === mode ? s : { ...s, mode }));
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => saveSettings(settings), DEBOUNCE_MS.persist);
    return () => clearTimeout(t);
  }, [settings]);

  return [settings, update];
}
