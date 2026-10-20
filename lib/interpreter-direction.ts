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
