/**
 * Note記事のマークダウンから広東語フレーズを抽出するパーサー
 */

export interface NoteWord {
  chinese: string;
  japanese: string;
  jyutping?: string;
  katakana?: string;
}

export interface NoteCategory {
  id: string; // note記事ID (例: "note_na050a2a8ccfc")
  name: string; // 記事タイトル
  noteUrl: string; // Note記事のURL
  words: NoteWord[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * マークダウンから単語を抽出
 * 形式: **番号. 日本語**：中国語 / 粤拼 / カタカナ
 */
export function parseNoteMarkdown(markdown: string): NoteWord[] {
  const words: NoteWord[] = [];
  
  // パターン1: **番号. 日本語**：中国語 / 粤拼 / カタカナ
  // パターン2: **番号. 日本語**：中国語 / 粤拼 / カタカナ読み
  const pattern = /\*\*(\d+)\.\s*([^*]+)\*\*[：:]\s*([^/\n]+)\s*\/\s*([^/\n]+)\s*\/\s*([^\n]+)/g;
  
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const [, number, japanese, chinese, jyutping, katakana] = match;
    
    words.push({
      chinese: chinese.trim(),
      japanese: japanese.trim(),
      jyutping: jyutping.trim(),
      katakana: katakana.trim(),
    });
  }
  
  return words;
}

/**
 * Note記事のURLから記事IDを抽出
 * 例: https://note.com/bestinksalesman/n/na050a2a8ccfc -> na050a2a8ccfc
 */
export function extractNoteId(noteUrl: string): string | null {
  const match = noteUrl.match(/\/n\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * マークダウンからタイトルを抽出（frontmatterまたは最初の見出し）
 */
export function extractTitle(markdown: string): string {
  // frontmatterからタイトルを抽出
  const frontmatterMatch = markdown.match(/^---\s*\ntitle:\s*(.+?)\s*\n/);
  if (frontmatterMatch) {
    return frontmatterMatch[1].trim();
  }
  
  // 最初の#見出しからタイトルを抽出
  const headingMatch = markdown.match(/^#\s+(.+?)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  return 'Note記事';
}

/**
 * Note記事のマークダウンを完全にパースしてカテゴリーオブジェクトを作成
 */
export function parseNoteArticle(
  markdown: string,
  noteUrl: string
): NoteCategory | null {
  const noteId = extractNoteId(noteUrl);
  if (!noteId) {
    return null;
  }
  
  const title = extractTitle(markdown);
  const words = parseNoteMarkdown(markdown);
  
  if (words.length === 0) {
    return null;
  }
  
  return {
    id: `note_${noteId}`,
    name: title,
    noteUrl,
    words: words.map(w => ({
      chinese: w.chinese,
      japanese: w.japanese,
      jyutping: w.jyutping, // 必須：Note記事から取得
      katakana: w.katakana, // 必須：Note記事から取得
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

