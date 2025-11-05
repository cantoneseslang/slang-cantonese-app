/**
 * Note記事のマークダウンからカテゴリーを生成してnote-categories.jsonに追加/更新するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/sync-note-category.ts <markdown-file-path> <note-url>
 * 
 * 例:
 * npx tsx scripts/sync-note-category.ts ../note-post-mcp/cantonese-100-phrases-new.md https://note.com/bestinksalesman/n/na050a2a8ccfc
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseNoteArticle } from '../lib/note-parser';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('使用方法: npx tsx scripts/sync-note-category.ts <markdown-file-path> <note-url>');
  process.exit(1);
}

const [markdownPath, noteUrl] = args;

// マークダウンファイルを読み込む
if (!fs.existsSync(markdownPath)) {
  console.error(`エラー: ファイルが見つかりません: ${markdownPath}`);
  process.exit(1);
}

const markdown = fs.readFileSync(markdownPath, 'utf-8');

// パース
const category = parseNoteArticle(markdown, noteUrl);

if (!category) {
  console.error('エラー: カテゴリーの抽出に失敗しました');
  process.exit(1);
}

// note-categories.jsonを読み込む
const categoriesPath = path.join(__dirname, '../data/note-categories.json');
let existingCategories: any[] = [];

if (fs.existsSync(categoriesPath)) {
  try {
    existingCategories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
  } catch (error) {
    console.warn('警告: note-categories.jsonの読み込みに失敗しました。新規作成します。');
    existingCategories = [];
  }
}

// 既存のカテゴリーを更新または新規追加
const existingIndex = existingCategories.findIndex(c => c.id === category.id);

if (existingIndex >= 0) {
  // 更新
  existingCategories[existingIndex] = {
    ...category,
    createdAt: existingCategories[existingIndex].createdAt || category.createdAt,
    updatedAt: new Date().toISOString(),
  };
  console.log(`✅ カテゴリーを更新しました: ${category.name}`);
} else {
  // 新規追加
  existingCategories.push(category);
  console.log(`✅ カテゴリーを追加しました: ${category.name}`);
}

// 保存
fs.writeFileSync(categoriesPath, JSON.stringify(existingCategories, null, 2), 'utf-8');

console.log(`📝 ${categoriesPath} に保存しました`);
console.log(`📊 単語数: ${category.words.length}`);
console.log(`🔗 URL: ${category.noteUrl}`);

