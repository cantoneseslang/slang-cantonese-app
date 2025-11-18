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

    // ユーザー情報をフォーマット
    // user_metadataとraw_user_meta_dataの両方を確認（raw_user_meta_dataが優先）
    const formattedUsers = (authUsers || []).map((u: any) => {
      // raw_user_meta_dataを優先し、なければuser_metadataを使用
      const rawMeta = u.raw_user_meta_data || {};
      const userMeta = u.user_metadata || {};
      
      // デバッグ用: ゴールド会員のデータを確認
      if (rawMeta.membership_type === 'lifetime' || userMeta.membership_type === 'lifetime') {
        console.log('🔍 ゴールド会員検出:', {
          email: u.email,
          raw_user_meta_data: rawMeta.membership_type,
          user_metadata: userMeta.membership_type,
          full_raw: rawMeta,
          full_user: userMeta
        });
      }
      
      return {
        id: u.id,
        email: u.email,
        username: rawMeta.username || userMeta.username || null,
        membership_type: rawMeta.membership_type || userMeta.membership_type || 'free',
        subscription_expires_at: rawMeta.subscription_expires_at || userMeta.subscription_expires_at || null,
        has_password: !!u.encrypted_password,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        updated_at: u.updated_at,
        survey_gender: rawMeta.survey_gender || userMeta.survey_gender || null,
        survey_residence: rawMeta.survey_residence || userMeta.survey_residence || null,
        survey_residence_other: rawMeta.survey_residence_other || userMeta.survey_residence_other || null,
        survey_cantonese_level: rawMeta.survey_cantonese_level || userMeta.survey_cantonese_level || null,
        survey_completed: rawMeta.survey_completed !== undefined ? rawMeta.survey_completed : (userMeta.survey_completed || false),
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
