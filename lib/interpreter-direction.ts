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

const JA_CANNOT_SPEAK_JAPANESE_RE = /日本語[をがは]?[話しゃべ喋][せれ](ません|ない)/;

export function correctInterpreterTranslation(
  source: string,
  translated: string,
  direction: InterpreterDirection,
  language: 'cantonese' | 'mandarin' = 'cantonese'
): string {
  const spoken = source.replace(/\s+/g, '');
  const output = translated.trim();
  if (!spoken || !output || direction === 'yue-to-ja') return output;
  if (language === 'cantonese' && JA_CANNOT_SPEAK_JAPANESE_RE.test(spoken)) {
    return '我唔識講日文。';
  }
  if (language === 'mandarin' && JA_CANNOT_SPEAK_JAPANESE_RE.test(spoken)) {
    return '我不会说日语。';
  }
  return output;
}

export function pickPreferredTranslation(source: string, first: string, second: string): string {
  const a = first.trim();
  const b = second.trim();
  if (!a) return b;
  if (!b) return a;
  const spoken = source.replace(/\s+/g, '');
  if (/ません|ない/.test(spoken)) {
    const aNeg = /唔|不/.test(a);
    const bNeg = /唔|不/.test(b);
    if (aNeg && !bNeg) return a;
    if (bNeg && !aNeg) return b;
  }
  return a.length >= b.length ? a : b;
}

function isSameInterpreterUtterance(
  left: { source: string; translation: string },
  right: { source: string; translation: string }
): boolean {
  if (
    left.source &&
    right.source &&
    (left.source === right.source || left.source.startsWith(right.source) || right.source.startsWith(left.source))
  ) {
    return true;
  }
  if (
    left.translation &&
    right.translation &&
    (left.translation === right.translation ||
      left.translation.startsWith(right.translation) ||
      right.translation.startsWith(left.translation))
  ) {
    return true;
  }
  const a = `${left.translation || left.source}`.replace(/[。．.！!？?\s]/g, '');
  const b = `${right.translation || right.source}`.replace(/[。．.！!？?\s]/g, '');
  if (!a || !b || a[0] !== b[0]) return false;
  if (a.length <= 4 || b.length <= 4) return true;
  return /識講日文/.test(a) && /識講日文/.test(b);
}

export function collapseInterpreterTurns<T extends { id: string; source: string; translation: string }>(
  turns: T[]
): T[] {
  const collapsed: T[] = [];
  for (const turn of turns) {
    const last = collapsed[collapsed.length - 1];
    if (!last || !isSameInterpreterUtterance(last, turn)) {
      collapsed.push(turn);
      continue;
    }
    const source = last.source.length >= turn.source.length ? last.source : turn.source;
    collapsed[collapsed.length - 1] = {
      ...last,
      source,
      translation: pickPreferredTranslation(source, last.translation, turn.translation),
    };
  }
  return collapsed;
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
