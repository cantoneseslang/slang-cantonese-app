import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

    // Service Role Keyを使用してAdmin APIで確実に更新
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEYが設定されていません');
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // 既存のuser_metadataを取得してマージ
    const currentMetadata = user.user_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      default_category_id: default_category_id
    };

    // Admin APIを使用してuser_metadataを更新（確実に保存される）
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: updatedMetadata
      }
    );

    if (adminError) {
      console.error('❌ デフォルトカテゴリー保存エラー（Admin API）:', adminError);
      return NextResponse.json(
        { error: 'デフォルトカテゴリーの保存に失敗しました', details: adminError.message },
        { status: 500 }
      );
    }

    // 保存が成功したら、実際にSupabaseから取得して確認
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (verifyError) {
      console.error('❌ 保存確認エラー:', verifyError);
    } else {
      const savedCategoryId = verifyData.user?.user_metadata?.default_category_id;
      console.log('✅ デフォルトカテゴリー保存成功（Admin API）:', {
        userId: user.id,
        requestedCategoryId: default_category_id,
        savedCategoryId: savedCategoryId,
        isMatch: savedCategoryId === default_category_id,
        allMetadata: verifyData.user?.user_metadata
      });
      
      // 保存が正しく行われているか確認
      if (savedCategoryId !== default_category_id) {
        console.error('❌ 保存された値が要求された値と一致しません:', {
          requested: default_category_id,
          saved: savedCategoryId
        });
        return NextResponse.json(
          { error: 'デフォルトカテゴリーの保存に失敗しました（値の不一致）' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      default_category_id: default_category_id,
      user_metadata: verifyData?.user?.user_metadata || adminData.user?.user_metadata,
      verified: !verifyError && verifyData?.user?.user_metadata?.default_category_id === default_category_id
    });
  } catch (error: any) {
    console.error('❌ デフォルトカテゴリー保存エラー:', error);
    return NextResponse.json(
      { error: 'デフォルトカテゴリーの保存に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}

