/**
 * 空本文や非JSONのレスポンスで response.json() が落ちるのを防ぐ。
 */
export async function parseResponseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}
