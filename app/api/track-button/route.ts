import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wordChinese, categoryId } = body;
    
    // ログを記録（本番環境ではデータベースに保存することを推奨）
    console.log('Button click tracked:', { wordChinese, categoryId, timestamp: new Date().toISOString() });
    
    // 成功レスポンスを返す（エラーを発生させない）
    return NextResponse.json({ success: true });
  } catch (error) {
    // エラーが発生しても静かに処理（ボタン機能に影響を与えない）
    console.error('Error tracking button:', error);
    return NextResponse.json({ success: false, error: 'Tracking failed' }, { status: 500 });
  }
}

