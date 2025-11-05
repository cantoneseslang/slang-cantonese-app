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
    const formattedUsers = (authUsers || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      username: u.user_metadata?.username || null,
      membership_type: u.user_metadata?.membership_type || 'free',
      has_password: !!u.encrypted_password,
      last_sign_in_at: u.last_sign_in_at,
      created_at: u.created_at,
      updated_at: u.updated_at,
      survey_gender: u.user_metadata?.survey_gender || null,
      survey_residence: u.user_metadata?.survey_residence || null,
      survey_residence_other: u.user_metadata?.survey_residence_other || null,
      survey_cantonese_level: u.user_metadata?.survey_cantonese_level || null,
      survey_completed: u.user_metadata?.survey_completed || false,
    }));

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
