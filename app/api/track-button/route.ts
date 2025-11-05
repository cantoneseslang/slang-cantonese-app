import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // ログインしていない場合は記録しない（エラーを発生させない）
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const { wordChinese, categoryId } = body;
    
    // button_keyは既存のデータ形式に合わせて "categoryId:wordChinese" 形式を使用
    // 既存データがこの形式で保存されているため、一貫性を保つ
    const buttonKey = categoryId && wordChinese 
      ? `${categoryId}:${wordChinese}` 
      : wordChinese || '';
    
    if (!buttonKey) {
      return NextResponse.json({ success: true });
    }

    // Supabaseのuser_button_eventsテーブルに保存
    // 重複を防ぐため、既に存在する場合はスキップ（エラーを無視）
    const { error } = await supabase
      .from('user_button_events')
      .insert({
        user_id: user.id,
        button_key: buttonKey,
        category_id: categoryId || null
      });

    if (error) {
      // エラーが発生しても静かに処理（ボタン機能に影響を与えない）
      console.error('Error tracking button to Supabase:', error);
      // 重複エラーなどは無視
      if (error.code !== '23505') { // 23505は重複キーエラー
        console.error('Unexpected error:', error);
      }
    }
    
    // 成功レスポンスを返す（エラーを発生させない）
    return NextResponse.json({ success: true });
  } catch (error) {
    // エラーが発生しても静かに処理（ボタン機能に影響を与えない）
    console.error('Error tracking button:', error);
    return NextResponse.json({ success: true }); // エラーでも成功を返す（ボタン機能に影響を与えない）
  }
}
