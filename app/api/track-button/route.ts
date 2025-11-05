import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // ログインしていない場合は記録しない（エラーを発生させない）
    if (!user) {
      console.log('[track-button] ユーザーがログインしていません');
      return NextResponse.json({ success: true, logged: false, reason: 'not_logged_in' });
    }

    console.log('[track-button] ユーザー認証成功:', { userId: user.id, email: user.email });

    const body = await request.json();
    const { wordChinese, categoryId } = body;
    
    console.log('[track-button] リクエストデータ:', { wordChinese, categoryId });
    
    // button_keyは既存のデータ形式に合わせて "categoryId:wordChinese" 形式を使用
    // 既存データがこの形式で保存されているため、一貫性を保つ
    const buttonKey = categoryId && wordChinese 
      ? `${categoryId}:${wordChinese}` 
      : wordChinese || '';
    
    if (!buttonKey) {
      console.log('[track-button] buttonKeyが空のためスキップ');
      return NextResponse.json({ success: true, logged: false, reason: 'empty_button_key' });
    }

    console.log('[track-button] データベースに保存:', { userId: user.id, buttonKey, categoryId });

    // Supabaseのuser_button_eventsテーブルに保存
    // 重複を防ぐため、既に存在する場合はスキップ（エラーを無視）
    const { data, error } = await supabase
      .from('user_button_events')
      .insert({
        user_id: user.id,
        button_key: buttonKey,
        category_id: categoryId || null
      })
      .select();

    if (error) {
      // エラーが発生しても静かに処理（ボタン機能に影響を与えない）
      console.error('[track-button] データベース保存エラー:', error);
      // 重複エラーなどは無視
      if (error.code !== '23505') { // 23505は重複キーエラー
        console.error('[track-button] 予期しないエラー:', error);
        return NextResponse.json({ success: false, logged: false, error: error.message });
      } else {
        console.log('[track-button] 重複データのためスキップ（正常）');
      }
    } else {
      console.log('[track-button] データベース保存成功:', data);
    }
    
    // 成功レスポンスを返す（エラーを発生させない）
    return NextResponse.json({ success: true, logged: true });
  } catch (error: any) {
    // エラーが発生しても静かに処理（ボタン機能に影響を与えない）
    console.error('[track-button] 予期しないエラー:', error);
    return NextResponse.json({ success: false, logged: false, error: error?.message || 'Unknown error' });
  }
}

