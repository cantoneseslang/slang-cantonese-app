export const LINE_ENTRY_KEY = 'onren-line-entry';

export function lineEntryPath(q: string) {
  return '/?entry=line&q=' + encodeURIComponent(q.trim().slice(0, 80));
}

export function safeLineEntryPath(value: string | null | undefined) {
  if (!value) return null;
  try {
    const decoded = value.startsWith('/') ? value : decodeURIComponent(value);
    const url = new URL(decoded, 'https://local');
    if (url.pathname !== '/') return null;
    if (url.searchParams.get('entry') !== 'line') return null;
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return null;
    return lineEntryPath(q);
  } catch {
    return null;
  }
}

export function rememberLineEntry(q: string) {
  const path = lineEntryPath(q);
  try {
    sessionStorage.setItem(LINE_ENTRY_KEY, path);
  } catch {
    // private mode
  }
  document.cookie = `${LINE_ENTRY_KEY}=${encodeURIComponent(path)}; path=/; max-age=1800; samesite=lax`;
}

export function readRememberedLineEntry() {
  try {
    return safeLineEntryPath(sessionStorage.getItem(LINE_ENTRY_KEY));
  } catch {
    return null;
  }
}

export function forgetLineEntry() {
  try {
    sessionStorage.removeItem(LINE_ENTRY_KEY);
  } catch {
    // private mode
  }
  document.cookie = `${LINE_ENTRY_KEY}=; path=/; max-age=0; samesite=lax`;
}
