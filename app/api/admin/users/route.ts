import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // 管理者チェック
    const adminEmails = ['bestinksalesman@gmail.com'];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    // Service Role Keyを使ってAdmin APIでユーザーを取得
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Service Role Keyが設定されていません' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Admin APIで全ユーザーを取得
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching users from auth:', authError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users', details: authError.message },
        { status: 500 }
      );
    }

    // デバッグ: 最初のユーザーのオブジェクト構造を確認（ゴールド会員が含まれる場合）
    const goldUser = (authUsers || []).find((u: any) => 
      u.email === 'bestinksalesman@gmail.com' || u.email === 'm.sakonhk@gmail.com'
    );
    if (goldUser) {
      console.log('🔍 ゴールド会員のオブジェクト構造:', {
        email: goldUser.email,
        keys: Object.keys(goldUser),
        user_metadata: goldUser.user_metadata,
        raw_user_meta_data: goldUser.raw_user_meta_data,
        app_metadata: goldUser.app_metadata,
        full_object: JSON.stringify(goldUser, null, 2).substring(0, 1000) // 最初の1000文字
      });
    }

    // ユーザー情報をフォーマット
    // Supabase JS SDKのlistUsers()が返すオブジェクトの構造を確認
    const formattedUsers = (authUsers || []).map((u: any) => {
      // Supabase JS SDKでは、user_metadataにraw_user_meta_dataの内容がマッピングされる
      // しかし、念のため両方を確認
      const userMeta = u.user_metadata || {};
      
      // デバッグ用: ゴールド会員のデータを確認
      if (userMeta.membership_type === 'lifetime') {
        console.log('🔍 ゴールド会員検出:', {
          email: u.email,
          membership_type: userMeta.membership_type,
          full_user_metadata: userMeta
        });
      }
      
      return {
        id: u.id,
        email: u.email,
        username: userMeta.username || null,
        membership_type: userMeta.membership_type || 'free',
        subscription_expires_at: userMeta.subscription_expires_at || null,
        has_password: !!u.encrypted_password,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        updated_at: u.updated_at,
        survey_gender: userMeta.survey_gender || null,
        survey_residence: userMeta.survey_residence || null,
        survey_residence_other: userMeta.survey_residence_other || null,
        survey_cantonese_level: userMeta.survey_cantonese_level || null,
        survey_completed: userMeta.survey_completed || false,
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
