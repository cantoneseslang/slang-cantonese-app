import { NextRequest, NextResponse } from 'next/server';
import { parseNoteArticle, extractNoteId } from '@/lib/note-parser';

/**
 * Note記事のURLまたはマークダウンコンテンツをパースして単語を抽出
 * 
 * POST /api/note/parse
 * Body: { noteUrl?: string, markdown?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteUrl, markdown } = body;

    if (!noteUrl && !markdown) {
      return NextResponse.json(
        { error: 'noteUrlまたはmarkdownが必要です' },
        { status: 400 }
      );
    }

    let content = markdown;

    // マークダウンが提供されていない場合、NoteのURLから取得を試みる
    if (!content && noteUrl) {
      // Noteの公開APIまたはスクレイピングを使用
      // 注意: Noteには公式APIがないため、実際の実装では以下が必要:
      // 1. Note記事のHTMLを取得
      // 2. マークダウンに変換（またはHTMLから直接抽出）
      // 3. パース
      
      // 現在はマークダウンが直接提供されることを想定
      return NextResponse.json(
        { error: '現在はmarkdownの直接提供が必要です。Note記事の取得機能は今後実装予定です。' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'マークダウンコンテンツが取得できませんでした' },
        { status: 400 }
      );
    }

    // Note記事をパース
    const parsedUrl = noteUrl || 'https://note.com/bestinksalesman/n/na050a2a8ccfc';
    const category = parseNoteArticle(content, parsedUrl);

    if (!category) {
      return NextResponse.json(
        { error: '単語を抽出できませんでした。マークダウンの形式を確認してください。' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error: any) {
    console.error('Note記事パースエラー:', error);
    return NextResponse.json(
      { error: error.message || 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

