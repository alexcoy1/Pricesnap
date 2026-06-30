const STORAGE_KEY = 'paytrail_dev_anthropic_key';

/** Dev-only: browser-stored key for local invoice reading (never used in production builds). */
export function getDevApiKey(): string {
  if (!import.meta.env.DEV) return '';
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setDevApiKey(key: string): void {
  if (!import.meta.env.DEV) return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY);
}

export function hasDevApiKey(): boolean {
  return getDevApiKey().length > 0;
}
