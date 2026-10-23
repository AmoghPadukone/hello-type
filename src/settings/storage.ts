import { STORAGE_KEY } from '@/config/constants';
import { isMode, normalizeSettings } from './normalize';
import type { Mode, Settings } from './settings.types';

/** The workspace named in the URL hash (#graphic / #print), if any. */
export function modeFromHash(): Mode | null {
  const hash = location.hash.slice(1);
  return isMode(hash) ? hash : null;
}

/** Initial settings: stored settings, then `?text=` and the URL hash on top. */
export function loadSettings(): Settings {
  let stored: unknown;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    stored = null; // private mode / corrupt value: fall back to defaults
  }
  const settings = normalizeSettings(stored);
  const text = new URLSearchParams(location.search).get('text');
  const mode = modeFromHash();
  return normalizeSettings({
    ...settings,
    ...(text === null ? {} : { text }),
    ...(mode ? { mode } : {}),
  });
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable: settings just won't persist
  }
}
