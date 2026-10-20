import { forbidKantoGo } from '@/lib/asr-cantonese-fix';

export type InterpreterDirection = 'ja-to-target' | 'yue-to-ja';

export function getInterpreterAsrLang(direction: InterpreterDirection): 'ja-JP' | 'zh-HK' {
  return direction === 'yue-to-ja' ? 'zh-HK' : 'ja-JP';
}

export function normalizeInterpreterTranscript(
  text: string,
  direction: InterpreterDirection
): string {
  if (!text || direction === 'yue-to-ja') return text;
  return forbidKantoGo(text);
}

const CLAUSE_END_RE = /[。．.！!？?…]$/;

export function isInterpreterClauseReady(text: string): boolean {
  return CLAUSE_END_RE.test(text.trim());
}

export function unspokenInterpreterTail(
  full: string,
  spoken: Iterable<string>
): string | null {
  const normalized = full.trim();
  if (!normalized) return null;
  let longestPrefix = '';
  for (const item of spoken) {
    if (item === normalized) return null;
    if (normalized.startsWith(item) && item.length > longestPrefix.length) {
      longestPrefix = item;
    }
  }
  const rest = longestPrefix ? normalized.slice(longestPrefix.length).trim() : normalized;
  return rest || null;
}
