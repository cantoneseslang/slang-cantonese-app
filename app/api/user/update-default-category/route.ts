import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { default_category_id } = body;

    if (!default_category_id) {
      return NextResponse.json(
        { error: 'default_category_idが必要です' },
        { status: 400 }
      );
    }

    // 会員種別チェック（シルバー・ゴールド会員のみ保存可能）
    const membershipType = user.user_metadata?.membership_type || 'free';
    if (membershipType === 'free') {
      return NextResponse.json(
        { error: 'ブロンズ会員はデフォルトカテゴリーの変更ができません。' },
        { status: 403 }
      );
    }

    // 既存のuser_metadataを取得してマージ
    const currentMetadata = user.user_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      default_category_id: default_category_id
    };

    // user_metadataを更新
    const { data, error } = await supabase.auth.updateUser({
      data: updatedMetadata
    });

    if (error) {
      console.error('❌ デフォルトカテゴリー保存エラー:', error);
      return NextResponse.json(
        { error: 'デフォルトカテゴリーの保存に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ デフォルトカテゴリー保存成功:', {
      userId: user.id,
      default_category_id: default_category_id,
      updatedMetadata: data.user?.user_metadata
    });

    return NextResponse.json({
      success: true,
      default_category_id: default_category_id,
      user_metadata: data.user?.user_metadata
    });
  } catch (error: any) {
    console.error('❌ デフォルトカテゴリー保存エラー:', error);
    return NextResponse.json(
      { error: 'デフォルトカテゴリーの保存に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}

